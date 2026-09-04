import React, { useState, useMemo } from 'react';
import {
  Box,
  Container,
  Typography,
  AppBar,
  Toolbar,
  Tabs,
  Tab,
  CircularProgress,
} from '@mui/material';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import BarChartIcon from '@mui/icons-material/BarChart';
import DateRangeIcon from '@mui/icons-material/DateRange';
import LayersIcon from '@mui/icons-material/Layers';
import PieChartIcon from '@mui/icons-material/PieChart';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import CalendarViewMonthIcon from '@mui/icons-material/CalendarViewMonth';
import { useTranslation } from 'react-i18next';
import { useTradesStore } from '../hooks/useTradesStore';
import { useJournalSettings } from '../hooks/useJournalSettings';
import { useAppPreferences } from '../hooks/useAppPreferences';
import { useCsvImport } from '../hooks/useCsvImport';
import { useXlsxExport } from '../hooks/useXlsxExport';
import {
  calculateAnalytics,
  calculateDrawdowns,
  calculateInstrumentPerformance,
} from '../lib/calculations';
import { LanguageSelector } from '../components/settings/LanguageSelector';
import { ThemeSwitcher } from '../components/settings/ThemeSwitcher';
import { SettingsDialog } from '../components/settings/SettingsDialog';
import { CsvUploadDropzone } from '../components/upload/CsvUploadDropzone';
import { ParseErrorSummary } from '../components/upload/ParseErrorSummary';
import { StatsCardGrid } from '../components/analytics/StatsCardGrid';
import { EquityCurveChart } from '../components/analytics/EquityCurveChart';
import { DailyPnlChart } from '../components/analytics/DailyPnlChart';
import { DayOfWeekChart } from '../components/analytics/DayOfWeekChart';
import { DrawdownChart } from '../components/analytics/DrawdownChart';
import { InstrumentChart } from '../components/analytics/InstrumentChart';
import { TradesTableToolbar } from '../components/table/TradesTableToolbar';
import { TradesTable } from '../components/table/TradesTable';
import { DailyOrdersMatrixTable } from '../components/matrix/DailyOrdersMatrixTable';

