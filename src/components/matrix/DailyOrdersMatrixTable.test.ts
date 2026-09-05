import { describe, it, expect, vi } from 'vitest';
import { Trade } from '../../types/trade';
import { MatrixColumnBlockId, DEFAULT_MATRIX_COLUMN_ORDER } from '../../types/preferences';
import { getTradeDateKey, formatDisplayDate } from '../../lib/xlsxTemplate';
import { db, getStoredMatrixColumnOrder, saveMatrixColumnOrder } from '../../lib/db';
import { ColumnDragPreview } from './ColumnDragPreview.tsx';

describe('Daily Orders Matrix Export Format & Copying Logic', () => {
  const sampleTrades: Trade[] = [
    {
      id: 't1',
      dealId: 'DEAL-101',
      instrument: 'EUR/USD',
      direction: 'buy',
      openedAt: '2026-09-02T10:00:00Z',
      closedAt: '2026-09-02T10:30:00Z',
      openPrice: 1.085,
      closePrice: 1.087,
      margin: 100,
      leverage: 20,
      grossReturn: 2.5,
      pnl: 2.5,
    },
    {
      id: 't2',
      dealId: 'DEAL-102',
      instrument: 'GBP/USD',
      direction: 'sell',
      openedAt: '2026-09-02T11:00:00Z',
      closedAt: '2026-09-02T11:45:00Z',
      openPrice: 1.285,
      closePrice: 1.288,
      margin: 100,
      leverage: 20,
      grossReturn: -1.2,
      pnl: -1.2,
    },
    {
      id: 't3',
      dealId: 'DEAL-103',
      instrument: 'USD/JPY',
      direction: 'buy',
      openedAt: '2026-09-03T09:00:00Z',
      closedAt: '2026-09-03T09:15:00Z',
      openPrice: 145.2,
      closePrice: 145.5,
      margin: 200,
      leverage: 10,
      grossReturn: 3.1,
      pnl: 3.1,
    },
  ];

  it('groups trades correctly by date key', () => {
    const dayMap: Record<string, Trade[]> = {};
    for (const trade of sampleTrades) {
      const key = getTradeDateKey(trade.closedAt);
      if (!dayMap[key]) dayMap[key] = [];
      dayMap[key].push(trade);
    }

    expect(Object.keys(dayMap)).toEqual(['2026-09-02', '2026-09-03']);
    expect(dayMap['2026-09-02'].length).toBe(2);
    expect(dayMap['2026-09-03'].length).toBe(1);

    expect(formatDisplayDate('2026-09-02')).toBe('02.09.2026');
    expect(formatDisplayDate('2026-09-03')).toBe('03.09.2026');
  });

  it('formats single day row for clipboard pasting respecting default columnOrder', () => {
    const dayTrades = sampleTrades.filter((t) => getTradeDateKey(t.closedAt) === '2026-09-02');
    const displayDate = formatDisplayDate('2026-09-02');
    const orderCount = dayTrades.length;
    const dailyPnl = dayTrades.reduce((acc, t) => acc + t.pnl, 0);

    const colsCount = 4;
    const columnOrder: MatrixColumnBlockId[] = DEFAULT_MATRIX_COLUMN_ORDER;

    const cells: string[] = [];
    columnOrder.forEach((blockId) => {
      if (blockId === 'date') cells.push(displayDate);
      else if (blockId === 'ordersCount') cells.push(String(orderCount));
      else if (blockId === 'dailyPnl') cells.push(dailyPnl.toFixed(2));
      else if (blockId === 'orders') {
        dayTrades.forEach((t) => cells.push(t.pnl.toFixed(2)));
        for (let i = dayTrades.length; i < colsCount; i++) cells.push('');
      }
    });

    const tsvString = cells.join('\t');
    const parsedCells = tsvString.split('\t');

    // Expected: 02.09.2026 \t 2 \t 1.30 \t 2.50 \t -1.20 \t [empty] \t [empty]
    expect(parsedCells[0]).toBe('02.09.2026');
    expect(parsedCells[1]).toBe('2');
    expect(parsedCells[2]).toBe('1.30');
    expect(parsedCells[3]).toBe('2.50');
    expect(parsedCells[4]).toBe('-1.20');
    expect(parsedCells[5]).toBe('');
    expect(parsedCells[6]).toBe('');
  });

  it('formats single day row for clipboard pasting respecting custom columnOrder', () => {
    const dayTrades = sampleTrades.filter((t) => getTradeDateKey(t.closedAt) === '2026-09-02');
    const displayDate = formatDisplayDate('2026-09-02');
    const orderCount = dayTrades.length;
    const dailyPnl = dayTrades.reduce((acc, t) => acc + t.pnl, 0);

    const customOrder: MatrixColumnBlockId[] = ['dailyPnl', 'date', 'orders', 'ordersCount'];

    const cells: string[] = [];
    customOrder.forEach((blockId) => {
      if (blockId === 'date') cells.push(displayDate);
      else if (blockId === 'ordersCount') cells.push(String(orderCount));
      else if (blockId === 'dailyPnl') cells.push(dailyPnl.toFixed(2));
      else if (blockId === 'orders') {
        dayTrades.forEach((t) => cells.push(t.pnl.toFixed(2)));
      }
    });

    const tsvString = cells.join('\t');
    const parsedCells = tsvString.split('\t');

    // Custom: Daily P&L (1.30) \t Date (02.09.2026) \t Order 1 (2.50) \t Order 2 (-1.20) \t Orders Count (2)
    expect(parsedCells[0]).toBe('1.30');
    expect(parsedCells[1]).toBe('02.09.2026');
    expect(parsedCells[2]).toBe('2.50');
    expect(parsedCells[3]).toBe('-1.20');
    expect(parsedCells[4]).toBe('2');
  });

  it('persists and retrieves column order in IndexedDB', async () => {
    const memoryStore: Record<string, unknown> = {};
    vi.spyOn(db.settings, 'get').mockImplementation((async (key: unknown) => {
      const strKey = String(key);
      if (memoryStore[strKey]) return { key: strKey, value: memoryStore[strKey] };
      return undefined;
    }) as any);
    vi.spyOn(db.settings, 'put').mockImplementation((async (item: {
      key: string;
      value: unknown;
    }) => {
      memoryStore[item.key] = item.value;
      return item.key;
    }) as any);

    const initial = await getStoredMatrixColumnOrder();
    expect(initial).toEqual(DEFAULT_MATRIX_COLUMN_ORDER);

    const reordered: MatrixColumnBlockId[] = ['dailyPnl', 'orders', 'date', 'ordersCount'];
    await saveMatrixColumnOrder(reordered);

    const retrieved = await getStoredMatrixColumnOrder();
    expect(retrieved).toEqual(reordered);

    // Reset back to default
    await saveMatrixColumnOrder(DEFAULT_MATRIX_COLUMN_ORDER);
    const reset = await getStoredMatrixColumnOrder();
    expect(reset).toEqual(DEFAULT_MATRIX_COLUMN_ORDER);
  });

  it('exports ColumnDragPreview component for drag overlay rendering', () => {
    expect(ColumnDragPreview).toBeDefined();
    expect(['function', 'object']).toContain(typeof ColumnDragPreview);
  });

  it('provides plural orders translation strings in en and uk locales', async () => {
    const enLocale = await import('../../i18n/locales/en.json');
    const ukLocale = await import('../../i18n/locales/uk.json');

    expect(enLocale.default.dailyMatrix.orders).toBe('Trades');
    expect(ukLocale.default.dailyMatrix.orders).toBe('Угоди');
  });
});
