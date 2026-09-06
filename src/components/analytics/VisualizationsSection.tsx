import React, { lazy, Suspense, useCallback, useMemo, useTransition } from 'react';
import { useLocalStorage } from 'usehooks-ts';
import { Tab, Tabs } from '@mui/material';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import BarChartIcon from '@mui/icons-material/BarChart';
import DateRangeIcon from '@mui/icons-material/DateRange';
import LayersIcon from '@mui/icons-material/Layers';
import PieChartIcon from '@mui/icons-material/PieChart';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useTranslation } from 'react-i18next';
import { EquityPoint, Trade } from '../../types/trade';
import { NumberFormatOption } from '../../types/preferences';
import { calculateInstrumentPerformance } from '../../lib/calculations';
import { TradingTerminalLoader } from '../common/TradingTerminalLoader';

// Lazy-loaded visualization charts to unburden initial bundle (saves ~404 KB)
const EquityCurveChart = lazy(() =>
  import('./EquityCurveChart').then((m) => ({ default: m.EquityCurveChart }))
);
const DailyPnlChart = lazy(() =>
  import('./DailyPnlChart').then((m) => ({ default: m.DailyPnlChart }))
);
const DayOfWeekChart = lazy(() =>
  import('./DayOfWeekChart').then((m) => ({ default: m.DayOfWeekChart }))
);
const DrawdownChart = lazy(() =>
  import('./DrawdownChart').then((m) => ({ default: m.DrawdownChart }))
);
const InstrumentChart = lazy(() =>
  import('./InstrumentChart').then((m) => ({ default: m.InstrumentChart }))
);
const GithubActivityCalendar = lazy(() =>
  import('./GithubActivityCalendar').then((m) => ({ default: m.GithubActivityCalendar }))
);
const HourlyDayHeatmap = lazy(() =>
  import('./HourlyDayHeatmap').then((m) => ({ default: m.HourlyDayHeatmap }))
);

export interface Props {
  filteredTrades: Trade[];
  equityCurve: EquityPoint[];
  dayOfWeekPerformance: Array<{ day: string; pnl: number; trades: number; winRate: number }>;
  currency: string;
  numberFormat: NumberFormatOption;
}

const VisualizationsSectionComponent: React.FC<Props> = ({
  filteredTrades,
  equityCurve,
  dayOfWeekPerformance,
  currency,
  numberFormat,
}) => {
  const { t } = useTranslation();
  const [activeChartTab, setActiveChartTab] = useLocalStorage<number>(
    'liber_journal_active_chart_tab',
    0
  );
  const [, startTransition] = useTransition();

  const handleTabChange = useCallback((_e: any, val: number) => {
    startTransition(() => setActiveChartTab(val));
  }, []);

  // Aggregate daily P&L data for the periodic chart
  const dailyPnlData = useMemo(() => {
    const map: Record<string, { pnl: number; count: number }> = {};
    for (const trade of filteredTrades) {
      const dateKey = trade.closedAt ? trade.closedAt.split('T')[0] : 'Unknown';
      if (!map[dateKey]) {
        map[dateKey] = { pnl: 0, count: 0 };
      }
      map[dateKey].pnl += trade.pnl;
      map[dateKey].count++;
    }

    return Object.entries(map)
      .map(([date, val]) => ({
        date,
        pnl: Math.round(val.pnl * 100) / 100,
        tradesCount: val.count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredTrades]);

  const instrumentPerformance = useMemo(() => {
    return calculateInstrumentPerformance(filteredTrades).byInstrument;
  }, [filteredTrades]);

  return (
    <section aria-label="Visual Analytics and Charts">
      <Tabs
        value={activeChartTab}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          minHeight: 36,
          mb: 1,
          '& .MuiTab-root': {
            minHeight: 36,
            py: 0.5,
            px: 1.5,
            fontSize: '0.75rem',
            fontWeight: 600,
          },
        }}
      >
        <Tab
          icon={<ShowChartIcon sx={{ fontSize: 16 }} />}
          iconPosition="start"
          label={t('charts.equityCurve')}
        />
        <Tab
          icon={<BarChartIcon sx={{ fontSize: 16 }} />}
          iconPosition="start"
          label={t('charts.periodicPnl')}
        />
        <Tab
          icon={<DateRangeIcon sx={{ fontSize: 16 }} />}
          iconPosition="start"
          label={t('charts.dayOfWeek')}
        />
        <Tab
          icon={<LayersIcon sx={{ fontSize: 16 }} />}
          iconPosition="start"
          label={t('charts.drawdown')}
        />
        <Tab
          icon={<PieChartIcon sx={{ fontSize: 16 }} />}
          iconPosition="start"
          label={t('charts.instruments')}
        />
        <Tab
          icon={<CalendarMonthIcon sx={{ fontSize: 16 }} />}
          iconPosition="start"
          label={t('charts.activityCalendar')}
        />
        <Tab
          icon={<AccessTimeIcon sx={{ fontSize: 16 }} />}
          iconPosition="start"
          label={t('charts.hourlyHeatmap')}
        />
      </Tabs>

      <Suspense
        fallback={
          <TradingTerminalLoader
            minHeight={320}
            variant="compact"
            message="RENDERING ANALYTICS VISUALIZATION..."
            subMessage="COMPUTING REAL-TIME CHART SERIES"
          />
        }
      >
        {activeChartTab === 0 && (
          <EquityCurveChart data={equityCurve} currency={currency} numberFormat={numberFormat} />
        )}
        {activeChartTab === 1 && (
          <DailyPnlChart data={dailyPnlData} currency={currency} numberFormat={numberFormat} />
        )}
        {activeChartTab === 2 && (
          <DayOfWeekChart
            data={dayOfWeekPerformance}
            currency={currency}
            numberFormat={numberFormat}
          />
        )}
        {activeChartTab === 3 && <DrawdownChart data={equityCurve} numberFormat={numberFormat} />}
        {activeChartTab === 4 && (
          <InstrumentChart
            data={instrumentPerformance}
            currency={currency}
            numberFormat={numberFormat}
          />
        )}
        {activeChartTab === 5 && (
          <GithubActivityCalendar
            trades={filteredTrades}
            currency={currency}
            numberFormat={numberFormat}
          />
        )}
        {activeChartTab === 6 && (
          <HourlyDayHeatmap
            trades={filteredTrades}
            currency={currency}
            numberFormat={numberFormat}
          />
        )}
      </Suspense>
    </section>
  );
};

export const VisualizationsSection = React.memo(VisualizationsSectionComponent);
