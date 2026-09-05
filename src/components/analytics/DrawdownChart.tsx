import React, { useMemo } from 'react';
import { Paper, Typography, Box, useTheme } from '@mui/material';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { EquityPoint } from '../../types/trade';
import { NumberFormatOption } from '../../types/preferences';
import { formatPercent } from '../../lib/formatters';

interface DrawdownChartProps {
  data: EquityPoint[];
  numberFormat: NumberFormatOption;
}

export const DrawdownChart: React.FC<DrawdownChartProps> = React.memo(({ data, numberFormat }) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const currentLang = i18n.language || 'en-US';

  // Transform to negative drawdown percentage for underwater look
  const chartData = useMemo(
    () =>
      data.map((pt) => ({
        ...pt,
        drawdownUnderwater: -pt.drawdownPercent,
      })),
    [data]
  );

  return (
    <Paper sx={{ p: 2, height: 320, display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          {t('charts.drawdown')}
        </Typography>
      </Box>

      <Box sx={{ flex: 1, width: '100%', minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} opacity={0.6} />
            <XAxis
              dataKey="index"
              stroke={theme.palette.text.secondary}
              fontSize={11}
              tickLine={false}
              tickFormatter={(idx) => (idx === 0 ? '0' : `#${idx}`)}
            />
            <YAxis
              stroke={theme.palette.text.secondary}
              fontSize={11}
              tickLine={false}
              tickFormatter={(val) => `${val}%`}
            />
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
                        Trade #{pt.index}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontWeight: 700,
                          mt: 0.5,
                          color: theme.palette.trade.loss,
                        }}
                      >
                        Drawdown: -{formatPercent(pt.drawdownPercent, 2, numberFormat, currentLang)}
                      </Typography>
                    </Box>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="drawdownUnderwater"
              stroke={theme.palette.trade.loss}
              fill={theme.palette.trade.lossBg}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
});

DrawdownChart.displayName = 'DrawdownChart';
