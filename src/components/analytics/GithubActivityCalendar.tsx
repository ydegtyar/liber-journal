import React, { useMemo, useState } from 'react';
import {
  Paper,
  Box,
  Typography,
  Tooltip,
  useTheme,
  Chip,
  Select,
  MenuItem,
  FormControl,
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useTranslation } from 'react-i18next';
import { Trade } from '../../types/trade';
import { NumberFormatOption } from '../../types/preferences';
import { formatSignedPnl } from '../../lib/formatters';

interface DailyStats {
  dateStr: string; // YYYY-MM-DD
  pnl: number;
  tradesCount: number;
  wins: number;
  losses: number;
  breakeven: number;
  winRate: number;
}

export interface GithubActivityCalendarProps {
  trades: Trade[];
  currency: string;
  numberFormat: NumberFormatOption;
}

const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const GithubActivityCalendar: React.FC<GithubActivityCalendarProps> = ({
  trades,
  currency,
  numberFormat,
}) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const currentLang = i18n.language || 'en-US';

  // 1. Group all trades by date (YYYY-MM-DD)
  const { dailyMap, availableYears, allDailyStats } = useMemo(() => {
    const map = new Map<string, DailyStats>();
    const yearsSet = new Set<number>();

    for (const trade of trades) {
      if (!trade.closedAt) continue;
      const datePart = trade.closedAt.split('T')[0];
      const year = parseInt(datePart.split('-')[0], 10);
      if (!isNaN(year)) yearsSet.add(year);

      let stats = map.get(datePart);
      if (!stats) {
        stats = {
          dateStr: datePart,
          pnl: 0,
          tradesCount: 0,
          wins: 0,
          losses: 0,
          breakeven: 0,
          winRate: 0,
        };
        map.set(datePart, stats);
      }

      stats.tradesCount++;
      stats.pnl += trade.pnl;
      if (trade.pnl > 0.0001) {
        stats.wins++;
      } else if (trade.pnl < -0.0001) {
        stats.losses++;
      } else {
        stats.breakeven++;
      }
    }

    // Calculate win rates
    map.forEach((stats) => {
      const decisive = stats.wins + stats.losses;
      stats.winRate = decisive > 0 ? Math.round((stats.wins / decisive) * 100) : 0;
      stats.pnl = Math.round(stats.pnl * 100) / 100;
    });

    const years = Array.from(yearsSet).sort((a, b) => b - a);
    const currentYear = new Date().getFullYear();
    if (years.length === 0) years.push(currentYear);

    return {
      dailyMap: map,
      availableYears: years,
      allDailyStats: Array.from(map.values()),
    };
  }, [trades]);

  // Year state
  const [selectedYear, setSelectedYear] = useState<number>(() => availableYears[0]);

  // Update selected year if available years change
  React.useEffect(() => {
    if (!availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0]);
    }
  }, [availableYears, selectedYear]);

  // 2. Compute calendar grid for the selected year (Jan 1 to Dec 31)
  const { weeks, monthHeaders, yearStats, maxDailyWin, maxDailyLoss } = useMemo(() => {
    const year = selectedYear;
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    // Day of week: 0 = Mon, 6 = Sun
    const getDayIndex = (d: Date) => {
      const day = d.getDay(); // 0 is Sun, 1 is Mon...
      return day === 0 ? 6 : day - 1;
    };

    const firstDayIndex = getDayIndex(startDate);

    // Build weeks array (53 columns of 7 days)
    const weeksList: Array<Array<{ date: Date; dateStr: string; inYear: boolean }>> = [];
    let currentWeek: Array<{ date: Date; dateStr: string; inYear: boolean }> = [];

    // Pad before Jan 1
    for (let i = 0; i < firstDayIndex; i++) {
      const padDate = new Date(year, 0, 1 - (firstDayIndex - i));
      const padStr = padDate.toISOString().split('T')[0];
      currentWeek.push({ date: padDate, dateStr: padStr, inYear: false });
    }

    // Days of the year
    const cur = new Date(startDate);
    while (cur <= endDate) {
      const d = new Date(cur);
      const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      currentWeek.push({ date: d, dateStr: dStr, inYear: true });

      if (currentWeek.length === 7) {
        weeksList.push(currentWeek);
        currentWeek = [];
      }
      cur.setDate(cur.getDate() + 1);
    }

    // Pad after Dec 31
    if (currentWeek.length > 0) {
      let nextDay = 1;
      while (currentWeek.length < 7) {
        const padDate = new Date(year + 1, 0, nextDay);
        const padStr = padDate.toISOString().split('T')[0];
        currentWeek.push({ date: padDate, dateStr: padStr, inYear: false });
        nextDay++;
      }
      weeksList.push(currentWeek);
    }

    // Month headers positioning
    const monthsPos: Array<{ name: string; colIndex: number }> = [];
    let lastMonth = -1;
    weeksList.forEach((w, colIdx) => {
      const firstInYear = w.find((day) => day.inYear);
      if (firstInYear) {
        const m = firstInYear.date.getMonth();
        if (m !== lastMonth) {
          monthsPos.push({ name: MONTH_NAMES[m], colIndex: colIdx });
          lastMonth = m;
        }
      }
    });

    // Compute stats for selected year
    let totalTradingDays = 0;
    let winDays = 0;
    let lossDays = 0;
    let beDays = 0;
    let bestDay: DailyStats | null = null;
    let worstDay: DailyStats | null = null;
    let maxWin = 0;
    let maxLoss = 0;

    // Consecutive win day streaks
    let currentStreak = 0;
    let longestStreak = 0;

    // Sort year's active days chronologically
    const yearActiveDays = allDailyStats
      .filter((s) => s.dateStr.startsWith(String(year)))
      .sort((a, b) => a.dateStr.localeCompare(b.dateStr));

    for (const stats of yearActiveDays) {
      totalTradingDays++;
      if (stats.pnl > 0.0001) {
        winDays++;
        currentStreak++;
        if (currentStreak > longestStreak) longestStreak = currentStreak;
        if (!bestDay || stats.pnl > bestDay.pnl) bestDay = stats;
        if (stats.pnl > maxWin) maxWin = stats.pnl;
      } else if (stats.pnl < -0.0001) {
        lossDays++;
        currentStreak = 0;
        if (!worstDay || stats.pnl < worstDay.pnl) worstDay = stats;
        if (Math.abs(stats.pnl) > maxLoss) maxLoss = Math.abs(stats.pnl);
      } else {
        beDays++;
        currentStreak = 0;
      }
    }

    return {
      weeks: weeksList,
      monthHeaders: monthsPos,
      yearStats: {
        totalTradingDays,
        winDays,
        lossDays,
        beDays,
        bestDay,
        worstDay,
        longestStreak,
      },
      maxDailyWin: maxWin || 1,
      maxDailyLoss: maxLoss || 1,
    };
  }, [selectedYear, dailyMap, allDailyStats]);

  // Color generator for cell
  const getCellColor = (stats: DailyStats | undefined, inYear: boolean) => {
    if (!inYear) {
      return 'transparent';
    }
    if (!stats || stats.tradesCount === 0) {
      return isDark ? '#161b22' : '#ebedf0';
    }

    // Breakeven day
    if (Math.abs(stats.pnl) <= 0.0001) {
      return isDark ? '#30363d' : '#cbd5e1';
    }

    // Profitable day (Green scale)
    if (stats.pnl > 0) {
      const ratio = stats.pnl / maxDailyWin;
      if (ratio <= 0.25) return isDark ? '#0e4429' : '#9be9a8';
      if (ratio <= 0.5) return isDark ? '#006d32' : '#40c463';
      if (ratio <= 0.75) return isDark ? '#26a641' : '#30a14e';
      return isDark ? '#39d353' : '#216e39';
    }

    // Loss day (Red scale)
    const ratio = Math.abs(stats.pnl) / maxDailyLoss;
    if (ratio <= 0.25) return isDark ? '#4c1d24' : '#ffcdd2';
    if (ratio <= 0.5) return isDark ? '#7f1d1d' : '#ef9a9a';
    if (ratio <= 0.75) return isDark ? '#b91c1c' : '#e53935';
    return isDark ? '#ef4444' : '#b71c1c';
  };

  const getCellBorder = (stats: DailyStats | undefined, inYear: boolean) => {
    if (!inYear) return 'transparent';
    if (!stats || stats.tradesCount === 0) {
      return isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.06)';
    }
    return '1px solid rgba(0, 0, 0, 0.15)';
  };

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
      {/* Top Header Controls: Title & Year Selector */}
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
          <CalendarMonthIcon sx={{ fontSize: 22, color: 'primary.main' }} />
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, fontSize: '0.95rem', lineHeight: 1.2 }}>
              {t('calendar.title')}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t('calendar.subtitle')}
            </Typography>
          </Box>
        </Box>

        {availableYears.length > 1 && (
          <FormControl size="small">
            <Select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              sx={{
                height: 32,
                fontSize: '0.8rem',
                fontWeight: 700,
                borderRadius: 1.5,
              }}
            >
              {availableYears.map((yr) => (
                <MenuItem key={yr} value={yr} sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
                  {yr}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>

      {/* Summary KPI Badges */}
      <Box
        sx={{
          display: 'flex',
          gap: 1.5,
          flexWrap: 'wrap',
          mb: 2.5,
        }}
      >
        <Chip
          icon={<CheckCircleOutlineIcon sx={{ fontSize: 16 }} />}
          label={`${yearStats.totalTradingDays} ${t('calendar.activeDays')}: ${yearStats.winDays}W / ${yearStats.lossDays}L (${
            yearStats.totalTradingDays > 0 ? Math.round((yearStats.winDays / yearStats.totalTradingDays) * 100) : 0
          }%)`}
          size="small"
          variant="outlined"
          sx={{ fontWeight: 600, fontSize: '0.75rem' }}
        />

        {yearStats.bestDay && (
          <Chip
            icon={<TrendingUpIcon sx={{ fontSize: 16, color: 'success.main !important' }} />}
            label={`${t('calendar.bestDay')}: ${formatSignedPnl(yearStats.bestDay.pnl, currency, numberFormat, currentLang).text} (${yearStats.bestDay.dateStr})`}
            size="small"
            variant="outlined"
            color="success"
            sx={{ fontWeight: 600, fontSize: '0.75rem' }}
          />
        )}

        {yearStats.worstDay && (
          <Chip
            icon={<TrendingDownIcon sx={{ fontSize: 16, color: 'error.main !important' }} />}
            label={`${t('calendar.worstDay')}: ${formatSignedPnl(yearStats.worstDay.pnl, currency, numberFormat, currentLang).text} (${yearStats.worstDay.dateStr})`}
            size="small"
            variant="outlined"
            color="error"
            sx={{ fontWeight: 600, fontSize: '0.75rem' }}
          />
        )}

        {yearStats.longestStreak > 1 && (
          <Chip
            icon={<WhatshotIcon sx={{ fontSize: 16, color: 'warning.main !important' }} />}
            label={`${t('calendar.longestStreak')}: ${yearStats.longestStreak} ${t('calendar.days')}`}
            size="small"
            variant="outlined"
            color="warning"
            sx={{ fontWeight: 600, fontSize: '0.75rem' }}
          />
        )}
      </Box>

      {/* Contribution Calendar Scrollable Container */}
      <Box sx={{ overflowX: 'auto', pb: 1 }}>
        <Box sx={{ minWidth: 780 }}>
          {/* Month Header Row */}
          <Box sx={{ display: 'flex', ml: 3.5, mb: 0.5, height: 16 }}>
            {weeks.map((_, colIdx) => {
              const monthHeader = monthHeaders.find((m) => m.colIndex === colIdx);
              return (
                <Box
                  key={colIdx}
                  sx={{
                    width: 14,
                    mr: '3px',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    color: 'text.secondary',
                    textAlign: 'left',
                  }}
                >
                  {monthHeader ? monthHeader.name : ''}
                </Box>
              );
            })}
          </Box>

          {/* Grid: 7 rows x 53 columns */}
          <Box sx={{ display: 'flex' }}>
            {/* Day of Week labels (Mon, Wed, Fri) */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '3px', mr: 1, width: 20 }}>
              {DAY_LABELS.map((label, idx) => (
                <Box
                  key={idx}
                  sx={{
                    height: 12,
                    fontSize: '0.62rem',
                    color: 'text.secondary',
                    fontWeight: 600,
                    lineHeight: '12px',
                    textAlign: 'right',
                  }}
                >
                  {label}
                </Box>
              ))}
            </Box>

            {/* Weeks columns */}
            <Box sx={{ display: 'flex', gap: '3px' }}>
              {weeks.map((week, colIdx) => (
                <Box key={colIdx} sx={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {week.map((day, rowIdx) => {
                    const stats = dailyMap.get(day.dateStr);
                    const cellColor = getCellColor(stats, day.inYear);
                    const cellBorder = getCellBorder(stats, day.inYear);

                    if (!day.inYear) {
                      return (
                        <Box
                          key={rowIdx}
                          sx={{
                            width: 12,
                            height: 12,
                            visibility: 'hidden',
                          }}
                        />
                      );
                    }

                    // Format date for tooltip
                    const dateFormatted = new Intl.DateTimeFormat(currentLang, {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    }).format(day.date);

                    const tooltipContent = stats ? (
                      <Box sx={{ p: 0.5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>
                          {dateFormatted}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 800,
                            color: stats.pnl > 0 ? '#4ade80' : stats.pnl < 0 ? '#f87171' : 'inherit',
                            display: 'block',
                            fontSize: '0.8rem',
                          }}
                        >
                          {formatSignedPnl(stats.pnl, currency, numberFormat, currentLang).text}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                          {stats.tradesCount} {t('calendar.trades')} ({stats.wins}W / {stats.losses}L / {stats.breakeven}BE)
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                          {t('calendar.winRate')}: {stats.winRate}%
                        </Typography>
                      </Box>
                    ) : (
                      <Box sx={{ p: 0.5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>
                          {dateFormatted}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {t('calendar.noTrades')}
                        </Typography>
                      </Box>
                    );

                    return (
                      <Tooltip key={rowIdx} title={tooltipContent} arrow placement="top">
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '2px',
                            backgroundColor: cellColor,
                            border: cellBorder,
                            cursor: stats ? 'pointer' : 'default',
                            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                            '&:hover': {
                              transform: 'scale(1.35)',
                              zIndex: 2,
                              boxShadow: isDark
                                ? '0 0 6px rgba(255,255,255,0.4)'
                                : '0 0 6px rgba(0,0,0,0.3)',
                            },
                          }}
                        />
                      </Tooltip>
                    );
                  })}
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Legend Footer */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 1.5,
          mt: 2,
          pt: 1.5,
          borderTop: (theme) => `1px solid ${theme.palette.divider}`,
          fontSize: '0.72rem',
          color: 'text.secondary',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <span>{t('calendar.less')}</span>
          <Box sx={{ width: 10, height: 10, borderRadius: '2px', backgroundColor: isDark ? '#ef4444' : '#b71c1c' }} />
          <Box sx={{ width: 10, height: 10, borderRadius: '2px', backgroundColor: isDark ? '#b91c1c' : '#e53935' }} />
          <Box sx={{ width: 10, height: 10, borderRadius: '2px', backgroundColor: isDark ? '#7f1d1d' : '#ef9a9a' }} />
          <Box sx={{ width: 10, height: 10, borderRadius: '2px', backgroundColor: isDark ? '#4c1d24' : '#ffcdd2' }} />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 0.5 }}>
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: '2px',
              backgroundColor: isDark ? '#161b22' : '#ebedf0',
              border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
            }}
          />
          <span>{t('calendar.noTrades')}</span>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 10, height: 10, borderRadius: '2px', backgroundColor: isDark ? '#0e4429' : '#9be9a8' }} />
          <Box sx={{ width: 10, height: 10, borderRadius: '2px', backgroundColor: isDark ? '#006d32' : '#40c463' }} />
          <Box sx={{ width: 10, height: 10, borderRadius: '2px', backgroundColor: isDark ? '#26a641' : '#30a14e' }} />
          <Box sx={{ width: 10, height: 10, borderRadius: '2px', backgroundColor: isDark ? '#39d353' : '#216e39' }} />
          <span>{t('calendar.more')}</span>
        </Box>
      </Box>
    </Paper>
  );
};
