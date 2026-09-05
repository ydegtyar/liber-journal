import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Tooltip,
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { useTranslation } from 'react-i18next';
import { YearMonthlyReturns } from '../../types/trade';
import { NumberFormatOption } from '../../types/preferences';
import { formatPercent, formatSignedPnl } from '../../lib/formatters';

interface MonthlyReturnsHeatmapProps {
  data: YearMonthlyReturns[];
  currency: string;
  numberFormat: NumberFormatOption;
}

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export const MonthlyReturnsHeatmap: React.FC<MonthlyReturnsHeatmapProps> = React.memo(
  ({ data, currency, numberFormat }) => {
    const { t, i18n } = useTranslation();
    const currentLang = i18n.language || 'en-US';

    if (data.length === 0) {
      return (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 2.5,
            borderRadius: 2,
            border: (theme) => `1px solid ${theme.palette.divider}`,
            backgroundColor: (theme) => theme.palette.background.paper,
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 800, fontSize: '0.95rem', mb: 1 }}>
            {t('monthly.title', { defaultValue: 'Місячна дохідність' })}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('monthly.noData', { defaultValue: 'Немає даних для побудови карти.' })}
          </Typography>
        </Paper>
      );
    }

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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <CalendarMonthIcon sx={{ fontSize: 20, color: 'primary.main' }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 800, fontSize: '0.95rem' }}>
            {t('monthly.title', { defaultValue: 'Місячна дохідність' })}
          </Typography>
        </Box>

        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, width: 70 }}>
                  {t('monthly.year', { defaultValue: 'Рік' })}
                </TableCell>
                {MONTH_NAMES.map((m) => (
                  <TableCell
                    key={m}
                    align="right"
                    sx={{ px: 0.75, fontSize: '0.75rem', fontWeight: 600 }}
                  >
                    {m}
                  </TableCell>
                ))}
                <TableCell align="right" sx={{ fontWeight: 700, px: 1 }}>
                  {t('monthly.totalYear', { defaultValue: 'Всього' })}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((row) => {
                const yearPnlData = formatSignedPnl(
                  row.totalPnl,
                  currency,
                  numberFormat,
                  currentLang
                );
                return (
                  <TableRow key={row.year} hover>
                    <TableCell sx={{ fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                      {row.year}
                    </TableCell>
                    {MONTH_NAMES.map((_, idx) => {
                      const monthNum = idx + 1;
                      const item = row.months[monthNum];
                      if (!item || item.trades === 0) {
                        return (
                          <TableCell
                            key={monthNum}
                            align="right"
                            sx={{ color: 'text.disabled', fontSize: '0.75rem', px: 0.75 }}
                          >
                            —
                          </TableCell>
                        );
                      }

                      const isPos = item.pnl > 0.001;
                      const isNeg = item.pnl < -0.001;
                      const cellPnl = formatSignedPnl(
                        item.pnl,
                        currency,
                        numberFormat,
                        currentLang
                      );

                      return (
                        <Tooltip
                          key={monthNum}
                          title={`${item.trades} trades • Win Rate: ${formatPercent(item.winRate, 0, numberFormat, currentLang)} • ${cellPnl.text}`}
                          arrow
                        >
                          <TableCell
                            align="right"
                            sx={{
                              px: 0.75,
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              backgroundColor: (theme) =>
                                isPos
                                  ? theme.palette.trade.gainBg
                                  : isNeg
                                    ? theme.palette.trade.lossBg
                                    : 'transparent',
                              color: (theme) =>
                                isPos
                                  ? theme.palette.trade.gain
                                  : isNeg
                                    ? theme.palette.trade.loss
                                    : 'text.secondary',
                            }}
                          >
                            {cellPnl.text}
                          </TableCell>
                        </Tooltip>
                      );
                    })}
                    <TableCell
                      align="right"
                      sx={{
                        fontWeight: 800,
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '0.8rem',
                        color: (theme) =>
                          yearPnlData.isPositive
                            ? theme.palette.trade.gain
                            : yearPnlData.isNegative
                              ? theme.palette.trade.loss
                              : 'text.secondary',
                      }}
                    >
                      {yearPnlData.text}
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

MonthlyReturnsHeatmap.displayName = 'MonthlyReturnsHeatmap';
