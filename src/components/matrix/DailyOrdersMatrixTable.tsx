import React, { useMemo, useState, useEffect, useCallback } from 'react';
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
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { useTranslation } from 'react-i18next';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverlay,
} from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { SortableColumnHeader } from './SortableColumnHeader';
import { ColumnDragPreview, DayRowData } from './ColumnDragPreview';

import { Trade } from '../../types/trade';
import {
  NumberFormatOption,
  MatrixColumnBlockId,
  DEFAULT_MATRIX_COLUMN_ORDER,
} from '../../types/preferences';
import { formatCurrency } from '../../lib/formatters';
import { getTradeDateKey, formatDisplayDate } from '../../lib/dateUtils';
import { getStoredMatrixColumnOrder, saveMatrixColumnOrder } from '../../lib/db';

interface Props {
  trades: Trade[];
  currency?: string;
  numberFormat?: NumberFormatOption;
  onExportXlsx?: () => void;
  isExporting?: boolean;
  columnOrder?: MatrixColumnBlockId[];
  onColumnOrderChange?: (order: MatrixColumnBlockId[]) => void;
}

const DailyOrdersMatrixTableComponent: React.FC<Props> = ({
  trades,
  currency = 'USD',
  numberFormat = 'locale',
  onExportXlsx,
  isExporting = false,
  columnOrder: propColumnOrder,
  onColumnOrderChange,
}) => {
  const { t } = useTranslation();
  const [copiedRowKey, setCopiedRowKey] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Dropdown menu state for copy options
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedDayRow, setSelectedDayRow] = useState<DayRowData | null>(null);

  // Column block order state
  const [columnOrder, setColumnOrder] = useState<MatrixColumnBlockId[]>(() => {
    return propColumnOrder && propColumnOrder.length === 4
      ? propColumnOrder
      : DEFAULT_MATRIX_COLUMN_ORDER;
  });
  const [prevPropOrder, setPrevPropOrder] = useState(propColumnOrder);
  if (propColumnOrder !== prevPropOrder) {
    setPrevPropOrder(propColumnOrder);
    if (propColumnOrder && propColumnOrder.length === 4) {
      setColumnOrder(propColumnOrder);
    }
  }

  // Load stored column order from IndexedDB on initial mount
  useEffect(() => {
    let isMounted = true;
    getStoredMatrixColumnOrder()
      .then((stored) => {
        if (isMounted && stored && stored.length === 4) {
          setColumnOrder(stored);
        }
      })
      .catch(console.error);
    return () => {
      isMounted = false;
    };
  }, []);

  // Configure drag sensors with 5px threshold to allow clean clicks
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  // Active dragging column block id for drag preview
  const [activeDragId, setActiveDragId] = useState<MatrixColumnBlockId | null>(null);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(event.active.id as MatrixColumnBlockId);
  }, []);

  const handleDragCancel = useCallback(() => {
    setActiveDragId(null);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDragId(null);
      const { active, over } = event;
      if (over && active.id !== over.id) {
        const oldIndex = columnOrder.indexOf(active.id as MatrixColumnBlockId);
        const newIndex = columnOrder.indexOf(over.id as MatrixColumnBlockId);
        if (oldIndex !== -1 && newIndex !== -1) {
          const nextOrder = arrayMove(columnOrder, oldIndex, newIndex);
          setColumnOrder(nextOrder);
          saveMatrixColumnOrder(nextOrder).catch(console.error);
          if (onColumnOrderChange) {
            onColumnOrderChange(nextOrder);
          }
        }
      }
    },
    [columnOrder, onColumnOrderChange]
  );

  const handleResetColumnOrder = useCallback(async () => {
    setColumnOrder(DEFAULT_MATRIX_COLUMN_ORDER);
    await saveMatrixColumnOrder(DEFAULT_MATRIX_COLUMN_ORDER);
    if (onColumnOrderChange) {
      onColumnOrderChange(DEFAULT_MATRIX_COLUMN_ORDER);
    }
  }, [onColumnOrderChange]);

  const isCustomOrder = useMemo(() => {
    return (
      columnOrder.length !== DEFAULT_MATRIX_COLUMN_ORDER.length ||
      columnOrder.some((col, idx) => col !== DEFAULT_MATRIX_COLUMN_ORDER[idx])
    );
  }, [columnOrder]);

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
    const maxTrades =
      sortedKeys.length > 0 ? Math.max(...sortedKeys.map((k) => dayGroups[k].length)) : 10;
    const colsCount = Math.max(maxTrades, 12);

    let sumOrders = 0;
    let sumPnl = 0;
    const colSums: number[] = new Array(colsCount).fill(0);
    const rows: DayRowData[] = [];

    for (const dateKey of sortedKeys) {
      const dayTrades = dayGroups[dateKey];
      const count = dayTrades.length;
      const dayPnl = dayTrades.reduce((acc, trade) => acc + trade.pnl, 0);

      sumOrders += count;
      sumPnl += dayPnl;

      for (let idx = 0; idx < Math.min(dayTrades.length, colsCount); idx++) {
        colSums[idx] += dayTrades[idx].pnl;
      }

      rows.push({
        dateKey,
        displayDate: formatDisplayDate(dateKey),
        trades: dayTrades,
        orderCount: count,
        dailyPnl: Math.round(dayPnl * 100) / 100,
      });
    }

    return {
      dayRows: rows,
      orderColumnsCount: colsCount,
      totalOrders: sumOrders,
      totalPnl: Math.round(sumPnl * 100) / 100,
      columnSums: colSums.map((v) => Math.round(v * 100) / 100),
    };
  }, [trades]);

  // Formats raw numeric values for spreadsheet copy/paste
  const formatSpreadsheetNumber = useCallback(
    (val: number): string => {
      const fixed = val.toFixed(2);
      if (numberFormat === 'comma') {
        return fixed.replace('.', ',');
      }
      return fixed;
    },
    [numberFormat]
  );

  // Copies string to clipboard with fallback
  const copyToClipboard = useCallback(async (text: string, rowKey: string, message: string) => {
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
  }, []);

  // Copy single day row adhering to dynamic column block order
  const handleCopyFullRow = useCallback(
    (row: DayRowData) => {
      const cells: string[] = [];

      columnOrder.forEach((blockId) => {
        if (blockId === 'date') {
          cells.push(row.displayDate);
        } else if (blockId === 'ordersCount') {
          cells.push(String(row.orderCount));
        } else if (blockId === 'dailyPnl') {
          cells.push(formatSpreadsheetNumber(row.dailyPnl));
        } else if (blockId === 'orders') {
          row.trades.forEach((t) => cells.push(formatSpreadsheetNumber(t.pnl)));
          for (let i = row.trades.length; i < orderColumnsCount; i++) {
            cells.push('');
          }
        }
      });

      const tsv = cells.join('\t');
      copyToClipboard(tsv, row.dateKey, `${t('dailyMatrix.copied')} (${row.displayDate})`);
    },
    [columnOrder, formatSpreadsheetNumber, orderColumnsCount, copyToClipboard, t]
  );

  // Copy trade values only (without Date or Count)
  const handleCopyTradesOnly = useCallback(
    (row: DayRowData) => {
      const cells = row.trades.map((t) => formatSpreadsheetNumber(t.pnl));
      const tsv = cells.join('\t');
      copyToClipboard(tsv, row.dateKey, `${t('dailyMatrix.copyTradesOnly')}: ${row.displayDate}`);
    },
    [formatSpreadsheetNumber, copyToClipboard, t]
  );

  // Copy all table rows adhering to dynamic column block order
  const handleCopyAllRows = useCallback(() => {
    if (dayRows.length === 0) return;

    // Header row
    const headers: string[] = [];
    columnOrder.forEach((blockId) => {
      if (blockId === 'date') {
        headers.push(t('dailyMatrix.date'));
      } else if (blockId === 'ordersCount') {
        headers.push(t('dailyMatrix.closedOrders'));
      } else if (blockId === 'dailyPnl') {
        headers.push(t('dailyMatrix.dailyPnl'));
      } else if (blockId === 'orders') {
        for (let i = 0; i < orderColumnsCount; i++) {
          headers.push(`${t('dailyMatrix.order')} ${i + 1}`);
        }
      }
    });

    const lines: string[] = [headers.join('\t')];

    dayRows.forEach((row) => {
      const cells: string[] = [];
      columnOrder.forEach((blockId) => {
        if (blockId === 'date') {
          cells.push(row.displayDate);
        } else if (blockId === 'ordersCount') {
          cells.push(String(row.orderCount));
        } else if (blockId === 'dailyPnl') {
          cells.push(formatSpreadsheetNumber(row.dailyPnl));
        } else if (blockId === 'orders') {
          row.trades.forEach((t) => cells.push(formatSpreadsheetNumber(t.pnl)));
          for (let i = row.trades.length; i < orderColumnsCount; i++) {
            cells.push('');
          }
        }
      });
      lines.push(cells.join('\t'));
    });

    // Totals line
    const totalsCells: string[] = [];
    columnOrder.forEach((blockId) => {
      if (blockId === 'date') {
        totalsCells.push(t('dailyMatrix.total'));
      } else if (blockId === 'ordersCount') {
        totalsCells.push(String(totalOrders));
      } else if (blockId === 'dailyPnl') {
        totalsCells.push(formatSpreadsheetNumber(totalPnl));
      } else if (blockId === 'orders') {
        columnSums.forEach((val) => totalsCells.push(formatSpreadsheetNumber(val)));
      }
    });
    lines.push(totalsCells.join('\t'));

    copyToClipboard(lines.join('\n'), '__all__', t('dailyMatrix.copied'));
  }, [
    dayRows,
    columnOrder,
    t,
    orderColumnsCount,
    formatSpreadsheetNumber,
    columnSums,
    copyToClipboard,
  ]);

  const handleOpenMenu = useCallback((event: React.MouseEvent<HTMLElement>, row: DayRowData) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setSelectedDayRow(row);
  }, []);

  const handleCloseMenu = useCallback(() => {
    setMenuAnchorEl(null);
    setSelectedDayRow(null);
  }, []);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
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
        <div>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TableViewIcon sx={{ color: 'primary.main', fontSize: 20 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {t('dailyMatrix.title')}
            </Typography>
          </Box>
        </div>

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

          {isCustomOrder && (
            <Tooltip title={t('dailyMatrix.resetColumns')} arrow>
              <Button
                size="small"
                variant="outlined"
                color="secondary"
                startIcon={<RestartAltIcon />}
                onClick={handleResetColumnOrder}
                sx={{ fontSize: '0.75rem', height: 30, textTransform: 'none' }}
              >
                {t('dailyMatrix.resetColumns')}
              </Button>
            </Tooltip>
          )}

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

      {/* Main Daily Orders Matrix Table with DND Column Blocks */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
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
                {/* Copy Action Column (Sticky Left) */}
                <TableCell
                  rowSpan={2}
                  sx={{
                    width: 60,
                    textAlign: 'center',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    position: 'sticky',
                    left: 0,
                    zIndex: 4,
                    backgroundColor: (theme) => theme.palette.background.paper,
                    borderRight: (theme) => `1px solid ${theme.palette.divider}`,
                  }}
                >
                  Copy
                </TableCell>

                <SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
                  {columnOrder.map((blockId) => {
                    if (blockId === 'date') {
                      return (
                        <SortableColumnHeader
                          key="date"
                          id="date"
                          rowSpan={2}
                          sx={{
                            width: 120,
                            minWidth: 100,
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            backgroundColor: (theme) => theme.palette.background.paper,
                            borderRight: (theme) => `1px solid ${theme.palette.divider}`,
                          }}
                        >
                          <Tooltip title={t('dailyMatrix.reorderTooltip')} arrow>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 0.5,
                              }}
                            >
                              <DragIndicatorIcon
                                className="drag-handle"
                                sx={{
                                  fontSize: 16,
                                  opacity: 0.4,
                                  color: 'text.secondary',
                                  transition: 'opacity 0.2s',
                                }}
                              />
                              <span>{t('dailyMatrix.date')}</span>
                            </Box>
                          </Tooltip>
                        </SortableColumnHeader>
                      );
                    }

                    if (blockId === 'ordersCount') {
                      return (
                        <SortableColumnHeader
                          key="ordersCount"
                          id="ordersCount"
                          rowSpan={2}
                          sx={{
                            width: 105,
                            minWidth: 95,
                            textAlign: 'center',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            backgroundColor: (theme) => theme.palette.background.paper,
                            borderRight: (theme) => `1px solid ${theme.palette.divider}`,
                          }}
                        >
                          <Tooltip title={t('dailyMatrix.reorderTooltip')} arrow>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 0.5,
                              }}
                            >
                              <DragIndicatorIcon
                                className="drag-handle"
                                sx={{
                                  fontSize: 16,
                                  opacity: 0.4,
                                  color: 'text.secondary',
                                  transition: 'opacity 0.2s',
                                }}
                              />
                              <span>{t('dailyMatrix.closedOrders')}</span>
                            </Box>
                          </Tooltip>
                        </SortableColumnHeader>
                      );
                    }

                    if (blockId === 'dailyPnl') {
                      return (
                        <SortableColumnHeader
                          key="dailyPnl"
                          id="dailyPnl"
                          rowSpan={2}
                          sx={{
                            width: 125,
                            minWidth: 115,
                            textAlign: 'right',
                            fontWeight: 800,
                            fontSize: '0.75rem',
                            backgroundColor: (theme) => theme.palette.background.paper,
                            borderRight: (theme) => `1px solid ${theme.palette.divider}`,
                          }}
                        >
                          <Tooltip title={t('dailyMatrix.reorderTooltip')} arrow>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-end',
                                gap: 0.5,
                              }}
                            >
                              <DragIndicatorIcon
                                className="drag-handle"
                                sx={{
                                  fontSize: 16,
                                  opacity: 0.4,
                                  color: 'text.secondary',
                                  transition: 'opacity 0.2s',
                                }}
                              />
                              <span>{t('dailyMatrix.dailyPnl')}</span>
                            </Box>
                          </Tooltip>
                        </SortableColumnHeader>
                      );
                    }

                    if (blockId === 'orders') {
                      return (
                        <SortableColumnHeader
                          key="orders"
                          id="orders"
                          colSpan={orderColumnsCount}
                          sx={{
                            textAlign: 'center',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            backgroundColor: (theme) => theme.palette.background.paper,
                            borderRight: (theme) => `1px solid ${theme.palette.divider}`,
                          }}
                        >
                          <Tooltip title={t('dailyMatrix.reorderTooltip')} arrow>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 0.5,
                              }}
                            >
                              <DragIndicatorIcon
                                className="drag-handle"
                                sx={{
                                  fontSize: 16,
                                  opacity: 0.4,
                                  color: 'text.secondary',
                                  transition: 'opacity 0.2s',
                                }}
                              />
                              <span>
                                {t('dailyMatrix.orders')} (1 - {orderColumnsCount})
                              </span>
                            </Box>
                          </Tooltip>
                        </SortableColumnHeader>
                      );
                    }

                    return null;
                  })}
                </SortableContext>
              </TableRow>

              {/* Sub-row for individual trade numbers 1..N */}
              <TableRow>
                {Array.from({ length: orderColumnsCount }, (_, i) => {
                  const isOrdersDragging = activeDragId === 'orders';
                  return (
                    <TableCell
                      key={i}
                      sx={{
                        width: 75,
                        minWidth: 70,
                        textAlign: 'right',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        backgroundColor: (theme) =>
                          isOrdersDragging
                            ? theme.palette.action.hover
                            : theme.palette.background.paper,
                        borderRight: (theme) => `1px solid ${theme.palette.divider}`,
                        borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
                        transition: 'background-color 0.2s',
                      }}
                    >
                      <Box sx={{ visibility: isOrdersDragging ? 'hidden' : 'visible' }}>
                        {i + 1}
                      </Box>
                    </TableCell>
                  );
                })}
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
                        transition: 'background-color 0.15s ease',
                        '&:hover': {
                          backgroundColor: (theme) => theme.palette.action.hover,
                        },
                        '&:hover td': {
                          backgroundColor: (theme) => theme.palette.action.hover,
                        },
                        '&:hover td.matrix-gain-cell': {
                          backgroundColor: (theme) =>
                            theme.palette.mode === 'dark'
                              ? 'rgba(46, 160, 67, 0.28)'
                              : 'rgba(46, 160, 67, 0.22)',
                        },
                        '&:hover td.matrix-loss-cell': {
                          backgroundColor: (theme) =>
                            theme.palette.mode === 'dark'
                              ? 'rgba(248, 81, 73, 0.28)'
                              : 'rgba(248, 81, 73, 0.22)',
                        },
                      }}
                    >
                      {/* Copy Button Cell (Sticky Left) */}
                      <TableCell
                        className="matrix-copy-cell"
                        sx={{
                          textAlign: 'center',
                          p: 0.5,
                          position: 'sticky',
                          left: 0,
                          zIndex: 2,
                          backgroundColor: (theme) => theme.palette.background.paper,
                          borderRight: (theme) => `1px solid ${theme.palette.divider}`,
                          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
                          transition: 'background-color 0.15s ease',
                        }}
                      >
                        <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>
                          <Tooltip
                            title={
                              isCopied ? t('dailyMatrix.copied') : t('dailyMatrix.copyRowTooltip')
                            }
                            arrow
                          >
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
                              {isCopied ? (
                                <CheckIcon sx={{ fontSize: 16 }} />
                              ) : (
                                <ContentCopyIcon sx={{ fontSize: 16 }} />
                              )}
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

                      {/* Render Column Blocks according to columnOrder */}
                      {columnOrder.map((blockId) => {
                        const isColDragging = activeDragId === blockId;

                        if (blockId === 'date') {
                          return (
                            <TableCell
                              key="date"
                              className="matrix-date-cell"
                              sx={{
                                width: 120,
                                minWidth: 100,
                                fontWeight: 600,
                                fontSize: '0.8rem',
                                fontFamily: "'JetBrains Mono', monospace",
                                backgroundColor: (theme) =>
                                  isColDragging ? theme.palette.action.hover : 'inherit',
                                borderRight: (theme) => `1px solid ${theme.palette.divider}`,
                                borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
                                transition: 'background-color 0.15s ease',
                              }}
                            >
                              <Box
                                sx={{
                                  visibility: isColDragging ? 'hidden' : 'visible',
                                  textAlign: 'center',
                                }}
                              >
                                {row.displayDate}
                              </Box>
                            </TableCell>
                          );
                        }

                        if (blockId === 'ordersCount') {
                          return (
                            <TableCell
                              key="ordersCount"
                              sx={{
                                width: 105,
                                minWidth: 95,
                                textAlign: 'center',
                                fontWeight: 700,
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: '0.8rem',
                                color: 'text.secondary',
                                backgroundColor: isColDragging
                                  ? (theme) => theme.palette.action.hover
                                  : 'inherit',
                                borderRight: (theme) => `1px solid ${theme.palette.divider}`,
                                borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
                                transition: 'background-color 0.15s ease',
                              }}
                            >
                              <Box sx={{ visibility: isColDragging ? 'hidden' : 'visible' }}>
                                {row.orderCount}
                              </Box>
                            </TableCell>
                          );
                        }

                        if (blockId === 'dailyPnl') {
                          return (
                            <TableCell
                              key="dailyPnl"
                              sx={{
                                width: 125,
                                minWidth: 115,
                                textAlign: 'right',
                                fontWeight: 700,
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: '0.85rem',
                                borderRight: (theme) => `1px solid ${theme.palette.divider}`,
                                borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
                                backgroundColor: isColDragging
                                  ? (theme) => theme.palette.action.hover
                                  : 'inherit',
                                color: (theme) =>
                                  row.dailyPnl > 0
                                    ? theme.palette.trade.gain
                                    : row.dailyPnl < 0
                                      ? theme.palette.trade.loss
                                      : theme.palette.trade.breakeven,
                                transition: 'background-color 0.15s ease',
                              }}
                            >
                              <Box sx={{ visibility: isColDragging ? 'hidden' : 'visible' }}>
                                {formatCurrency(row.dailyPnl, currency, numberFormat)}
                              </Box>
                            </TableCell>
                          );
                        }

                        if (blockId === 'orders') {
                          return Array.from({ length: orderColumnsCount }, (_, cIdx) => {
                            const trade = row.trades[cIdx];

                            if (!trade) {
                              return (
                                <TableCell
                                  key={cIdx}
                                  sx={{
                                    width: 75,
                                    minWidth: 70,
                                    textAlign: 'right',
                                    p: 0.5,
                                    color: 'text.disabled',
                                    fontSize: '0.75rem',
                                    backgroundColor: isColDragging
                                      ? (theme) => theme.palette.action.hover
                                      : 'inherit',
                                    borderRight: (theme) => `1px solid ${theme.palette.divider}`,
                                    borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
                                    transition: 'background-color 0.15s ease',
                                  }}
                                >
                                  <Box sx={{ visibility: isColDragging ? 'hidden' : 'visible' }}>
                                    —
                                  </Box>
                                </TableCell>
                              );
                            }

                            const isGain = trade.pnl > 0;
                            const isLoss = trade.pnl < 0;

                            return (
                              <TableCell
                                key={cIdx}
                                className={
                                  isGain
                                    ? 'matrix-gain-cell'
                                    : isLoss
                                      ? 'matrix-loss-cell'
                                      : undefined
                                }
                                sx={{
                                  width: 75,
                                  minWidth: 70,
                                  textAlign: 'right',
                                  p: 0.75,
                                  borderRight: (theme) => `1px solid ${theme.palette.divider}`,
                                  borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
                                  backgroundColor: (theme) =>
                                    isColDragging
                                      ? theme.palette.action.hover
                                      : isGain
                                        ? theme.palette.trade.gainBg
                                        : isLoss
                                          ? theme.palette.trade.lossBg
                                          : 'inherit',
                                  transition: 'background-color 0.15s ease',
                                }}
                              >
                                <Box sx={{ visibility: isColDragging ? 'hidden' : 'visible' }}>
                                  <Tooltip
                                    arrow
                                    title={
                                      <Box sx={{ p: 0.5, fontSize: '0.75rem' }}>
                                        <Typography
                                          variant="caption"
                                          sx={{ fontWeight: 700, display: 'block' }}
                                        >
                                          {trade.instrument} ({trade.direction.toUpperCase()})
                                        </Typography>
                                        <Typography variant="caption" sx={{ display: 'block' }}>
                                          Return: {trade.grossReturn.toFixed(2)}% | P&L:{' '}
                                          {formatCurrency(trade.pnl, currency, numberFormat)}
                                        </Typography>
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                          sx={{ display: 'block' }}
                                        >
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
                                      {trade.pnl > 0
                                        ? `+${trade.pnl.toFixed(2)}`
                                        : trade.pnl.toFixed(2)}
                                    </Typography>
                                  </Tooltip>
                                </Box>
                              </TableCell>
                            );
                          });
                        }

                        return null;
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
                      borderRight: (theme) => `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    <Tooltip title={t('dailyMatrix.copyAll')} arrow>
                      <IconButton size="small" onClick={handleCopyAllRows} sx={{ p: 0.5 }}>
                        <ContentCopyIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>

                  {/* Render Totals for each block according to columnOrder */}
                  {columnOrder.map((blockId) => {
                    const isColDragging = activeDragId === blockId;

                    if (blockId === 'date') {
                      return (
                        <TableCell
                          key="date"
                          sx={{
                            width: 120,
                            minWidth: 100,
                            fontWeight: 800,
                            fontSize: '0.8rem',
                            backgroundColor: (theme) => theme.palette.action.hover,
                            borderRight: (theme) => `1px solid ${theme.palette.divider}`,
                            borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
                            p: 0.75,
                            textAlign: 'center',
                          }}
                        >
                          <Box sx={{ visibility: isColDragging ? 'hidden' : 'visible' }}>
                            {t('dailyMatrix.total')}
                          </Box>
                        </TableCell>
                      );
                    }

                    if (blockId === 'ordersCount') {
                      return (
                        <TableCell
                          key="ordersCount"
                          sx={{
                            width: 105,
                            minWidth: 95,
                            textAlign: 'center',
                            fontWeight: 800,
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: '0.8rem',
                            backgroundColor: isColDragging
                              ? (theme) => theme.palette.action.hover
                              : undefined,
                            borderRight: (theme) => `1px solid ${theme.palette.divider}`,
                            borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
                            p: 0.75,
                          }}
                        >
                          <Box sx={{ visibility: isColDragging ? 'hidden' : 'visible' }}>
                            {totalOrders}
                          </Box>
                        </TableCell>
                      );
                    }

                    if (blockId === 'dailyPnl') {
                      return (
                        <TableCell
                          key="dailyPnl"
                          sx={{
                            width: 125,
                            minWidth: 115,
                            textAlign: 'right',
                            fontWeight: 800,
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: '0.9rem',
                            backgroundColor: isColDragging
                              ? (theme) => theme.palette.action.hover
                              : undefined,
                            borderRight: (theme) => `1px solid ${theme.palette.divider}`,
                            borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
                            p: 0.75,
                            whiteSpace: 'nowrap',
                            color: (theme) =>
                              totalPnl > 0
                                ? theme.palette.trade.gain
                                : totalPnl < 0
                                  ? theme.palette.trade.loss
                                  : theme.palette.trade.breakeven,
                          }}
                        >
                          <Box sx={{ visibility: isColDragging ? 'hidden' : 'visible' }}>
                            {formatCurrency(totalPnl, currency, numberFormat)}
                          </Box>
                        </TableCell>
                      );
                    }

                    if (blockId === 'orders') {
                      return columnSums.map((cSum, idx) => (
                        <TableCell
                          key={idx}
                          sx={{
                            width: 75,
                            minWidth: 70,
                            textAlign: 'right',
                            fontFamily: "'JetBrains Mono', monospace",
                            fontWeight: 700,
                            fontSize: '0.78rem',
                            backgroundColor: isColDragging
                              ? (theme) => theme.palette.action.hover
                              : undefined,
                            borderRight: (theme) => `1px solid ${theme.palette.divider}`,
                            borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
                            p: 0.75,
                            whiteSpace: 'nowrap',
                            color: (theme) =>
                              cSum > 0
                                ? theme.palette.trade.gain
                                : cSum < 0
                                  ? theme.palette.trade.loss
                                  : 'text.secondary',
                          }}
                        >
                          <Box sx={{ visibility: isColDragging ? 'hidden' : 'visible' }}>
                            {cSum !== 0
                              ? cSum > 0
                                ? `+${cSum.toFixed(2)}`
                                : cSum.toFixed(2)
                              : '—'}
                          </Box>
                        </TableCell>
                      ));
                    }

                    return null;
                  })}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <DragOverlay
          dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}
        >
          {activeDragId ? (
            <ColumnDragPreview
              blockId={activeDragId}
              dayRows={dayRows}
              orderColumnsCount={orderColumnsCount}
              totalOrders={totalOrders}
              totalPnl={totalPnl}
              columnSums={columnSums}
              currency={currency}
              numberFormat={numberFormat}
              t={t}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Context Menu for Copy Options */}
      <Menu anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={handleCloseMenu}>
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
          <ListItemText primary={t('dailyMatrix.copyTradesOnly')} secondary="Trade values only" />
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

export const DailyOrdersMatrixTable = React.memo(DailyOrdersMatrixTableComponent);
