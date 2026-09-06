import React from 'react';
import { TableRow, TableCell, Box, Typography, Chip } from '@mui/material';
import { GroupSummary } from '../../types/trade';
import { NumberFormatOption } from '../../types/preferences';
import { formatCurrency, formatSignedPnl, formatPercent } from '../../lib/formatters';

interface Props {
  summary: GroupSummary;
  colSpan: number;
  currency: string;
  numberFormat: NumberFormatOption;
  locale?: string;
}

const GroupHeaderRowComponent: React.FC<Props> = ({
  summary,
  colSpan,
  currency,
  numberFormat,
  locale = 'en-US',
}) => {
  const pnlFormatted = React.useMemo(
    () => formatSignedPnl(summary.netPnl, currency, numberFormat, locale),
    [summary.netPnl, currency, numberFormat, locale]
  );

  return (
    <TableRow
      sx={{
        backgroundColor: (theme) => theme.palette.action.hover,
        borderTop: (theme) => `2px solid ${theme.palette.divider}`,
        borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
      }}
    >
      <TableCell colSpan={colSpan} sx={{ py: 1, px: 2 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          {/* Left: Group Key & Trade Count */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}
            >
              {summary.groupKey}
            </Typography>
            <Chip
              label={`${summary.tradeCount} trades`}
              size="small"
              sx={{
                height: 20,
                fontSize: '0.7rem',
                fontWeight: 600,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            />
          </Box>

          {/* Right: Inverted Summary Columns (Net P&L, Win Rate, Margin) */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                Margin:
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}
              >
                {formatCurrency(summary.totalMargin, currency, numberFormat, locale)}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                Win Rate:
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 600,
                  color: summary.winRate >= 50 ? 'trade.gain' : 'trade.loss',
                }}
              >
                {formatPercent(summary.winRate, 1, numberFormat, locale)}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                Subtotal P&L:
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 700,
                  color: pnlFormatted.isPositive
                    ? 'trade.gain'
                    : pnlFormatted.isNegative
                      ? 'trade.loss'
                      : 'text.secondary',
                }}
              >
                {pnlFormatted.text}
              </Typography>
            </Box>
          </Box>
        </Box>
      </TableCell>
    </TableRow>
  );
};

export const GroupHeaderRow = React.memo(GroupHeaderRowComponent);
