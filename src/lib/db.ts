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

export interface MergeResult {
  mode: 'merge';
  importedCount: number;
  conflictsResolvedCount: number;
  unchangedCount: number;
  totalCount: number;
}

export interface ReplaceResult {
  mode: 'replace';
  deletedCount: number;
  importedCount: number;
  totalCount: number;
}

export interface DirectImportResult {
  mode: 'direct';
  importedCount: number;
  totalCount: number;
}

export type ImportSummaryData = MergeResult | ReplaceResult | DirectImportResult;

/**
 * Compares financial and execution fields of two trades to detect conflict vs identical data.
 */
export function areTradeValuesEqual(a: Trade, b: Trade): boolean {
  return (
    a.instrument === b.instrument &&
    a.direction === b.direction &&
    a.openedAt === b.openedAt &&
    a.closedAt === b.closedAt &&
    Math.abs(a.openPrice - b.openPrice) < 0.000001 &&
    Math.abs(a.closePrice - b.closePrice) < 0.000001 &&
    Math.abs(a.margin - b.margin) < 0.000001 &&
    Math.abs(a.leverage - b.leverage) < 0.000001 &&
    Math.abs(a.grossReturn - b.grossReturn) < 0.000001 &&
    Math.abs(a.pnl - b.pnl) < 0.000001
  );
}

/**
 * Merges deals by trade number (dealId or id).
 * On conflict (fields differ), uses fresh data.
 * On same data, keeps old data.
 * Completely new deals are appended.
 */
export async function mergeTrades(newTrades: Trade[]): Promise<MergeResult> {
  let importedCount = 0;
  let conflictsResolvedCount = 0;
  let unchangedCount = 0;

  await db.transaction('rw', db.trades, async () => {
    // Build a map of existing trades by dealId and id
    const existingList = await db.trades.toArray();
    const existingById = new Map<string, Trade>();
    const existingByDealId = new Map<string, Trade>();

    for (const item of existingList) {
      existingById.set(item.id, item);
      if (item.dealId) {
        existingByDealId.set(item.dealId, item);
      }
    }

    for (const trade of newTrades) {
      const existing =
        (trade.dealId ? existingByDealId.get(trade.dealId) : undefined) ||
        existingById.get(trade.id);

      if (existing) {
        if (areTradeValuesEqual(existing, trade)) {
          // Same data: use old (keep unchanged)
          unchangedCount++;
        } else {
          // Conflict: use fresh data, preserving user notes / tags
          await db.trades.put({
            ...trade,
            id: existing.id,
            tag: existing.tag || trade.tag,
            session: existing.session || trade.session,
            note: existing.note || trade.note,
            plannedRisk: existing.plannedRisk || trade.plannedRisk,
          });
          conflictsResolvedCount++;
        }
      } else {
        await db.trades.add(trade);
        importedCount++;
        // Update in-memory lookup so duplicates in the same CSV batch don't double insert
        existingById.set(trade.id, trade);
        if (trade.dealId) {
          existingByDealId.set(trade.dealId, trade);
        }
      }
    }
  });

  const totalCount = await db.trades.count();
  return {
    mode: 'merge',
    importedCount,
    conflictsResolvedCount,
    unchangedCount,
    totalCount,
  };
}

/**
 * Removes all old data and writes new trades.
 */
export async function replaceTrades(newTrades: Trade[]): Promise<ReplaceResult> {
  const deletedCount = await db.trades.count();
  await db.transaction('rw', db.trades, async () => {
    await db.trades.clear();
    await db.trades.bulkAdd(newTrades);
  });
  const totalCount = await db.trades.count();
  return {
    mode: 'replace',
    deletedCount,
    importedCount: newTrades.length,
    totalCount,
  };
}

/**
 * Direct import when no old data exists.
 */
export async function importTradesDirectly(newTrades: Trade[]): Promise<DirectImportResult> {
  await db.trades.bulkAdd(newTrades);
  const totalCount = await db.trades.count();
  return {
    mode: 'direct',
    importedCount: newTrades.length,
    totalCount,
  };
}

/**
 * Completely clears all trades from IndexedDB.
 */
export async function clearAllTrades(): Promise<void> {
  await db.trades.clear();
}
