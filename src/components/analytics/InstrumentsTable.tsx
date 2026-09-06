import React, { useState, useMemo, useCallback } from 'react';
import {
  Paper,
  Typography,
  Box,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableSortLabel,
  Button,
} from '@mui/material';
import { Sparkline } from './Sparkline';
import { useTranslation } from 'react-i18next';
import { InstrumentSummary } from '../../types/trade';
import { NumberFormatOption } from '../../types/preferences';
import { formatPercent, formatSignedPnl } from '../../lib/formatters';

interface Props {
  data: InstrumentSummary[];
  currency: string;
  numberFormat: NumberFormatOption;
  selectedInstrument: string | null;
  onSelectInstrument: (symbol: string) => void;
}

type SortField = 'symbol' | 'trades' | 'winRate' | 'netPnl' | 'avgPnl' | 'sharePercent';

export const InstrumentsTable: React.FC<Props> = React.memo(
  ({ data, currency, numberFormat, selectedInstrument, onSelectInstrument }) => {
    const { t, i18n } = useTranslation();
    const currentLang = i18n.language || 'en-US';

    const [sortField, setSortField] = useState<SortField>('netPnl');
    const [sortAsc, setSortAsc] = useState(false);

    const handleSort = useCallback((field: SortField) => {
      setSortField((prevField) => {
        if (prevField === field) {
          setSortAsc((prevAsc) => !prevAsc);
          return prevField;
        } else {
          setSortAsc(false);
          return field;
        }
      });
    }, []);

    const sortedData = useMemo(() => {
      return [...data].sort((a, b) => {
        let diff = 0;
        if (sortField === 'symbol') diff = a.symbol.localeCompare(b.symbol);
        else if (sortField === 'trades') diff = a.trades - b.trades;
        else if (sortField === 'winRate') diff = a.winRate - b.winRate;
        else if (sortField === 'netPnl') diff = a.netPnl - b.netPnl;
        else if (sortField === 'avgPnl') diff = a.avgPnl - b.avgPnl;
        else if (sortField === 'sharePercent') diff = a.sharePercent - b.sharePercent;
        return sortAsc ? diff : -diff;
      });
    }, [data, sortField, sortAsc]);

    if (data.length === 0) return null;

    return (
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 2,
          border: (theme) => `1px solid ${theme.palette.divider}`,
          backgroundColor: (theme) => theme.palette.background.paper,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 1.5,
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          <div>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, fontSize: '0.95rem' }}>
              {t('instruments.title', { defaultValue: 'Інструменти' })}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t('instruments.subtitle', {
                defaultValue: 'Клік по ряду — фільтр за інструментом · «Деталі» — список угод',
              })}
            </Typography>
          </div>
        </Box>

        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small" aria-label="Instruments breakdown table">
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={sortField === 'symbol'}
                    direction={sortAsc ? 'asc' : 'desc'}
                    onClick={() => handleSort('symbol')}
                  >
                    {t('instruments.instrument', { defaultValue: 'ІНСТРУМЕНТ' })}
                  </TableSortLabel>
                </TableCell>

                <TableCell align="right">
                  <TableSortLabel
                    active={sortField === 'trades'}
                    direction={sortAsc ? 'asc' : 'desc'}
                    onClick={() => handleSort('trades')}
                  >
                    {t('instruments.trades', { defaultValue: 'УГОД' })}
                  </TableSortLabel>
                </TableCell>

                <TableCell align="right">
                  <TableSortLabel
                    active={sortField === 'winRate'}
                    direction={sortAsc ? 'asc' : 'desc'}
                    onClick={() => handleSort('winRate')}
                  >
                    {t('instruments.winRate', { defaultValue: 'WIN %' })}
                  </TableSortLabel>
                </TableCell>

                <TableCell align="right">
                  <TableSortLabel
                    active={sortField === 'netPnl'}
                    direction={sortAsc ? 'asc' : 'desc'}
                    onClick={() => handleSort('netPnl')}
                  >
                    {t('instruments.netPnl', { defaultValue: 'NET P&L' })}
                  </TableSortLabel>
                </TableCell>

                <TableCell align="right">
                  <TableSortLabel
                    active={sortField === 'avgPnl'}
                    direction={sortAsc ? 'asc' : 'desc'}
                    onClick={() => handleSort('avgPnl')}
                  >
                    {t('instruments.avg', { defaultValue: 'AVG' })}
                  </TableSortLabel>
                </TableCell>

                <TableCell align="right">
                  <TableSortLabel
                    active={sortField === 'sharePercent'}
                    direction={sortAsc ? 'asc' : 'desc'}
                    onClick={() => handleSort('sharePercent')}
                  >
                    {t('instruments.share', { defaultValue: 'ЧАСТКА' })}
                  </TableSortLabel>
                </TableCell>

                <TableCell align="center">
                  {t('instruments.trend', { defaultValue: 'ТРЕНД' })}
                </TableCell>
                <TableCell align="right">{t('common.actions', { defaultValue: 'Дії' })}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedData.map((row) => {
                const isSelected = selectedInstrument?.toLowerCase() === row.symbol.toLowerCase();
                const pnlData = formatSignedPnl(row.netPnl, currency, numberFormat, currentLang);
                const avgData = formatSignedPnl(row.avgPnl, currency, numberFormat, currentLang);

                return (
                  <TableRow
                    key={row.symbol}
                    hover
                    onClick={() => onSelectInstrument(row.symbol)}
                    sx={{
                      cursor: 'pointer',
                      backgroundColor: isSelected ? 'action.selected' : 'inherit',
                    }}
                  >
                    {/* Symbol */}
                    <TableCell sx={{ fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                      {row.symbol}
                    </TableCell>

                    {/* Trades */}
                    <TableCell align="right">{row.trades}</TableCell>

                    {/* Win % */}
                    <TableCell
                      align="right"
                      sx={{
                        fontWeight: 600,
                        color: (theme) =>
                          row.winRate >= 60
                            ? theme.palette.trade.gain
                            : row.winRate < 45
                              ? theme.palette.trade.loss
                              : 'text.primary',
                      }}
                    >
                      {formatPercent(row.winRate, 0, numberFormat, currentLang)}
                    </TableCell>

                    {/* Net P&L */}
                    <TableCell
                      align="right"
                      sx={{
                        fontWeight: 700,
                        fontFamily: "'JetBrains Mono', monospace",
                        color: (theme) =>
                          pnlData.isPositive
                            ? theme.palette.trade.gain
                            : pnlData.isNegative
                              ? theme.palette.trade.loss
                              : theme.palette.trade.breakeven,
                      }}
                    >
                      {pnlData.text}
                    </TableCell>

                    {/* Avg P&L */}
                    <TableCell
                      align="right"
                      sx={{
                        fontFamily: "'JetBrains Mono', monospace",
                        color: (theme) =>
                          avgData.isPositive
                            ? theme.palette.trade.gain
                            : avgData.isNegative
                              ? theme.palette.trade.loss
                              : 'text.secondary',
                      }}
                    >
                      {avgData.text}
                    </TableCell>

                    {/* Share % */}
                    <TableCell align="right" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                      {formatPercent(row.sharePercent, 1, numberFormat, currentLang)}
                    </TableCell>

                    {/* Trend Sparkline */}
                    <TableCell align="center" sx={{ py: 0.5 }}>
                      <Sparkline points={row.sparkline} isPositive={row.netPnl >= 0} />
                    </TableCell>

                    {/* Action */}
                    <TableCell align="right" sx={{ py: 0.5 }}>
                      <Button
                        size="small"
                        variant={isSelected ? 'contained' : 'text'}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectInstrument(row.symbol);
                        }}
                        sx={{ fontSize: '0.75rem', py: 0.25, px: 1 }}
                      >
                        {t('instruments.details', { defaultValue: 'Деталі' })}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
      </Paper>
    );
  }
);

InstrumentsTable.displayName = 'InstrumentsTable';
