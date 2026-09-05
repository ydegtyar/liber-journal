import { useState, useCallback, useMemo } from 'react';
import { Trade } from '../types/trade';
import { JournalSettings, Locale } from '../types/preferences';
import { useAppPreferences } from './useAppPreferences';

export function useXlsxExport() {
  const [isExporting, setIsExporting] = useState(false);
  const { currentLocale } = useAppPreferences();

  const exportJournal = useCallback(
    async (trades: Trade[], settings: JournalSettings, exportLocale?: string | Locale) => {
      if (trades.length === 0) return;
      setIsExporting(true);
      try {
        const loc = exportLocale || currentLocale;
        const activeLocale: Locale = loc?.startsWith('uk') ? 'uk' : 'en';
        const [{ generateXlsxWorkbook }, { saveAs }] = await Promise.all([
          import('../lib/xlsxTemplate'),
          import('file-saver'),
        ]);
        const blob = await generateXlsxWorkbook(trades, settings, activeLocale);
        const dateStr = new Date().toISOString().split('T')[0];
        saveAs(blob, `trading_journal_${dateStr}.xlsx`);
      } catch (err) {
        console.error('Failed to export XLSX:', err);
      } finally {
        setIsExporting(false);
      }
    },
    [currentLocale]
  );

  return useMemo(
    () => ({
      exportJournal,
      isExporting,
    }),
    [exportJournal, isExporting]
  );
}
