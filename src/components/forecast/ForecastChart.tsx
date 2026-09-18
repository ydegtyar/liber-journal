import React, { useMemo } from 'react';
import { Box, Paper, Typography, useTheme, alpha } from '@mui/material';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { ForecastPoint, ForecastScenarioId } from '../../types/forecast';
import { NumberFormatOption } from '../../types/preferences';
import { formatCurrency } from '../../lib/formatters';

interface Props {
  points: ForecastPoint[];
  currentDeposit: number;
  currency: string;
  numberFormat: NumberFormatOption;
  selectedScenario: ForecastScenarioId;
}

export const ForecastChart: React.FC<Props> = React.memo(
  ({ points, currentDeposit, currency, numberFormat, selectedScenario }) => {
    const { t } = useTranslation();
    const theme = useTheme();

    const isDark = theme.palette.mode === 'dark';
    const gainColor = theme.palette.trade.gain;
    const primaryColor = theme.palette.primary.main;
    const amberColor = '#F59E0B';

    // Prepare chart data with range tuples for the shaded confidence cone
    const chartData = useMemo(() => {
      return points.map((p) => ({
        ...p,
        // Range array [min, max] for Area fill
        bandRange: p.isForecast ? [p.conservativeEquity, p.optimisticEquity] : undefined,
      }));
    }, [points]);

    const yDomain = useMemo(() => {
      if (points.length === 0) return ['auto', 'auto'];
      const allVals = points.flatMap((p) => [
        p.conservativeEquity,
        p.averageEquity,
        p.optimisticEquity,
        p.historicalEquity ?? p.averageEquity,
      ]);
      const min = Math.min(...allVals);
      const max = Math.max(...allVals);
      const padding = Math.max(50, (max - min) * 0.08);
      return [Math.floor(min - padding), Math.ceil(max + padding)];
    }, [points]);

    return (
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          borderRadius: 2,
          backgroundColor: 'background.paper',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1,
            mb: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box
                sx={{
                  width: 12,
                  height: 3,
                  backgroundColor: theme.palette.text.secondary,
                  borderRadius: 1,
                }}
              />
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                {t('forecast.chart.historicalEquity')}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box
                sx={{
                  width: 12,
                  height: 3,
                  backgroundColor: amberColor,
                  borderStyle: 'dashed',
                  borderRadius: 1,
                }}
              />
              <Typography variant="caption" sx={{ fontWeight: 600, color: amberColor }}>
                {t('forecast.chart.conservativeBound')}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box
                sx={{
                  width: 12,
                  height: 3,
                  backgroundColor: primaryColor,
                  borderRadius: 1,
                }}
              />
              <Typography variant="caption" sx={{ fontWeight: 700, color: primaryColor }}>
                {t('forecast.chart.averageTrajectory')}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box
                sx={{
                  width: 12,
                  height: 3,
                  backgroundColor: gainColor,
                  borderStyle: 'dashed',
                  borderRadius: 1,
                }}
              />
              <Typography variant="caption" sx={{ fontWeight: 600, color: gainColor }}>
                {t('forecast.chart.optimisticBound')}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ width: '100%', height: 360 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="forecastBandGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={primaryColor} stopOpacity={isDark ? 0.25 : 0.15} />
                  <stop offset="95%" stopColor={primaryColor} stopOpacity={isDark ? 0.05 : 0.02} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke={theme.palette.divider}
                opacity={isDark ? 0.4 : 0.7}
              />

              <XAxis
                dataKey="label"
                tick={{ fill: theme.palette.text.secondary, fontSize: 11, fontWeight: 600 }}
                axisLine={{ stroke: theme.palette.divider }}
                tickLine={false}
                interval="preserveStartEnd"
              />

              <YAxis
                domain={yDomain as any}
                tick={{ fill: theme.palette.text.secondary, fontSize: 11, fontWeight: 600 }}
                axisLine={{ stroke: theme.palette.divider }}
                tickLine={false}
                tickFormatter={(val) => formatCurrency(val, currency, numberFormat)}
                width={85}
              />

              {/* Baseline Reference Line */}
              <ReferenceLine
                y={currentDeposit}
                stroke={theme.palette.text.disabled}
                strokeDasharray="4 4"
                label={{
                  value: t('forecast.kpis.currentBaseline'),
                  fill: theme.palette.text.secondary,
                  fontSize: 10,
                  position: 'insideBottomRight',
                }}
              />

              {/* Tooltip */}
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  const item = payload[0].payload as ForecastPoint;
                  const isForecastPoint = item.isForecast;

                  return (
                    <Paper
                      elevation={8}
                      sx={{
                        p: 1.5,
                        borderRadius: 1.5,
                        border: `1px solid ${theme.palette.divider}`,
                        backgroundColor: isDark
                          ? 'rgba(18, 22, 28, 0.95)'
                          : 'rgba(255, 255, 255, 0.98)',
                        backdropFilter: 'blur(8px)',
                        minWidth: 200,
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography
                          variant="caption"
                          sx={{ fontWeight: 800, color: 'text.secondary' }}
                        >
                          {isForecastPoint
                            ? (item.timeLabel ?? `${t('forecast.horizons.label')} (${label})`)
                            : `Trade ${label}`}
                        </Typography>
                        {isForecastPoint && (
                          <Typography
                            variant="caption"
                            sx={{
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              px: 0.5,
                              py: 0.1,
                              borderRadius: 0.5,
                              backgroundColor: alpha(primaryColor, 0.15),
                              color: primaryColor,
                            }}
                          >
                            PROJECTED
                          </Typography>
                        )}
                      </Box>

                      {isForecastPoint ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography
                              variant="caption"
                              sx={{ color: gainColor, fontWeight: 600 }}
                            >
                              {t('forecast.scenarios.optimistic')}:
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}
                            >
                              {formatCurrency(item.optimisticEquity, currency, numberFormat)}
                            </Typography>
                          </Box>

                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography
                              variant="caption"
                              sx={{ color: primaryColor, fontWeight: 700 }}
                            >
                              {t('forecast.scenarios.average')}:
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}
                            >
                              {formatCurrency(item.averageEquity, currency, numberFormat)}
                            </Typography>
                          </Box>

                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography
                              variant="caption"
                              sx={{ color: amberColor, fontWeight: 600 }}
                            >
                              {t('forecast.scenarios.conservative')}:
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}
                            >
                              {formatCurrency(item.conservativeEquity, currency, numberFormat)}
                            </Typography>
                          </Box>
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography
                            variant="caption"
                            sx={{ color: 'text.secondary', fontWeight: 600 }}
                          >
                            {t('forecast.chart.historicalEquity')}:
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}
                          >
                            {formatCurrency(
                              item.historicalEquity ?? currentDeposit,
                              currency,
                              numberFormat
                            )}
                          </Typography>
                        </Box>
                      )}
                    </Paper>
                  );
                }}
              />

              {/* Shaded Forecast Cone (Band) */}
              <Area
                type="monotone"
                dataKey="bandRange"
                stroke="none"
                fill="url(#forecastBandGradient)"
                isAnimationActive={false}
              />

              {/* Historical Equity Line */}
              <Line
                type="monotone"
                dataKey="historicalEquity"
                stroke={theme.palette.text.primary}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                connectNulls={false}
                isAnimationActive={false}
              />

              {/* Conservative Trajectory Line */}
              <Line
                type="monotone"
                dataKey="conservativeEquity"
                stroke={amberColor}
                strokeWidth={selectedScenario === 'conservative' ? 2.5 : 1.5}
                strokeDasharray="4 4"
                dot={false}
                isAnimationActive={false}
              />

              {/* Average Trajectory Line */}
              <Line
                type="monotone"
                dataKey="averageEquity"
                stroke={primaryColor}
                strokeWidth={selectedScenario === 'average' ? 3 : 2}
                dot={false}
                isAnimationActive={false}
              />

              {/* Optimistic Trajectory Line */}
              <Line
                type="monotone"
                dataKey="optimisticEquity"
                stroke={gainColor}
                strokeWidth={selectedScenario === 'optimistic' ? 2.5 : 1.5}
                strokeDasharray="4 4"
                dot={false}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </Box>
      </Paper>
    );
  }
);

ForecastChart.displayName = 'ForecastChart';
