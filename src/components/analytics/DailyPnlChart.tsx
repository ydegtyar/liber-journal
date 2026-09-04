import React, { useMemo } from 'react';
import { Paper, Typography, Box, useTheme } from '@mui/material';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Cell,
  Brush,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { NumberFormatOption } from '../../types/preferences';
import { formatCurrency } from '../../lib/formatters';

interface DailyPnlPoint {
  date: string;
  pnl: number;
  tradesCount: number;
}

interface DailyPnlChartProps {
  data: DailyPnlPoint[];
  currency: string;
  numberFormat: NumberFormatOption;
}

export const DailyPnlChart: React.FC<DailyPnlChartProps> = ({
  data,
  currency,
  numberFormat,
}) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const currentLang = i18n.language || 'en-US';

  const avgDailyPnl = useMemo(() => {
    if (data.length === 0) return 0;
    const sum = data.reduce((acc, pt) => acc + pt.pnl, 0);
    return Math.round((sum / data.length) * 100) / 100;
  }, [data]);

  return (
    <Paper sx={{ p: 2, height: 380, display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          {t('charts.periodicPnl')}
        </Typography>
        {data.length > 0 && (
          <Typography variant="caption" sx={{ color: '#eab308', fontWeight: 600 }}>
            {t('charts.averageDaily', { defaultValue: 'Середній' })}: {formatCurrency(avgDailyPnl, currency, numberFormat, currentLang)}
          </Typography>
        )}
      </Box>

      <Box sx={{ flex: 1, width: '100%', minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} opacity={0.6} />
            <XAxis dataKey="date" stroke={theme.palette.text.secondary} fontSize={11} tickLine={false} />
            <YAxis
              stroke={theme.palette.text.secondary}
              fontSize={11}
              tickLine={false}
              tickFormatter={(val) => formatCurrency(val, currency, numberFormat, currentLang)}
            />
            <ReferenceLine y={0} stroke={theme.palette.text.secondary} />
            {avgDailyPnl !== 0 && (
              <ReferenceLine
                y={avgDailyPnl}
                stroke="#eab308"
                strokeDasharray="4 4"
                label={{
                  value: `${t('charts.average', { defaultValue: 'Сер.' })}: ${formatCurrency(avgDailyPnl, currency, numberFormat, currentLang)}`,
                  position: 'insideTopRight',
                  fill: '#eab308',
                  fontSize: 10,
                  fontWeight: 700,
                }}
              />
            )}
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const pt = payload[0].payload as DailyPnlPoint;
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
                        {pt.date} • {pt.tradesCount} trades
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontWeight: 700,
                          mt: 0.5,
                          color: pt.pnl >= 0 ? theme.palette.trade.gain : theme.palette.trade.loss,
                        }}
                      >
                        Net P&L: {formatCurrency(pt.pnl, currency, numberFormat, currentLang)}
                      </Typography>
                    </Box>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="pnl" radius={[3, 3, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    entry.pnl > 0.001
                      ? theme.palette.trade.gain
                      : entry.pnl < -0.001
                      ? theme.palette.trade.loss
                      : theme.palette.trade.breakeven
                  }
                />
              ))}
            </Bar>
            {data.length > 5 && (
              <Brush
                dataKey="date"
                height={26}
                stroke={theme.palette.primary.main}
                fill={theme.palette.background.default}
                travellerWidth={10}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};