export const TradingJournalPage: React.FC = () => {
  const { t } = useTranslation();
  const {
    themeMode,
    setThemeMode,
    numberFormat,
    setNumberFormat,
  } = useAppPreferences();

  const {
    trades,
    isLoading: isTradesLoading,
    clearAll,
  } = useTradesStore();

  const {
    settings,
    updateSettings,
    updateInitialDeposit,
    setGroupBy,
    toggleSortOrder,
  } = useJournalSettings();

  const {
    handleFileImport,
    isImporting,
    lastResult,
    showErrorModal,
    closeErrorModal,
  } = useCsvImport();

  const { exportJournal, isExporting } = useXlsxExport();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeChartTab, setActiveChartTab] = useState(0);
  const [tableViewMode, setTableViewMode] = useState<'ledger' | 'matrix'>('ledger');

  // Compute analytics from current trades and initial deposit
  const analytics = useMemo(() => {
    return calculateAnalytics(settings.initialDeposit, trades);
  }, [trades, settings.initialDeposit]);

  const { equityCurve } = useMemo(() => {
    return calculateDrawdowns(settings.initialDeposit, trades);
  }, [trades, settings.initialDeposit]);

  // Aggregate daily P&L data for the periodic chart
  const dailyPnlData = useMemo(() => {
    const map: Record<string, { pnl: number; count: number }> = {};
    for (const trade of trades) {
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
  }, [trades]);

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'background.default' }}>
      {/* Top Application Bar */}
      <AppBar position="static" color="transparent" sx={{ borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}>
        <Toolbar variant="dense" sx={{ justifyContent: 'space-between', px: { xs: 2, md: 3 } }}>
          {/* Logo & Title */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              component="img"
              src="/favicon.svg"
              alt="Trading Journal Logo"
              sx={{
                width: 28,
                height: 28,
                display: 'block',
                flexShrink: 0,
              }}
            />
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
                {t('app.title')}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
                {t('app.subtitle')}
              </Typography>
            </Box>
          </Box>

          {/* Right Toolbar Controls: Language & Theme Switchers */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <LanguageSelector />
            <ThemeSwitcher currentMode={themeMode} onChange={setThemeMode} />
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content Area */}
      <Container maxWidth="xl" sx={{ py: 2.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {isTradesLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, minHeight: 300 }}>
            <CircularProgress />
          </Box>
        ) : trades.length === 0 ? (
          /* Empty State (Scenario A) */
          <Box sx={{ my: 'auto', py: 6, maxWidth: 640, mx: 'auto', width: '100%' }}>
            <CsvUploadDropzone onFileSelected={handleFileImport} isImporting={isImporting} />
          </Box>
        ) : (
          /* Populated State with Live Dashboard */
          <>
            {/* 1. Analytics Metric Cards Grid */}
            <StatsCardGrid
              analytics={analytics}
              currency={settings.currency}
              numberFormat={numberFormat}
            />

            {/* 2. Visualizations Tabs & Recharts Display */}
            <Box sx={{ mb: 2.5 }}>
              <Tabs
                value={activeChartTab}
                onChange={(_e, val) => setActiveChartTab(val)}
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
                <Tab icon={<ShowChartIcon sx={{ fontSize: 16 }} />} iconPosition="start" label={t('charts.equityCurve')} />
                <Tab icon={<BarChartIcon sx={{ fontSize: 16 }} />} iconPosition="start" label={t('charts.periodicPnl')} />
                <Tab icon={<DateRangeIcon sx={{ fontSize: 16 }} />} iconPosition="start" label={t('charts.dayOfWeek')} />
                <Tab icon={<LayersIcon sx={{ fontSize: 16 }} />} iconPosition="start" label={t('charts.drawdown')} />
                <Tab icon={<PieChartIcon sx={{ fontSize: 16 }} />} iconPosition="start" label={t('charts.instruments')} />
              </Tabs>

              {activeChartTab === 0 && (
                <EquityCurveChart
                  data={equityCurve}
                  currency={settings.currency}
                  numberFormat={numberFormat}
                />
              )}
              {activeChartTab === 1 && (
                <DailyPnlChart
                  data={dailyPnlData}
                  currency={settings.currency}
                  numberFormat={numberFormat}
                />
              )}
              {activeChartTab === 2 && (
                <DayOfWeekChart
                  data={analytics.dayOfWeekPerformance}
                  currency={settings.currency}
                  numberFormat={numberFormat}
                />
              )}
              {activeChartTab === 3 && (
                <DrawdownChart
                  data={equityCurve}
                  numberFormat={numberFormat}
                />
              )}
              {activeChartTab === 4 && (
                <InstrumentChart
                  data={calculateInstrumentPerformance(trades).byInstrument}
                  currency={settings.currency}
                  numberFormat={numberFormat}
                />
              )}
            </Box>

            {/* 3. Trades Ledger & Daily Orders Matrix Views */}
            <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
              <Tabs
                value={tableViewMode}
                onChange={(_e, val) => setTableViewMode(val)}
                sx={{
                  minHeight: 38,
                  '& .MuiTab-root': {
                    minHeight: 38,
                    py: 0.5,
                    px: 1.5,
                    fontSize: '0.8rem',
                    fontWeight: 700,
                  },
                }}
              >
                <Tab
                  value="ledger"
                  icon={<ReceiptLongIcon sx={{ fontSize: 18 }} />}
                  iconPosition="start"
                  label={`${t('dailyMatrix.tabLedger')} (${trades.length})`}
                />
                <Tab
                  value="matrix"
                  icon={<CalendarViewMonthIcon sx={{ fontSize: 18 }} />}
                  iconPosition="start"
                  label={t('dailyMatrix.tabMatrix')}
                />
              </Tabs>
            </Box>

            {tableViewMode === 'ledger' ? (
              <Box sx={{ borderRadius: 1, overflow: 'hidden', border: (theme) => `1px solid ${theme.palette.divider}` }}>
                <TradesTableToolbar
                  settings={settings}
                  tradeCount={trades.length}
                  isExporting={isExporting}
                  isImporting={isImporting}
                  onUpdateDeposit={updateInitialDeposit}
                  onSetGroupBy={setGroupBy}
                  onToggleSort={toggleSortOrder}
                  onExportXlsx={() => exportJournal(trades, settings)}
                  onUploadFile={handleFileImport}
                  onOpenSettings={() => setSettingsOpen(true)}
                />

                <TradesTable
                  trades={trades}
                  settings={settings}
                  numberFormat={numberFormat}
                  onToggleSort={toggleSortOrder}
                />
              </Box>
            ) : (
              <DailyOrdersMatrixTable
                trades={trades}
                currency={settings.currency}
                numberFormat={numberFormat}
                onExportXlsx={() => exportJournal(trades, settings)}
                isExporting={isExporting}
              />
            )}
          </>
        )}
      </Container>

      {/* Settings Modal */}
      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={updateSettings}
        numberFormat={numberFormat}
        onUpdateNumberFormat={setNumberFormat}
        onClearAllData={clearAll}
      />

      {/* CSV Diagnostics / Error Modal */}
      <ParseErrorSummary
        open={showErrorModal}
        onClose={closeErrorModal}
        result={lastResult}
      />
    </Box>
  );
};
