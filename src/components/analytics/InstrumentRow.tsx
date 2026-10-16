import React from 'react';
import { TableRow, TableCell, Button } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { InstrumentSummary } from '../../types/trade';
import { NumberFormatOption } from '../../types/preferences';
import { formatPercent, formatSignedPnl, formatDurationMs } from '../../lib/formatters';
import { Sparkline } from './Sparkline';
import { getRowSx, styles } from './InstrumentRow.styles';

export interface Props {
  row: InstrumentSummary;
  currency: string;
  numberFormat: NumberFormatOption;
  isSelected: boolean;
  onSelect: (symbol: string) => void;
}

export const InstrumentRow: React.FC<Props> = React.memo(
  ({ row, currency, numberFormat, isSelected, onSelect }) => {
    const { t, i18n } = useTranslation();
    const currentLang = i18n.language || 'en-US';

    const pnlData = formatSignedPnl(row.netPnl, currency, numberFormat, currentLang);
    const avgData = formatSignedPnl(row.avgPnl, currency, numberFormat, currentLang);
    const formattedDuration = formatDurationMs(row.avgDurationMs, currentLang);

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSelect(row.symbol);
      }
    };

    return (
      <TableRow
        hover
        tabIndex={0}
        role="button"
        aria-selected={isSelected}
        onClick={() => onSelect(row.symbol)}
        onKeyDown={handleKeyDown}
        sx={getRowSx(isSelected)}
      >
        {/* Symbol */}
        <TableCell sx={styles.symbolCell}>{row.symbol}</TableCell>

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

        {/* Avg Duration */}
        <TableCell align="right" sx={{ color: 'text.secondary', ...styles.durationCell }}>
          {formattedDuration}
        </TableCell>

        {/* Share % */}
        <TableCell align="right" sx={{ color: 'text.secondary', ...styles.shareCell }}>
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
              onSelect(row.symbol);
            }}
            sx={{ fontSize: '0.75rem', py: 0.25, px: 1 }}
          >
            {t('instruments.details', { defaultValue: 'Деталі' })}
          </Button>
        </TableCell>
      </TableRow>
    );
  }
);

InstrumentRow.displayName = 'InstrumentRow';
