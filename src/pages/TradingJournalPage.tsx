import React, { useState, useMemo, useCallback, useTransition } from 'react';
import { Box, Container, Typography, Button } from '@mui/material';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { useTranslation } from 'react-i18next';
import { useTradesStore } from '../hooks/useTradesStore';
import { useJournalSettings } from '../hooks/useJournalSettings';
import { useAppPreferences } from '../hooks/useAppPreferences';
import { useCsvImport } from '../hooks/useCsvImport';
import { useXlsxExport } from '../hooks/useXlsxExport';
import { useTimeframeFilter } from '../hooks/useTimeframeFilter';
import { calculateAnalytics, calculateDrawdowns } from '../lib/calculations';
import { JournalHeader } from '../components/layout/JournalHeader';
import { PageLayoutSettingsDrawer } from '../components/settings/PageLayoutSettingsDrawer';
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
import { PageBlockId, DEFAULT_PAGE_BLOCK_ORDER } from '../types/preferences';

export const TradingJournalPage: React.FC = () => {
  const { t } = useTranslation();
  const { currentLocale, themeMode, setThemeMode, numberFormat, setNumberFormat } =
    useAppPreferences();

  const { trades, isLoading: isTradesLoading, clearAll } = useTradesStore();

  const {
    settings,
    updateSettings,
    updateInitialDeposit,
    setGroupBy,
    toggleSortOrder,
    updatePageBlockOrder,
    togglePageBlockVisibility,
    resetPageBlocksLayout,
    showAllPageBlocks,
  } = useJournalSettings();

  const { handleFileImport, isImporting, lastResult, showErrorModal, closeErrorModal } =
    useCsvImport();

  const { exportJournal, isExporting } = useXlsxExport();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [, startTransition] = useTransition();

  const handleOpenSettings = useCallback(() => setSettingsOpen(true), []);
  const handleCloseSettings = useCallback(() => setSettingsOpen(false), []);

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

  const handleSelectTimeframe = useCallback(
    (tf: any) => {
      startTransition(() => setTimeframe(tf));
    },
    [setTimeframe]
  );

  const handleClearInstrument = useCallback(() => {
    setSelectedInstrument(null);
  }, [setSelectedInstrument]);

  const handleUpdateMonthlyGoal = useCallback(
    (goal: number) => {
      updateSettings({ monthlyGoal: goal });
    },
    [updateSettings]
  );

  const handleUpdateCustomRange = useCallback(
    (start: string, end: string) => {
      setCustomStartDate(start);
      setCustomEndDate(end);
    },
    [setCustomStartDate, setCustomEndDate]
  );

  const handleSelectInstrument = useCallback(
    (sym: string) => {
      setSelectedInstrument(selectedInstrument?.toLowerCase() === sym.toLowerCase() ? null : sym);
    },
    [selectedInstrument, setSelectedInstrument]
  );

  const handleExportXlsx = useCallback(() => {
    exportJournal(trades, settings, currentLocale);
  }, [exportJournal, trades, settings, currentLocale]);

  // Compute analytics dynamically from filtered trades
  const analytics = useMemo(() => {
    return calculateAnalytics(settings.initialDeposit, filteredTrades);
  }, [filteredTrades, settings.initialDeposit]);

  const { equityCurve } = useMemo(() => {
    return calculateDrawdowns(settings.initialDeposit, filteredTrades);
  }, [filteredTrades, settings.initialDeposit]);

  const visibleBlocks = useMemo(() => {
    const blockOrder = settings.pageBlockOrder || DEFAULT_PAGE_BLOCK_ORDER;
    const hiddenBlocks = settings.hiddenPageBlocks || [];
    return blockOrder.filter((blockId) => !hiddenBlocks.includes(blockId));
  }, [settings.pageBlockOrder, settings.hiddenPageBlocks]);

  const renderPageBlock = useCallback(
    (blockId: PageBlockId) => {
      switch (blockId) {
        case 'timeframeBanner':
          return (
            <Box
              key="timeframeBanner"
              component="section"
              aria-label="Timeframe and Performance Summary"
            >
              <TimeframeHeaderBanner
                netPnl={analytics.netPnl}
                roiPercent={analytics.roiPercent}
                tradeCount={filteredTrades.length}
                currency={settings.currency}
                numberFormat={numberFormat}
                dateRangeLabel={dateRangeLabel}
                timeframe={timeframe}
                onSelectTimeframe={handleSelectTimeframe}
                selectedInstrument={selectedInstrument}
                onClearInstrument={handleClearInstrument}
                monthlyGoal={settings.monthlyGoal}
                onUpdateMonthlyGoal={handleUpdateMonthlyGoal}
                customStartDate={customStartDate}
                customEndDate={customEndDate}
                onUpdateCustomRange={handleUpdateCustomRange}
                initialDeposit={settings.initialDeposit}
                onUpdateDeposit={updateInitialDeposit}
              />
            </Box>
          );
        case 'statsGrid':
          return (
            <Box key="statsGrid" component="section" aria-label="Quantitative Risk Metrics">
              <StatsCardGrid
                analytics={analytics}
                currency={settings.currency}
                numberFormat={numberFormat}
              />
            </Box>
          );
        case 'periodInsights':
          return <PeriodInsightsCard key="periodInsights" insights={analytics.insights} />;
        case 'visualizations':
          return (
            <VisualizationsSection
              key="visualizations"
              filteredTrades={filteredTrades}
              equityCurve={equityCurve}
              dayOfWeekPerformance={analytics.dayOfWeekPerformance}
              currency={settings.currency}
              numberFormat={numberFormat}
            />
          );
        case 'streakAnalysis':
          return (
            <Box
              key="streakAnalysis"
              component="section"
              aria-label="Winning and Losing Streak Analysis"
            >
              <StreakAnalysisSection streakAnalysis={analytics.streakAnalysis} />
            </Box>
          );
        case 'instrumentsTable':
          return (
            <Box
              key="instrumentsTable"
              component="section"
              aria-label="Instruments Performance Breakdown"
            >
              <InstrumentsTable
                data={analytics.instrumentBreakdown}
                currency={settings.currency}
                numberFormat={numberFormat}
                selectedInstrument={selectedInstrument}
                onSelectInstrument={handleSelectInstrument}
              />
            </Box>
          );
        case 'monthlyReturns':
          return (
            <Box key="monthlyReturns" component="section" aria-label="Monthly Returns Matrix">
              <MonthlyReturnsHeatmap
                data={analytics.monthlyReturns}
                currency={settings.currency}
                numberFormat={numberFormat}
              />
            </Box>
          );
        case 'tradesView':
          return (
            <TradesViewSection
              key="tradesView"
              filteredTrades={filteredTrades}
              settings={settings}
              numberFormat={numberFormat}
              isExporting={isExporting}
              isImporting={isImporting}
              onSetGroupBy={setGroupBy}
              onToggleSort={toggleSortOrder}
              onExportXlsx={handleExportXlsx}
              onUploadFile={handleFileImport}
              onOpenSettings={handleOpenSettings}
            />
          );
        default:
          return null;
      }
    },
    [
      analytics,
      filteredTrades,
      settings,
      numberFormat,
      dateRangeLabel,
      timeframe,
      handleSelectTimeframe,
      selectedInstrument,
      handleClearInstrument,
      handleUpdateMonthlyGoal,
      customStartDate,
      customEndDate,
      handleUpdateCustomRange,
      updateInitialDeposit,
      equityCurve,
      handleSelectInstrument,
      isExporting,
      isImporting,
      setGroupBy,
      toggleSortOrder,
      handleExportXlsx,
      handleFileImport,
      handleOpenSettings,
      analytics.roiPercent,
      settings.monthlyGoal,
      settings.initialDeposit,
    ]
  );

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'background.default',
      }}
    >
      {/* React 19 Document Head Metadata & GEO Structured Data */}
      <SEOHead />

      {/* Top Application Bar with Semantic Landmark */}
      <JournalHeader
        themeMode={themeMode}
        onThemeModeChange={setThemeMode}
        onOpenSettings={handleOpenSettings}
      />

      {/* Main Semantic Landmark Content Area */}
      <Container
        component="main"
        maxWidth="xl"
        sx={{ py: 2.5, flex: 1, display: 'flex', flexDirection: 'column' }}
      >
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
        ) : /* Populated State with Dynamic Block Layout */
        visibleBlocks.length === 0 ? (
          <Box
            sx={{
              my: 'auto',
              py: 8,
              maxWidth: 480,
              mx: 'auto',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {t('layoutSettings.allHiddenTitle')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('layoutSettings.allHiddenSubtitle')}
            </Typography>
            <Button
              variant="contained"
              startIcon={<RestartAltIcon />}
              onClick={showAllPageBlocks}
              sx={{ mt: 1 }}
            >
              {t('layoutSettings.restoreBlocks')}
            </Button>
          </Box>
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2.5,
              width: '100%',
              '& > *': {
                mb: '0 !important',
              },
            }}
          >
            {visibleBlocks.map(renderPageBlock)}
          </Box>
        )}
      </Container>

      {/* Page Layout & Settings Sidebar Drawer */}
      <PageLayoutSettingsDrawer
        open={settingsOpen}
        onClose={handleCloseSettings}
        settings={settings}
        onUpdateBlockOrder={updatePageBlockOrder}
        onToggleBlockVisibility={togglePageBlockVisibility}
        onResetLayout={resetPageBlocksLayout}
        onShowAllBlocks={showAllPageBlocks}
        onUpdateSettings={updateSettings}
        numberFormat={numberFormat}
        onUpdateNumberFormat={setNumberFormat}
        onClearAllData={clearAll}
      />

      {/* CSV Diagnostics / Error Modal */}
      <ParseErrorSummary open={showErrorModal} onClose={closeErrorModal} result={lastResult} />
    </Box>
  );
};
