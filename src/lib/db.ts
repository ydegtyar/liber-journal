import Dexie, { Table } from 'dexie';
import { Trade } from '../types/trade';
import { JournalSettings, DEFAULT_JOURNAL_SETTINGS } from '../types/preferences';

export class TradingJournalDatabase extends Dexie {
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
export async function getStoredJournalSettings(): Promise<JournalSettings> {
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
 * De-duplicates and saves trades into IndexedDB.
 * Updates existing trades with matching IDs, adds new ones.
 */
export async function importTrades(newTrades: Trade[]): Promise<{ importedCount: number; updatedCount: number }> {
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
