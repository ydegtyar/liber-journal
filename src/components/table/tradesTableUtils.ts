import { Trade, SortOrder } from '../../types/trade';

export type SortColumn = 'date' | 'duration' | 'grossReturn' | 'pnl';

export function getTradeDurationMs(openedAt?: string, closedAt?: string): number {
  if (!openedAt || !closedAt) return 0;
  const start = new Date(openedAt).getTime();
  const end = new Date(closedAt).getTime();
  if (isNaN(start) || isNaN(end) || end < start) return 0;
  return end - start;
}

export function sortTrades(trades: Trade[], sortBy: SortColumn, sortOrder: SortOrder): Trade[] {
  return [...trades].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'date') {
      const timeA = new Date(a.closedAt || a.openedAt).getTime() || 0;
      const timeB = new Date(b.closedAt || b.openedAt).getTime() || 0;
      comparison = timeA - timeB;
    } else if (sortBy === 'duration') {
      const durA = getTradeDurationMs(a.openedAt, a.closedAt);
      const durB = getTradeDurationMs(b.openedAt, b.closedAt);
      comparison = durA - durB;
    } else if (sortBy === 'grossReturn') {
      comparison = (a.grossReturn ?? 0) - (b.grossReturn ?? 0);
    } else if (sortBy === 'pnl') {
      comparison = (a.pnl ?? 0) - (b.pnl ?? 0);
    }

    if (comparison === 0) {
      const timeA = new Date(a.closedAt || a.openedAt).getTime() || 0;
      const timeB = new Date(b.closedAt || b.openedAt).getTime() || 0;
      comparison = timeA - timeB;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });
}

export function filterTradesByInstrument(trades: Trade[], query?: string): Trade[] {
  if (!query || !query.trim()) return trades;
  const q = query.trim().toLowerCase();
  return trades.filter((trade) => trade.instrument.toLowerCase().includes(q));
}
