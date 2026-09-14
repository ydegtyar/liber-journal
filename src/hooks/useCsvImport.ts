import { useState, useCallback, useMemo } from 'react';
import { parseBrokerCsv, ParseResult } from '../lib/csvParser';
import { db, mergeTrades, replaceTrades, importTradesDirectly, ImportSummaryData } from '../lib/db';
import { ImportStrategy } from '../components/upload/ImportStrategyDialog';
import { useJournalSettings } from './useJournalSettings';

interface PendingImport {
  file: File;
  result: ParseResult;
}

export function useCsvImport() {
  const [isImporting, setIsImporting] = useState(false);
  const [isProcessingStrategy, setIsProcessingStrategy] = useState(false);
  const [lastResult, setLastResult] = useState<ParseResult | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);

  // Strategy & Summary state
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null);
  const [showStrategyModal, setShowStrategyModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryData, setSummaryData] = useState<ImportSummaryData | null>(null);

  const { updateSettings } = useJournalSettings();

  const handleFileImport = useCallback(
    async (file: File) => {
      setIsImporting(true);
      try {
        const text = await file.text();
        const result = parseBrokerCsv(text);
        setLastResult(result);

        // If no trades parsed, or critical errors
        if (result.trades.length === 0) {
          setShowErrorModal(true);
          return null;
        }

        // Check if there is existing old data in the database
        const existingCount = await db.trades.count();

        if (existingCount === 0) {
          // On initial import (no old data), import directly without showing any dialogs
          const directResult = await importTradesDirectly(result.trades);

          if (result.metadata.currency) {
            await updateSettings({ currency: result.metadata.currency });
          }

          return directResult;
        }

        // Old data exists: prompt user with strategy dialog (Merge vs Replace)
        setPendingImport({ file, result });
        setShowStrategyModal(true);
        return null;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown parsing error';
        setLastResult({
          trades: [],
          metadata: { currency: 'USD' },
          checksumPassed: false,
          errors: [errorMsg],
          warnings: [],
        });
        setShowErrorModal(true);
        return null;
      } finally {
        setIsImporting(false);
      }
    },
    [updateSettings]
  );

  const handleConfirmStrategy = useCallback(
    async (strategy: ImportStrategy) => {
      if (!pendingImport) return;
      setIsProcessingStrategy(true);

      try {
        let outcome: ImportSummaryData;

        if (strategy === 'merge') {
          outcome = await mergeTrades(pendingImport.result.trades);
        } else {
          outcome = await replaceTrades(pendingImport.result.trades);
        }

        if (pendingImport.result.metadata.currency) {
          await updateSettings({ currency: pendingImport.result.metadata.currency });
        }

        setSummaryData(outcome);
        setShowStrategyModal(false);
        setPendingImport(null);
        setShowSummaryModal(true);
      } finally {
        setIsProcessingStrategy(false);
      }
    },
    [pendingImport, updateSettings]
  );

  const handleCancelStrategy = useCallback(() => {
    setShowStrategyModal(false);
    setPendingImport(null);
  }, []);

  const closeSummaryModal = useCallback(() => {
    setShowSummaryModal(false);
    setSummaryData(null);
  }, []);

  const closeErrorModal = useCallback(() => {
    setShowErrorModal(false);
  }, []);

  return useMemo(
    () => ({
      handleFileImport,
      isImporting,
      isProcessingStrategy,
      lastResult,
      showErrorModal,
      closeErrorModal,
      showStrategyModal,
      pendingImport,
      handleConfirmStrategy,
      handleCancelStrategy,
      showSummaryModal,
      summaryData,
      closeSummaryModal,
    }),
    [
      handleFileImport,
      isImporting,
      isProcessingStrategy,
      lastResult,
      showErrorModal,
      closeErrorModal,
      showStrategyModal,
      pendingImport,
      handleConfirmStrategy,
      handleCancelStrategy,
      showSummaryModal,
      summaryData,
      closeSummaryModal,
    ]
  );
}
