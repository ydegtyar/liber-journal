import { useState, useCallback, useMemo } from 'react';
import { parseBrokerCsv, ParseResult } from '../lib/csvParser';
import { importTrades } from '../lib/db';
import { useJournalSettings } from './useJournalSettings';

export function useCsvImport() {
  const [isImporting, setIsImporting] = useState(false);
  const [lastResult, setLastResult] = useState<ParseResult | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const { updateSettings } = useJournalSettings();

  const handleFileImport = useCallback(
    async (file: File) => {
      setIsImporting(true);
      try {
        const text = await file.text();
        const result = parseBrokerCsv(text);
        setLastResult(result);

        if (result.trades.length > 0) {
          await importTrades(result.trades);

          // Update currency if found
          if (result.metadata.currency) {
            await updateSettings({ currency: result.metadata.currency });
          }
        }

        if (result.errors.length > 0 || result.warnings.length > 0) {
          setShowErrorModal(true);
        }
        return result;
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

  const closeErrorModal = useCallback(() => {
    setShowErrorModal(false);
  }, []);

  return useMemo(
    () => ({
      handleFileImport,
      isImporting,
      lastResult,
      showErrorModal,
      closeErrorModal,
    }),
    [handleFileImport, isImporting, lastResult, showErrorModal, closeErrorModal]
  );
}
