import { useState } from 'react';
import { saveAs } from 'file-saver';
import { generateXlsxWorkbook } from '../lib/xlsxTemplate';
import { Trade } from '../types/trade';
import { JournalSettings } from '../types/preferences';

export function useXlsxExport() {
  const [isExporting, setIsExporting] = useState(false);

  const exportJournal = async (trades: Trade[], settings: JournalSettings) => {
    if (trades.length === 0) return;
    setIsExporting(true);
    try {
      const blob = await generateXlsxWorkbook(trades, settings);
      const dateStr = new Date().toISOString().split('T')[0];
      saveAs(blob, `trading_journal_${dateStr}.xlsx`);
    } catch (err) {
      console.error('Failed to export XLSX:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportJournal,
    isExporting,
  };
}
