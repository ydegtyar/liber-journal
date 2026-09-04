import React from 'react';
import { Paper, Typography, Box, useTheme } from '@mui/material';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { EquityPoint } from '../../types/trade';
import { NumberFormatOption } from '../../types/preferences';
import { formatCurrency, formatDate } from '../../lib/formatters';

interface EquityCurveChartProps {
  data: EquityPoint[];
  currency: string;
  numberFormat: NumberFormatOption;
}

export const EquityCurveChart: React.FC<EquityCurveChartProps> = ({
  data,
  currency,
  numberFormat,
}) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const currentLang = i18n.language || 'en-US';

  const chartColor = theme.palette.trade.gain;
  const initialEquity = data.length > 0 ? data[0].equity : 1000;

  return (
    <Paper sx={{ p: 2, height: 320, display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {t('charts.equityCurve')}
        </Typography>
      </Box>

      <Box sx={{ flex: 1, width: '100%', minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} opacity={0.6} />
            <XAxis
              dataKey="index"
              stroke={theme.palette.text.secondary}
              fontSize={11}
              tickLine={false}
              tickFormatter={(idx) => {
                if (idx === 0) return 'Start';
                const pt = data[idx];
                return pt ? `#${idx}` : '';
              }}
            />
            <YAxis
              domain={['auto', 'auto']}
              stroke={theme.palette.text.secondary}
              fontSize={11}
              tickLine={false}
              tickFormatter={(val) => formatCurrency(val, currency, numberFormat, currentLang)}
            />
            <ReferenceLine y={initialEquity} stroke={theme.palette.divider} strokeDasharray="4 4" />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const pt = payload[0].payload as EquityPoint;
                  return (
                    <Box
                      sx={{
                        backgroundColor: theme.palette.background.paper,
                        border: `1px solid ${theme.palette.divider}`,
                        p: 1.5,
                        borderRadius: 1,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(pt.date, currentLang)} • Trade #{pt.index}
                      </Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 0.5 }}>
                        {pt.instrument}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontWeight: 700,
                          color: pt.pnl >= 0 ? theme.palette.trade.gain : theme.palette.trade.loss,
                        }}
                      >
                        P&L: {formatCurrency(pt.pnl, currency, numberFormat, currentLang)}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontWeight: 700,
                          color: 'text.primary',
                        }}
                      >
                        Balance: {formatCurrency(pt.equity, currency, numberFormat, currentLang)}
                      </Typography>
                    </Box>
                  );
                }
                return null;
              }}
            />
            <Line
              type="monotone"
              dataKey="equity"
              stroke={chartColor}
              strokeWidth={2.5}
              dot={{ r: 3, fill: chartColor }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};
