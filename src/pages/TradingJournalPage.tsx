import React, { useState, useMemo, useTransition } from 'react';
import { Box, Container } from '@mui/material';
import { useTradesStore } from '../hooks/useTradesStore';
import { useJournalSettings } from '../hooks/useJournalSettings';
import { useAppPreferences } from '../hooks/useAppPreferences';
import { useCsvImport } from '../hooks/useCsvImport';
import { useXlsxExport } from '../hooks/useXlsxExport';
import { useTimeframeFilter } from '../hooks/useTimeframeFilter';
import { calculateAnalytics, calculateDrawdowns } from '../lib/calculations';
import { JournalHeader } from '../components/layout/JournalHeader';
import { SettingsDialog } from '../components/settings/SettingsDialog';
import { CsvUploadDropzone } from '../components/upload/CsvUploadDropzone';
import { ParseErrorSummary } from '../components/upload/ParseErrorSummary';
import { TimeframeHeaderBanner } from '../components/analytics/TimeframeHeaderBanner';
import { PeriodInsightsCard } from '../components/analytics/PeriodInsightsCard';
import { StatsCardGrid } from '../components/analytics/StatsCardGrid';
import { VisualizationsSection } from '../components/analytics/VisualizationsSection';
import { StreakAnalysisSection } from '../components/analytics/StreakAnalysisSection';
import { InstrumentsTable } from '../components/analytics/InstrumentsTable';
import { MonthlyReturnsHeatmap } from '../components/analytics/MonthlyReturnsHeatmap';
import { TradesViewSection } from '../components/table/TradesViewSection';
import { SEOHead } from '../components/seo/SEOHead';
import { TradingTerminalLoader } from '../components/common/TradingTerminalLoader';

export const TradingJournalPage: React.FC = () => {
  const {
    currentLocale,
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
  const [, startTransition] = useTransition();

  // Timeframe and instrument filtering hook
  const {
    timeframe,
    setTimeframe,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    selectedInstrument,
    setSelectedInstrument,
    filteredTrades,
    dateRangeLabel,
  } = useTimeframeFilter(trades);

  // Compute analytics dynamically from filtered trades
  const analytics = useMemo(() => {
    return calculateAnalytics(settings.initialDeposit, filteredTrades);
  }, [filteredTrades, settings.initialDeposit]);

  const { equityCurve } = useMemo(() => {
    return calculateDrawdowns(settings.initialDeposit, filteredTrades);
  }, [filteredTrades, settings.initialDeposit]);

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'background.default' }}>
      {/* React 19 Document Head Metadata & GEO Structured Data */}
      <SEOHead />

      {/* Top Application Bar with Semantic Landmark */}
      <JournalHeader themeMode={themeMode} onThemeModeChange={setThemeMode} />

      {/* Main Semantic Landmark Content Area */}
      <Container component="main" maxWidth="xl" sx={{ py: 2.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {isTradesLoading ? (
          <Box sx={{ my: 'auto', py: 6, maxWidth: 640, mx: 'auto', width: '100%' }}>
            <TradingTerminalLoader
              minHeight={320}
              message="DECRYPTING LOCAL INDEXEDDB LEDGER..."
              subMessage="100% PRIVATE CLIENT-SIDE STORAGE"
            />
          </Box>
        ) : trades.length === 0 ? (
          /* Empty State */
          <Box sx={{ my: 'auto', py: 6, maxWidth: 640, mx: 'auto', width: '100%' }}>
            <CsvUploadDropzone onFileSelected={handleFileImport} isImporting={isImporting} />
          </Box>
        ) : (
          /* Populated State with Live Dashboard */
          <>
            {/* 1. Timeframe Banner & Quick Filters */}
            <Box component="section" aria-label="Timeframe and Performance Summary">
              <TimeframeHeaderBanner
                netPnl={analytics.netPnl}
                roiPercent={analytics.roiPercent}
                tradeCount={filteredTrades.length}
                currency={settings.currency}
                numberFormat={numberFormat}
                dateRangeLabel={dateRangeLabel}
                timeframe={timeframe}
                onSelectTimeframe={(tf) => startTransition(() => setTimeframe(tf))}
                selectedInstrument={selectedInstrument}
                onClearInstrument={() => setSelectedInstrument(null)}
                monthlyGoal={settings.monthlyGoal}
                onUpdateMonthlyGoal={(goal) => updateSettings({ monthlyGoal: goal })}
                customStartDate={customStartDate}
                customEndDate={customEndDate}
                onUpdateCustomRange={(start, end) => {
                  setCustomStartDate(start);
                  setCustomEndDate(end);
                }}
              />
            </Box>

            {/* 2. Key Metrics Grid (Win Rate, Profit Factor, etc.) */}
            <Box component="section" aria-label="Quantitative Risk Metrics">
              <StatsCardGrid
                analytics={analytics}
                currency={settings.currency}
                numberFormat={numberFormat}
              />
            </Box>

            {/* 3. Period Insights Card matching competitor Screenshot 1 */}
            <PeriodInsightsCard insights={analytics.insights} />

            {/* 4. Visualizations Tabs & Recharts Display */}
            <VisualizationsSection
              filteredTrades={filteredTrades}
              equityCurve={equityCurve}
              dayOfWeekPerformance={analytics.dayOfWeekPerformance}
              currency={settings.currency}
              numberFormat={numberFormat}
            />

            {/* 5. Streak Analysis Section */}
            <Box component="section" aria-label="Winning and Losing Streak Analysis">
              <StreakAnalysisSection streakAnalysis={analytics.streakAnalysis} />
            </Box>

            {/* 6. Instruments Breakdown Table */}
            <Box component="section" aria-label="Instruments Performance Breakdown">
              <InstrumentsTable
                data={analytics.instrumentBreakdown}
                currency={settings.currency}
                numberFormat={numberFormat}
                selectedInstrument={selectedInstrument}
                onSelectInstrument={(sym) =>
                  setSelectedInstrument(selectedInstrument?.toLowerCase() === sym.toLowerCase() ? null : sym)
                }
              />
            </Box>

            {/* 7. Monthly Returns Heatmap */}
            <Box component="section" aria-label="Monthly Returns Matrix">
              <MonthlyReturnsHeatmap
                data={analytics.monthlyReturns}
                currency={settings.currency}
                numberFormat={numberFormat}
              />
            </Box>

            {/* 8. Trades Ledger & Daily Orders Matrix Views */}
            <TradesViewSection
              filteredTrades={filteredTrades}
              settings={settings}
              numberFormat={numberFormat}
              isExporting={isExporting}
              isImporting={isImporting}
              onUpdateDeposit={updateInitialDeposit}
              onSetGroupBy={setGroupBy}
              onToggleSort={toggleSortOrder}
              onExportXlsx={() => exportJournal(trades, settings, currentLocale)}
              onUploadFile={handleFileImport}
              onOpenSettings={() => setSettingsOpen(true)}
            />
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
