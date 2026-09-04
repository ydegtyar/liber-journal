import React, { useMemo, useState } from 'react';
import {
  Box,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Typography,
  IconButton,
  Tooltip,
  Button,
  Snackbar,
  Alert,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import TableViewIcon from '@mui/icons-material/TableView';
import { useTranslation } from 'react-i18next';
import { Trade } from '../../types/trade';
import { NumberFormatOption } from '../../types/preferences';
import { formatCurrency } from '../../lib/formatters';
import { getTradeDateKey, formatDisplayDate } from '../../lib/xlsxTemplate';

interface DailyOrdersMatrixTableProps {
  trades: Trade[];
  currency?: string;
  numberFormat?: NumberFormatOption;
  onExportXlsx?: () => void;
  isExporting?: boolean;
}

interface DayRowData {
  dateKey: string;
  displayDate: string;
  trades: Trade[];
  orderCount: number;
  dailyPnl: number;
}

export const DailyOrdersMatrixTable: React.FC<DailyOrdersMatrixTableProps> = ({
  trades,
  currency = 'USD',
  numberFormat = 'locale',
  onExportXlsx,
  isExporting = false,
}) => {
  const { t } = useTranslation();
  const [copiedRowKey, setCopiedRowKey] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Dropdown menu state for copy options
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedDayRow, setSelectedDayRow] = useState<DayRowData | null>(null);

  // Group trades by closed date
  const { dayRows, orderColumnsCount, totalOrders, totalPnl, columnSums } = useMemo(() => {
    const dayGroups: Record<string, Trade[]> = {};

    // Sort trades chronologically ascending
    const sortedTrades = [...trades].sort((a, b) => {
      return new Date(a.closedAt).getTime() - new Date(b.closedAt).getTime();
    });

    for (const trade of sortedTrades) {
      const dateKey = getTradeDateKey(trade.closedAt);
      if (!dayGroups[dateKey]) {
        dayGroups[dateKey] = [];
      }
      dayGroups[dateKey].push(trade);
    }

    const sortedKeys = Object.keys(dayGroups).sort();
    const maxTrades = sortedKeys.length > 0
      ? Math.max(...sortedKeys.map((k) => dayGroups[k].length))
      : 10;
    const colsCount = Math.max(maxTrades, 12);

    let sumOrders = 0;
    let sumPnl = 0;
    const colSums: number[] = new Array(colsCount).fill(0);

    const rows: DayRowData[] = sortedKeys.map((dateKey) => {
      const dayTrades = dayGroups[dateKey];
      const count = dayTrades.length;
      const dayPnl = dayTrades.reduce((acc, trade) => acc + trade.pnl, 0);

      sumOrders += count;
      sumPnl += dayPnl;

      dayTrades.forEach((trade, idx) => {
        if (idx < colsCount) {
          colSums[idx] += trade.pnl;
        }
      });

      return {
        dateKey,
        displayDate: formatDisplayDate(dateKey),
        trades: dayTrades,
        orderCount: count,
        dailyPnl: Math.round(dayPnl * 100) / 100,
      };
    });

    return {
      dayRows: rows,
      orderColumnsCount: colsCount,
      totalOrders: sumOrders,
      totalPnl: Math.round(sumPnl * 100) / 100,
      columnSums: colSums.map((v) => Math.round(v * 100) / 100),
    };
  }, [trades]);

  // Formats raw numeric values for spreadsheet copy/paste
  const formatSpreadsheetNumber = (val: number): string => {
    const fixed = val.toFixed(2);
    if (numberFormat === 'comma') {
      return fixed.replace('.', ',');
    }
    return fixed;
  };

  // Copies string to clipboard with fallback
  const copyToClipboard = async (text: string, rowKey: string, message: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      setCopiedRowKey(rowKey);
      setSnackbarMessage(message);
      setSnackbarOpen(true);

      setTimeout(() => {
        setCopiedRowKey((prev) => (prev === rowKey ? null : prev));
      }, 2500);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  // Copy single day row (full row: Date \t Count \t DailyPnL \t Trades...)
  const handleCopyFullRow = (row: DayRowData) => {
    const cells: string[] = [
      row.displayDate,
      String(row.orderCount),
      formatSpreadsheetNumber(row.dailyPnl),
      ...row.trades.map((t) => formatSpreadsheetNumber(t.pnl)),
    ];

    // Pad empty cells up to orderColumnsCount
    while (cells.length < 3 + orderColumnsCount) {
      cells.push('');
    }

    const tsv = cells.join('\t');
    copyToClipboard(
      tsv,
      row.dateKey,
      `${t('dailyMatrix.copied')} (${row.displayDate})`
    );
  };

  // Copy trade values only (without Date or Count, suitable for pasting from Col D)
  const handleCopyTradesOnly = (row: DayRowData) => {
    const cells = row.trades.map((t) => formatSpreadsheetNumber(t.pnl));
    const tsv = cells.join('\t');
    copyToClipboard(
      tsv,
      row.dateKey,
      `${t('dailyMatrix.copyTradesOnly')}: ${row.displayDate}`
    );
  };

  // Copy all table rows in TSV
  const handleCopyAllRows = () => {
    if (dayRows.length === 0) return;

    // Header row
    const headers: string[] = [
      t('dailyMatrix.date'),
      t('dailyMatrix.closedOrders'),
      t('dailyMatrix.dailyPnl'),
      ...Array.from({ length: orderColumnsCount }, (_, i) => `${t('dailyMatrix.order')} ${i + 1}`),
    ];

    const lines: string[] = [headers.join('\t')];

    dayRows.forEach((row) => {
      const cells: string[] = [
        row.displayDate,
        String(row.orderCount),
        formatSpreadsheetNumber(row.dailyPnl),
        ...row.trades.map((t) => formatSpreadsheetNumber(t.pnl)),
      ];
      while (cells.length < 3 + orderColumnsCount) {
        cells.push('');
      }
      lines.push(cells.join('\t'));
    });

    // Totals line
    const totalsCells: string[] = [
      t('dailyMatrix.total'),
      String(totalOrders),
      formatSpreadsheetNumber(totalPnl),
      ...columnSums.map((val) => formatSpreadsheetNumber(val)),
    ];
    lines.push(totalsCells.join('\t'));

    copyToClipboard(lines.join('\n'), '__all__', t('dailyMatrix.copied'));
  };

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, row: DayRowData) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setSelectedDayRow(row);
  };

  const handleCloseMenu = () => {
    setMenuAnchorEl(null);
    setSelectedDayRow(null);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Top Banner & Fast Actions */}
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          backgroundColor: (theme) => theme.palette.background.paper,
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TableViewIcon sx={{ color: 'primary.main', fontSize: 20 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {t('dailyMatrix.title')}
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
            {t('dailyMatrix.subtitle')}
          </Typography>
        </Box>

        {/* Summary Badges & Table Level Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Chip
            size="small"
            variant="outlined"
            label={`${t('dailyMatrix.activeDays')}: ${dayRows.length}`}
            sx={{ fontWeight: 600, fontSize: '0.75rem' }}
          />
          <Chip
            size="small"
            variant="outlined"
            label={`${t('dailyMatrix.totalOrders')}: ${totalOrders}`}
            sx={{ fontWeight: 600, fontSize: '0.75rem' }}
          />
          <Chip
            size="small"
            label={`${t('dailyMatrix.monthlyPnl')}: ${formatCurrency(totalPnl, currency, numberFormat)}`}
            sx={{
              fontWeight: 700,
              fontSize: '0.75rem',
              backgroundColor: (theme) =>
                totalPnl >= 0 ? theme.palette.trade.gainBg : theme.palette.trade.lossBg,
              color: (theme) =>
                totalPnl >= 0 ? theme.palette.trade.gain : theme.palette.trade.loss,
              border: (theme) =>
                `1px solid ${totalPnl >= 0 ? theme.palette.trade.gainBorder : theme.palette.trade.lossBorder}`,
            }}
          />

          <Button
            size="small"
            variant="contained"
            startIcon={copiedRowKey === '__all__' ? <CheckIcon /> : <ContentCopyIcon />}
            onClick={handleCopyAllRows}
            disabled={dayRows.length === 0}
            color={copiedRowKey === '__all__' ? 'success' : 'primary'}
            sx={{ fontSize: '0.75rem', height: 30, textTransform: 'none' }}
          >
            {copiedRowKey === '__all__' ? t('dailyMatrix.copied') : t('dailyMatrix.copyAll')}
          </Button>

          {onExportXlsx && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              onClick={onExportXlsx}
              disabled={trades.length === 0 || isExporting}
              sx={{ fontSize: '0.75rem', height: 30, textTransform: 'none' }}
            >
              {t('common.exportXlsx')}
            </Button>
          )}
        </Box>
      </Paper>

      {/* Main Daily Orders Matrix Table */}
      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{
          maxHeight: 640,
          overflowX: 'auto',
          overflowY: 'auto',
        }}
      >
        <Table size="small" stickyHeader sx={{ minWidth: 900 }}>
          <TableHead>
            <TableRow>
              {/* Copy Action Column */}
              <TableCell
                sx={{
                  width: 60,
                  textAlign: 'center',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  position: 'sticky',
                  left: 0,
                  zIndex: 3,
                  backgroundColor: (theme) => theme.palette.background.paper,
                }}
              >
                Copy
              </TableCell>

              {/* Date Column */}
              <TableCell
                sx={{
                  width: 105,
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  position: 'sticky',
                  left: 60,
                  zIndex: 3,
                  backgroundColor: (theme) => theme.palette.background.paper,
                }}
              >
                {t('dailyMatrix.date')}
              </TableCell>

              {/* Closed Orders Count Column */}
              <TableCell
                sx={{
                  width: 90,
                  textAlign: 'center',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  backgroundColor: (theme) => theme.palette.background.paper,
                }}
              >
                {t('dailyMatrix.closedOrders')}
              </TableCell>

              {/* Daily P&L Column */}
              <TableCell
                sx={{
                  width: 110,
                  textAlign: 'right',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  backgroundColor: (theme) => theme.palette.background.paper,
                  borderRight: (theme) => `1px solid ${theme.palette.divider}`,
                }}
              >
                {t('dailyMatrix.dailyPnl')}
              </TableCell>

              {/* Sequential Trade Columns 1, 2, 3 ... N */}
              {Array.from({ length: orderColumnsCount }, (_, i) => (
                <TableCell
                  key={i}
                  sx={{
                    width: 75,
                    minWidth: 70,
                    textAlign: 'right',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    backgroundColor: (theme) => theme.palette.background.paper,
                  }}
                >
                  {i + 1}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {dayRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3 + orderColumnsCount + 1} align="center" sx={{ py: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    {t('dailyMatrix.noTrades')}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              dayRows.map((row) => {
                const isCopied = copiedRowKey === row.dateKey;

                return (
                  <TableRow
                    key={row.dateKey}
                    hover
                    sx={{
                      '&:hover': {
                        backgroundColor: (theme) => theme.palette.action.hover,
                      },
                    }}
                  >
                    {/* Copy Button Cell (Sticky Left) */}
                    <TableCell
                      sx={{
                        textAlign: 'center',
                        p: 0.5,
                        position: 'sticky',
                        left: 0,
                        zIndex: 2,
                        backgroundColor: (theme) => theme.palette.background.paper,
                        borderRight: (theme) => `1px solid ${theme.palette.divider}`,
                      }}
                    >
                      <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>
                        <Tooltip title={isCopied ? t('dailyMatrix.copied') : t('dailyMatrix.copyRowTooltip')} arrow>
                          <IconButton
                            size="small"
                            onClick={() => handleCopyFullRow(row)}
                            color={isCopied ? 'success' : 'default'}
                            sx={{
                              p: 0.5,
                              transition: 'all 0.2s',
                              backgroundColor: isCopied ? 'success.main' : 'transparent',
                              color: isCopied ? '#fff' : 'inherit',
                              '&:hover': {
                                backgroundColor: isCopied ? 'success.dark' : undefined,
                              },
                            }}
                          >
                            {isCopied ? <CheckIcon sx={{ fontSize: 16 }} /> : <ContentCopyIcon sx={{ fontSize: 16 }} />}
                          </IconButton>
                        </Tooltip>

                        <IconButton
                          size="small"
                          onClick={(e) => handleOpenMenu(e, row)}
                          sx={{ p: 0.25, color: 'text.secondary' }}
                        >
                          <MoreVertIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Box>
                    </TableCell>

                    {/* Date Cell (Sticky Left) */}
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        fontFamily: "'JetBrains Mono', monospace",
                        position: 'sticky',
                        left: 60,
                        zIndex: 2,
                        backgroundColor: (theme) => theme.palette.background.paper,
                        borderRight: (theme) => `1px solid ${theme.palette.divider}`,
                      }}
                    >
                      {row.displayDate}
                    </TableCell>

                    {/* Closed Orders Count */}
                    <TableCell
                      sx={{
                        textAlign: 'center',
                        fontWeight: 700,
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '0.8rem',
                        color: 'text.secondary',
                      }}
                    >
                      {row.orderCount}
                    </TableCell>

                    {/* Daily P&L Cell */}
                    <TableCell
                      sx={{
                        textAlign: 'right',
                        fontWeight: 700,
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '0.85rem',
                        borderRight: (theme) => `1px solid ${theme.palette.divider}`,
                        color: (theme) =>
                          row.dailyPnl > 0
                            ? theme.palette.trade.gain
                            : row.dailyPnl < 0
                              ? theme.palette.trade.loss
                              : theme.palette.trade.breakeven,
                      }}
                    >
                      {formatCurrency(row.dailyPnl, currency, numberFormat)}
                    </TableCell>

                    {/* Individual Trade P&L Cells (1..N) */}
                    {Array.from({ length: orderColumnsCount }, (_, cIdx) => {
                      const trade = row.trades[cIdx];

                      if (!trade) {
                        return (
                          <TableCell
                            key={cIdx}
                            sx={{
                              textAlign: 'right',
                              p: 0.5,
                              color: 'text.disabled',
                              fontSize: '0.75rem',
                              borderLeft: (theme) => `1px solid ${theme.palette.divider}`,
                            }}
                          >
                            —
                          </TableCell>
                        );
                      }

                      const isGain = trade.pnl > 0;
                      const isLoss = trade.pnl < 0;

                      return (
                        <TableCell
                          key={cIdx}
                          sx={{
                            textAlign: 'right',
                            p: 0.75,
                            borderLeft: (theme) => `1px solid ${theme.palette.divider}`,
                            backgroundColor: (theme) =>
                              isGain
                                ? theme.palette.trade.gainBg
                                : isLoss
                                  ? theme.palette.trade.lossBg
                                  : 'transparent',
                          }}
                        >
                          <Tooltip
                            arrow
                            title={
                              <Box sx={{ p: 0.5, fontSize: '0.75rem' }}>
                                <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>
                                  {trade.instrument} ({trade.direction.toUpperCase()})
                                </Typography>
                                <Typography variant="caption" sx={{ display: 'block' }}>
                                  Return: {trade.grossReturn.toFixed(2)}% | P&L: {formatCurrency(trade.pnl, currency, numberFormat)}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                  Close: {trade.closedAt.substring(11, 19)}
                                </Typography>
                              </Box>
                            }
                          >
                            <Typography
                              component="span"
                              sx={{
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: '0.78rem',
                                fontWeight: Math.abs(trade.pnl) >= 5 ? 700 : 500,
                                color: (theme) =>
                                  isGain
                                    ? theme.palette.trade.gain
                                    : isLoss
                                      ? theme.palette.trade.loss
                                      : theme.palette.trade.breakeven,
                                display: 'inline-block',
                                cursor: 'default',
                              }}
                            >
                              {trade.pnl > 0 ? `+${trade.pnl.toFixed(2)}` : trade.pnl.toFixed(2)}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })
            )}

            {/* Totals Row */}
            {dayRows.length > 0 && (
              <TableRow
                sx={{
                  backgroundColor: (theme) => theme.palette.action.hover,
                  borderTop: (theme) => `2px solid ${theme.palette.divider}`,
                }}
              >
                {/* Total Action */}
                <TableCell
                  sx={{
                    textAlign: 'center',
                    position: 'sticky',
                    left: 0,
                    zIndex: 2,
                    backgroundColor: (theme) => theme.palette.action.hover,
                  }}
                >
                  <Tooltip title={t('dailyMatrix.copyAll')} arrow>
                    <IconButton size="small" onClick={handleCopyAllRows} sx={{ p: 0.5 }}>
                      <ContentCopyIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                </TableCell>

                {/* Total Label */}
                <TableCell
                  sx={{
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    position: 'sticky',
                    left: 60,
                    zIndex: 2,
                    backgroundColor: (theme) => theme.palette.action.hover,
                    borderRight: (theme) => `1px solid ${theme.palette.divider}`,
                  }}
                >
                  {t('dailyMatrix.total')}
                </TableCell>

                {/* Total Orders Count */}
                <TableCell
                  sx={{
                    textAlign: 'center',
                    fontWeight: 800,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '0.8rem',
                  }}
                >
                  {totalOrders}
                </TableCell>

                {/* Total Cumulative P&L */}
                <TableCell
                  sx={{
                    textAlign: 'right',
                    fontWeight: 800,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '0.9rem',
                    borderRight: (theme) => `1px solid ${theme.palette.divider}`,
                    color: (theme) =>
                      totalPnl > 0
                        ? theme.palette.trade.gain
                        : totalPnl < 0
                          ? theme.palette.trade.loss
                          : theme.palette.trade.breakeven,
                  }}
                >
                  {formatCurrency(totalPnl, currency, numberFormat)}
                </TableCell>

                {/* Column Sums for each Trade position */}
                {columnSums.map((cSum, idx) => (
                  <TableCell
                    key={idx}
                    sx={{
                      textAlign: 'right',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      borderLeft: (theme) => `1px solid ${theme.palette.divider}`,
                      color: (theme) =>
                        cSum > 0
                          ? theme.palette.trade.gain
                          : cSum < 0
                            ? theme.palette.trade.loss
                            : 'text.secondary',
                    }}
                  >
                    {cSum !== 0 ? (cSum > 0 ? `+${cSum.toFixed(2)}` : cSum.toFixed(2)) : '—'}
                  </TableCell>
                ))}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Context Menu for Copy Options */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleCloseMenu}
      >
        <MenuItem
          onClick={() => {
            if (selectedDayRow) handleCopyFullRow(selectedDayRow);
            handleCloseMenu();
          }}
        >
          <ListItemIcon>
            <ContentCopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary={t('dailyMatrix.copyRow')}
            secondary="Date + Orders + Daily P&L + Trades"
          />
        </MenuItem>

        <MenuItem
          onClick={() => {
            if (selectedDayRow) handleCopyTradesOnly(selectedDayRow);
            handleCloseMenu();
          }}
        >
          <ListItemIcon>
            <ContentCopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary={t('dailyMatrix.copyTradesOnly')}
            secondary="Trade values only (for Col C onwards)"
          />
        </MenuItem>
      </Menu>

      {/* Snackbar notification on successful copy */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="success"
          variant="filled"
          sx={{ width: '100%', fontWeight: 600, fontSize: '0.85rem' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};
