import React, { useState, useMemo, useCallback } from 'react';
import {
  Paper,
  Box,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
  useTheme,
  Chip,
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useTranslation } from 'react-i18next';
import { Trade } from '../../types/trade';
import { NumberFormatOption } from '../../types/preferences';
import { formatCurrency, formatSignedPnl } from '../../lib/formatters';

export type HeatmapMetric = 'pnl' | 'winRate' | 'trades';

export interface HourlyDayHeatmapProps {
  trades: Trade[];
  currency: string;
  numberFormat: NumberFormatOption;
}

interface SlotData {
  dayIndex: number; // 0 = Mon, 6 = Sun
  dayName: string;
  hour: number; // 0..23
  pnl: number;
  tradesCount: number;
  wins: number;
  losses: number;
  breakeven: number;
  winRate: number;
}

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const SHORT_WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const HourlyDayHeatmap: React.FC<HourlyDayHeatmapProps> = React.memo(
  ({ trades, currency, numberFormat }) => {
    const { t, i18n } = useTranslation();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const currentLang = i18n.language || 'en-US';

    const [metric, setMetric] = useState<HeatmapMetric>('pnl');

    // Compute 2D matrix: 7 days x 24 hours
    const {
      matrix,
      rowTotals,
      colTotals,
      overallTotal,
      hasWeekendTrades,
      goldenSlot,
      riskSlot,
      maxPnl,
      minPnl,
      maxTrades,
    } = useMemo(() => {
      // Initialize empty 7 x 24 slots
      const grid: SlotData[][] = Array.from({ length: 7 }, (_, dIdx) =>
        Array.from({ length: 24 }, (_, h) => ({
          dayIndex: dIdx,
          dayName: WEEKDAYS[dIdx],
          hour: h,
          pnl: 0,
          tradesCount: 0,
          wins: 0,
          losses: 0,
          breakeven: 0,
          winRate: 0,
        }))
      );

      let weekendActivity = false;

      for (const trade of trades) {
        if (!trade.closedAt) continue;
        const date = new Date(trade.closedAt);
        if (isNaN(date.getTime())) continue;

        // 0 = Sun in JS getDay(), convert to 0 = Mon .. 6 = Sun
        const jsDay = date.getDay();
        const dayIdx = jsDay === 0 ? 6 : jsDay - 1;
        const hour = date.getHours();

        if (dayIdx >= 5) weekendActivity = true;

        const slot = grid[dayIdx][hour];
        slot.tradesCount++;
        slot.pnl += trade.pnl;
        if (trade.pnl > 0.0001) {
          slot.wins++;
        } else if (trade.pnl < -0.0001) {
          slot.losses++;
        } else {
          slot.breakeven++;
        }
      }

      let highestPnl = 0;
      let lowestPnl = 0;
      let highestTrades = 0;
      let bestSlot: SlotData | null = null;
      let worstSlot: SlotData | null = null;

      // Calculate win rates and find min/max
      for (let d = 0; d < 7; d++) {
        for (let h = 0; h < 24; h++) {
          const slot = grid[d][h];
          slot.pnl = Math.round(slot.pnl * 100) / 100;
          const decisive = slot.wins + slot.losses;
          slot.winRate = decisive > 0 ? Math.round((slot.wins / decisive) * 100) : 0;

          if (slot.pnl > highestPnl) highestPnl = slot.pnl;
          if (slot.pnl < lowestPnl) lowestPnl = slot.pnl;
          if (slot.tradesCount > highestTrades) highestTrades = slot.tradesCount;

          if (slot.tradesCount > 0) {
            if (!bestSlot || slot.pnl > bestSlot.pnl) bestSlot = slot;
            if (!worstSlot || slot.pnl < worstSlot.pnl) worstSlot = slot;
          }
        }
      }

      // Row totals (by day)
      const rows = grid.map((daySlots, dIdx) => {
        const pnl = Math.round(daySlots.reduce((acc, s) => acc + s.pnl, 0) * 100) / 100;
        const tradesCount = daySlots.reduce((acc, s) => acc + s.tradesCount, 0);
        const wins = daySlots.reduce((acc, s) => acc + s.wins, 0);
        const losses = daySlots.reduce((acc, s) => acc + s.losses, 0);
        const decisive = wins + losses;
        const winRate = decisive > 0 ? Math.round((wins / decisive) * 100) : 0;

        return {
          dayName: SHORT_WEEKDAYS[dIdx],
          pnl,
          tradesCount,
          winRate,
        };
      });

      // Column totals (by hour)
      const cols = Array.from({ length: 24 }, (_, h) => {
        let pnl = 0;
        let tradesCount = 0;
        let wins = 0;
        let losses = 0;

        for (let d = 0; d < 7; d++) {
          pnl += grid[d][h].pnl;
          tradesCount += grid[d][h].tradesCount;
          wins += grid[d][h].wins;
          losses += grid[d][h].losses;
        }

        pnl = Math.round(pnl * 100) / 100;
        const decisive = wins + losses;
        const winRate = decisive > 0 ? Math.round((wins / decisive) * 100) : 0;

        return { hour: h, pnl, tradesCount, winRate };
      });

      const overallTrades = rows.reduce((acc, r) => acc + r.tradesCount, 0);
      const overallPnl = Math.round(rows.reduce((acc, r) => acc + r.pnl, 0) * 100) / 100;

      return {
        matrix: grid,
        rowTotals: rows,
        colTotals: cols,
        overallTotal: { tradesCount: overallTrades, pnl: overallPnl },
        hasWeekendTrades: weekendActivity,
        goldenSlot: bestSlot && bestSlot.pnl > 0 ? bestSlot : null,
        riskSlot: worstSlot && worstSlot.pnl < 0 ? worstSlot : null,
        maxPnl: highestPnl || 1,
        minPnl: Math.abs(lowestPnl) || 1,
        maxTrades: highestTrades || 1,
      };
    }, [trades]);

    const activeDaysCount = hasWeekendTrades ? 7 : 5;

    // Cell Background calculation
    const getCellBg = useCallback(
      (slot: SlotData) => {
        if (slot.tradesCount === 0) {
          return isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)';
        }

        if (metric === 'pnl') {
          if (Math.abs(slot.pnl) <= 0.0001) {
            return isDark ? 'rgba(100, 116, 139, 0.2)' : 'rgba(148, 163, 184, 0.25)';
          }
          if (slot.pnl > 0) {
            const ratio = Math.min(1, Math.max(0.15, slot.pnl / maxPnl));
            return isDark
              ? `rgba(46, 160, 67, ${0.2 + ratio * 0.7})`
              : `rgba(46, 160, 67, ${0.15 + ratio * 0.65})`;
          } else {
            const ratio = Math.min(1, Math.max(0.15, Math.abs(slot.pnl) / minPnl));
            return isDark
              ? `rgba(239, 68, 68, ${0.2 + ratio * 0.7})`
              : `rgba(239, 68, 68, ${0.15 + ratio * 0.65})`;
          }
        }

        if (metric === 'winRate') {
          const ratio = slot.winRate / 100;
          if (ratio >= 0.5) {
            const greenIntensity = (ratio - 0.5) * 2; // 0..1
            return isDark
              ? `rgba(46, 160, 67, ${0.2 + greenIntensity * 0.7})`
              : `rgba(46, 160, 67, ${0.15 + greenIntensity * 0.65})`;
          } else {
            const redIntensity = (0.5 - ratio) * 2; // 0..1
            return isDark
              ? `rgba(239, 68, 68, ${0.2 + redIntensity * 0.7})`
              : `rgba(239, 68, 68, ${0.15 + redIntensity * 0.65})`;
          }
        }

        // Trade count density (indigo/blue scale)
        const ratio = Math.min(1, slot.tradesCount / maxTrades);
        return isDark
          ? `rgba(99, 102, 241, ${0.15 + ratio * 0.75})`
          : `rgba(99, 102, 241, ${0.12 + ratio * 0.7})`;
      },
      [metric, maxPnl, minPnl, maxTrades]
    );

    const formatSlotLabel = useCallback(
      (slot: SlotData) => {
        if (slot.tradesCount === 0) return '—';
        if (metric === 'pnl') {
          if (Math.abs(slot.pnl) >= 1000) {
            return `${slot.pnl >= 0 ? '+' : ''}${(slot.pnl / 1000).toFixed(1)}k`;
          }
          return `${slot.pnl >= 0 ? '+' : ''}${Math.round(slot.pnl)}`;
        }
        if (metric === 'winRate') {
          return `${slot.winRate}%`;
        }
        return String(slot.tradesCount);
      },
      [metric]
    );

    const handleMetricChange = useCallback(
      (_e: React.MouseEvent<HTMLElement>, val: HeatmapMetric | null) => {
        if (val) setMetric(val);
      },
      []
    );

    return (
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          borderRadius: 2,
          border: (theme) => `1px solid ${theme.palette.divider}`,
          backgroundColor: (theme) => theme.palette.background.paper,
        }}
      >
        {/* Top Header Controls: Title & Metric Toggle */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1.5,
            mb: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccessTimeIcon sx={{ fontSize: 22, color: 'primary.main' }} />
            <Box>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 800, fontSize: '0.95rem', lineHeight: 1.2 }}
              >
                {t('heatmap.title')}
              </Typography>
            </Box>
          </Box>

          {/* Metric Selector Toggle */}
          <ToggleButtonGroup
            value={metric}
            exclusive
            onChange={handleMetricChange}
            size="small"
            sx={{
              height: 32,
              '& .MuiToggleButton-root': {
                px: 1.5,
                py: 0.5,
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'none',
              },
            }}
          >
            <ToggleButton value="pnl">{t('heatmap.metricPnl')}</ToggleButton>
            <ToggleButton value="winRate">{t('heatmap.metricWinRate')}</ToggleButton>
            <ToggleButton value="trades">{t('heatmap.metricTrades')}</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Golden / Risk Highlights Bar */}
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 2 }}>
          {goldenSlot && (
            <Chip
              icon={<EmojiEventsIcon sx={{ fontSize: 16, color: '#f59e0b !important' }} />}
              label={`${t('heatmap.goldenSlot')}: ${SHORT_WEEKDAYS[goldenSlot.dayIndex]} ${String(goldenSlot.hour).padStart(2, '0')}:00 (${formatSignedPnl(goldenSlot.pnl, currency, numberFormat, currentLang).text}) · ${goldenSlot.tradesCount} trades (${goldenSlot.winRate}% win)`}
              size="small"
              variant="outlined"
              sx={{
                fontWeight: 600,
                fontSize: '0.75rem',
                borderColor: 'rgba(245, 158, 11, 0.4)',
                backgroundColor: isDark ? 'rgba(245, 158, 11, 0.08)' : 'rgba(245, 158, 11, 0.04)',
              }}
            />
          )}

          {riskSlot && (
            <Chip
              icon={<WarningAmberIcon sx={{ fontSize: 16, color: '#ef4444 !important' }} />}
              label={`${t('heatmap.riskSlot')}: ${SHORT_WEEKDAYS[riskSlot.dayIndex]} ${String(riskSlot.hour).padStart(2, '0')}:00 (${formatSignedPnl(riskSlot.pnl, currency, numberFormat, currentLang).text}) · ${riskSlot.tradesCount} trades`}
              size="small"
              variant="outlined"
              sx={{
                fontWeight: 600,
                fontSize: '0.75rem',
                borderColor: 'rgba(239, 68, 68, 0.4)',
                backgroundColor: isDark ? 'rgba(239, 68, 68, 0.08)' : 'rgba(239, 68, 68, 0.04)',
              }}
            />
          )}
        </Box>

        {/* Market Sessions Legend Ribbon */}
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            flexWrap: 'wrap',
            mb: 1.5,
            fontSize: '0.7rem',
            color: 'text.secondary',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#0ea5e9' }} />
            <span>{t('heatmap.asianSession')}</span>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#f59e0b' }} />
            <span>{t('heatmap.londonSession')}</span>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10b981' }} />
            <span>{t('heatmap.nySession')}</span>
          </Box>
        </Box>

        {/* Scrollable Heatmap Table Container */}
        <Box sx={{ overflowX: 'auto', pb: 1 }}>
          <Box sx={{ minWidth: 920 }}>
            {/* Hour Header Row (00 to 23) */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: '3px' }}>
              <Box
                sx={{
                  width: 44,
                  flexShrink: 0,
                  textAlign: 'left',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: 'text.secondary',
                }}
              >
                {t('heatmap.day')}
              </Box>
              <Box sx={{ display: 'flex', flex: 1, gap: '2px' }}>
                {Array.from({ length: 24 }, (_, h) => {
                  const isAsian = h >= 0 && h < 8;
                  const isLondon = h >= 8 && h < 16;
                  const isNY = h >= 13 && h < 21;

                  let sessionColor = 'text.secondary';
                  if (isNY && isLondon)
                    sessionColor = '#10b981'; // overlap
                  else if (isNY) sessionColor = '#10b981';
                  else if (isLondon) sessionColor = '#f59e0b';
                  else if (isAsian) sessionColor = '#0ea5e9';

                  return (
                    <Box
                      key={h}
                      sx={{
                        flex: 1,
                        textAlign: 'center',
                        fontSize: '0.65rem',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontWeight: 700,
                        color: sessionColor,
                      }}
                    >
                      {String(h).padStart(2, '0')}
                    </Box>
                  );
                })}
              </Box>
              {/* Total Col Header */}
              <Box
                sx={{
                  width: 68,
                  flexShrink: 0,
                  textAlign: 'right',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: 'text.secondary',
                  pr: 0.5,
                }}
              >
                {t('heatmap.total')}
              </Box>
            </Box>

            {/* Matrix Rows (Mon to Fri / Sun) */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {Array.from({ length: activeDaysCount }, (_, dIdx) => {
                const daySlots = matrix[dIdx];
                const rowTotal = rowTotals[dIdx];

                return (
                  <Box key={dIdx} sx={{ display: 'flex', alignItems: 'center' }}>
                    {/* Day Label */}
                    <Box
                      sx={{
                        width: 44,
                        flexShrink: 0,
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: 'text.primary',
                      }}
                    >
                      {SHORT_WEEKDAYS[dIdx]}
                    </Box>

                    {/* 24 Hour Cells */}
                    <Box sx={{ display: 'flex', flex: 1, gap: '2px' }}>
                      {daySlots.map((slot) => {
                        const bg = getCellBg(slot);
                        const label = formatSlotLabel(slot);

                        const tooltipContent =
                          slot.tradesCount > 0 ? (
                            <Box sx={{ p: 0.5 }}>
                              <Typography
                                variant="caption"
                                sx={{ fontWeight: 700, display: 'block' }}
                              >
                                {slot.dayName} · {String(slot.hour).padStart(2, '0')}:00 -{' '}
                                {String(slot.hour).padStart(2, '0')}:59
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{
                                  fontWeight: 800,
                                  color:
                                    slot.pnl > 0 ? '#4ade80' : slot.pnl < 0 ? '#f87171' : 'inherit',
                                  display: 'block',
                                  fontSize: '0.82rem',
                                }}
                              >
                                {
                                  formatSignedPnl(slot.pnl, currency, numberFormat, currentLang)
                                    .text
                                }
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{ color: 'text.secondary', display: 'block' }}
                              >
                                {slot.tradesCount} trades ({slot.wins}W / {slot.losses}L /{' '}
                                {slot.breakeven}BE)
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{ color: 'text.secondary', display: 'block' }}
                              >
                                {t('heatmap.metricWinRate')}: {slot.winRate}%
                              </Typography>
                            </Box>
                          ) : (
                            <Box sx={{ p: 0.5 }}>
                              <Typography
                                variant="caption"
                                sx={{ fontWeight: 600, display: 'block' }}
                              >
                                {slot.dayName} · {String(slot.hour).padStart(2, '0')}:00
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {t('heatmap.noTradesInSlot')}
                              </Typography>
                            </Box>
                          );

                        return (
                          <Tooltip key={slot.hour} title={tooltipContent} arrow placement="top">
                            <Box
                              sx={{
                                flex: 1,
                                height: 28,
                                borderRadius: '3px',
                                backgroundColor: bg,
                                border: (theme) =>
                                  `1px solid ${slot.tradesCount > 0 ? 'rgba(0,0,0,0.1)' : theme.palette.divider}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.62rem',
                                fontFamily: "'JetBrains Mono', monospace",
                                fontWeight: 700,
                                color: slot.tradesCount > 0 ? 'text.primary' : 'text.disabled',
                                cursor: slot.tradesCount > 0 ? 'pointer' : 'default',
                                transition: 'all 0.15s ease',
                                '&:hover': {
                                  transform: 'scale(1.12)',
                                  zIndex: 2,
                                  boxShadow: isDark
                                    ? '0 0 8px rgba(255,255,255,0.3)'
                                    : '0 0 8px rgba(0,0,0,0.2)',
                                },
                              }}
                            >
                              {label}
                            </Box>
                          </Tooltip>
                        );
                      })}
                    </Box>

                    {/* Day Row Summary Total */}
                    <Box
                      sx={{
                        width: 68,
                        flexShrink: 0,
                        textAlign: 'right',
                        pr: 0.5,
                        fontSize: '0.72rem',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontWeight: 800,
                        color:
                          metric === 'pnl'
                            ? rowTotal.pnl > 0
                              ? 'success.main'
                              : rowTotal.pnl < 0
                                ? 'error.main'
                                : 'text.secondary'
                            : 'text.primary',
                      }}
                    >
                      {metric === 'pnl' &&
                        formatCurrency(rowTotal.pnl, currency, numberFormat, currentLang)}
                      {metric === 'winRate' && `${rowTotal.winRate}%`}
                      {metric === 'trades' && `${rowTotal.tradesCount}`}
                    </Box>
                  </Box>
                );
              })}

              {/* Hourly Bottom Column Summary Total Row */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  mt: 0.5,
                  pt: 0.5,
                  borderTop: (theme) => `1px dashed ${theme.palette.divider}`,
                }}
              >
                <Box
                  sx={{
                    width: 44,
                    flexShrink: 0,
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    color: 'text.secondary',
                  }}
                >
                  {t('heatmap.total')}
                </Box>

                <Box sx={{ display: 'flex', flex: 1, gap: '2px' }}>
                  {colTotals.map((col) => {
                    let text = '—';
                    if (col.tradesCount > 0) {
                      if (metric === 'pnl') {
                        text =
                          Math.abs(col.pnl) >= 1000
                            ? `${col.pnl >= 0 ? '+' : ''}${(col.pnl / 1000).toFixed(1)}k`
                            : `${col.pnl >= 0 ? '+' : ''}${Math.round(col.pnl)}`;
                      } else if (metric === 'winRate') {
                        text = `${col.winRate}%`;
                      } else {
                        text = String(col.tradesCount);
                      }
                    }

                    return (
                      <Box
                        key={col.hour}
                        sx={{
                          flex: 1,
                          textAlign: 'center',
                          fontSize: '0.6rem',
                          fontFamily: "'JetBrains Mono', monospace",
                          fontWeight: 700,
                          color:
                            metric === 'pnl' && col.tradesCount > 0
                              ? col.pnl > 0
                                ? 'success.main'
                                : col.pnl < 0
                                  ? 'error.main'
                                  : 'text.secondary'
                              : 'text.secondary',
                        }}
                      >
                        {text}
                      </Box>
                    );
                  })}
                </Box>

                {/* Overall Grand Total */}
                <Box
                  sx={{
                    width: 68,
                    flexShrink: 0,
                    textAlign: 'right',
                    pr: 0.5,
                    fontSize: '0.75rem',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 900,
                    color:
                      metric === 'pnl'
                        ? overallTotal.pnl > 0
                          ? 'success.main'
                          : overallTotal.pnl < 0
                            ? 'error.main'
                            : 'text.secondary'
                        : 'text.primary',
                  }}
                >
                  {metric === 'pnl' &&
                    formatCurrency(overallTotal.pnl, currency, numberFormat, currentLang)}
                  {metric === 'trades' && `${overallTotal.tradesCount}`}
                  {metric === 'winRate' && ''}
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Paper>
    );
  }
);

HourlyDayHeatmap.displayName = 'HourlyDayHeatmap';
