import React, { useState, useMemo } from 'react';
import { Paper, Typography, Box, useTheme, ButtonGroup, Button } from '@mui/material';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Brush,
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

  const [viewMode, setViewMode] = useState<'trades' | 'dates'>('trades');

  const chartColor = theme.palette.trade.gain;
  const initialEquity = data.length > 0 ? data[0].equity : 1000;

  // Process data for date mode vs trade mode
  const chartData = useMemo(() => {
    if (viewMode === 'trades') {
      return data.map((pt) => ({
        ...pt,
        label: pt.index === 0 ? 'Start' : `#${pt.index}`,
      }));
    }

    // In date mode: show formatted date
    return data.map((pt) => {
      const d = new Date(pt.date);
      const dateLabel = isNaN(d.getTime())
        ? pt.date
        : `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`;
      return {
        ...pt,
        label: pt.index === 0 ? 'Start' : dateLabel,
      };
    });
  }, [data, viewMode]);

  return (
    <Paper sx={{ p: 2, height: 380, display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          mb: 1.5,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <div>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {t('charts.equityCurve')}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {t('charts.zoomHint', { defaultValue: 'slider знизу для масштабування діапазону' })}
          </Typography>
        </div>

        {/* View Mode Toggle: By dates vs By trades */}
        <ButtonGroup size="small" variant="outlined">
          <Button
            variant={viewMode === 'dates' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('dates')}
            sx={{ fontSize: '0.75rem', py: 0.25, px: 1 }}
          >
            {t('charts.byDates', { defaultValue: 'По датах' })}
          </Button>
          <Button
            variant={viewMode === 'trades' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('trades')}
            sx={{ fontSize: '0.75rem', py: 0.25, px: 1 }}
          >
            {t('charts.byTrades', { defaultValue: 'По угодах' })}
          </Button>
        </ButtonGroup>
      </Box>

      <Box sx={{ flex: 1, width: '100%', minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} opacity={0.6} />
            <XAxis
              dataKey="label"
              stroke={theme.palette.text.secondary}
              fontSize={11}
              tickLine={false}
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
            {chartData.length > 5 && (
              <Brush
                dataKey="label"
                height={26}
                stroke={theme.palette.primary.main}
                fill={theme.palette.background.default}
                travellerWidth={10}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};
