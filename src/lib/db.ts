import Dexie, { Table } from 'dexie';
import { Trade } from '../types/trade';
import {
  JournalSettings,
  DEFAULT_JOURNAL_SETTINGS,
  MatrixColumnBlockId,
  DEFAULT_MATRIX_COLUMN_ORDER,
} from '../types/preferences';

class TradingJournalDatabase extends Dexie {
  trades!: Table<Trade, string>;
  settings!: Table<{ key: string; value: unknown }, string>;

  constructor() {
    super('TradingJournalDB');

    this.version(1).stores({
      trades: 'id, dealId, instrument, closedAt, pnl',
      settings: 'key',
    });
  }
}

export const db = new TradingJournalDatabase();

/**
 * Initializes settings with defaults if not present.
 */
async function getStoredJournalSettings(): Promise<JournalSettings> {
  const record = await db.settings.get('journalSettings');
  if (record && record.value) {
    return { ...DEFAULT_JOURNAL_SETTINGS, ...(record.value as Partial<JournalSettings>) };
  }
  await db.settings.put({ key: 'journalSettings', value: DEFAULT_JOURNAL_SETTINGS });
  return DEFAULT_JOURNAL_SETTINGS;
}

/**
 * Saves journal settings to IndexedDB.
 */
export async function saveJournalSettings(settings: JournalSettings): Promise<void> {
  await db.settings.put({ key: 'journalSettings', value: settings });
}

/**
 * Retrieves the stored matrix column block order from IndexedDB.
 */
export async function getStoredMatrixColumnOrder(): Promise<MatrixColumnBlockId[]> {
  const record = await db.settings.get('matrixColumnOrder');
  if (record && Array.isArray(record.value) && record.value.length > 0) {
    return record.value as MatrixColumnBlockId[];
  }
  // Fallback to journalSettings.matrixColumnOrder
  const settingsRecord = await db.settings.get('journalSettings');
  const js = settingsRecord?.value as Partial<JournalSettings> | undefined;
  if (
    js?.matrixColumnOrder &&
    Array.isArray(js.matrixColumnOrder) &&
    js.matrixColumnOrder.length > 0
  ) {
    return js.matrixColumnOrder;
  }
  return DEFAULT_MATRIX_COLUMN_ORDER;
}

/**
 * Saves the matrix column block order to IndexedDB.
 */
export async function saveMatrixColumnOrder(order: MatrixColumnBlockId[]): Promise<void> {
  await db.settings.put({ key: 'matrixColumnOrder', value: order });
  // Also update inside journalSettings if present
  const currentSettings = await getStoredJournalSettings();
  await saveJournalSettings({ ...currentSettings, matrixColumnOrder: order });
}

/**
 * De-duplicates and saves trades into IndexedDB.
 * Updates existing trades with matching IDs, adds new ones.
 */
export async function importTrades(
  newTrades: Trade[]
): Promise<{ importedCount: number; updatedCount: number }> {
  let importedCount = 0;
  let updatedCount = 0;

  await db.transaction('rw', db.trades, async () => {
    for (const trade of newTrades) {
      const existing = await db.trades.get(trade.id);
      if (existing) {
        // Keep user-edited notes/tags/plannedRisk if present on existing
        await db.trades.put({
          ...trade,
          tag: existing.tag || trade.tag,
          session: existing.session || trade.session,
          note: existing.note || trade.note,
          plannedRisk: existing.plannedRisk || trade.plannedRisk,
        });
        updatedCount++;
      } else {
        await db.trades.add(trade);
        importedCount++;
      }
    }
  });

  return { importedCount, updatedCount };
}

/**
 * Completely clears all trades from IndexedDB.
 */
export async function clearAllTrades(): Promise<void> {
  await db.trades.clear();
}
