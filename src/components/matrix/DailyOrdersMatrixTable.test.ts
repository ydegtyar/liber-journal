import { describe, it, expect } from 'vitest';
import { Trade } from '../../types/trade';
import { getTradeDateKey, formatDisplayDate } from '../../lib/xlsxTemplate';

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

  it('formats single day row for clipboard pasting with standard dot decimal', () => {
    const dayTrades = sampleTrades.filter((t) => getTradeDateKey(t.closedAt) === '2026-09-02');
    const displayDate = formatDisplayDate('2026-09-02');
    const orderCount = dayTrades.length;
    const dailyPnl = dayTrades.reduce((acc, t) => acc + t.pnl, 0);

    const colsCount = 4;
    const cells: string[] = [
      displayDate,
      String(orderCount),
      ...dayTrades.map((t) => t.pnl.toFixed(2)),
    ];
    while (cells.length < 2 + colsCount) {
      cells.push('');
    }
    cells.push(dailyPnl.toFixed(2));

    const tsvString = cells.join('\t');
    const parsedCells = tsvString.split('\t');

    // Expected: 02.09.2026 \t 2 \t 2.50 \t -1.20 \t [empty] \t [empty] \t 1.30
    expect(parsedCells[0]).toBe('02.09.2026');
    expect(parsedCells[1]).toBe('2');
    expect(parsedCells[2]).toBe('2.50');
    expect(parsedCells[3]).toBe('-1.20');
    expect(parsedCells[4]).toBe('');
    expect(parsedCells[5]).toBe('');
    expect(parsedCells[6]).toBe('1.30');
  });

  it('formats single day row for clipboard pasting with European comma decimal', () => {
    const dayTrades = sampleTrades.filter((t) => getTradeDateKey(t.closedAt) === '2026-09-02');
    const displayDate = formatDisplayDate('2026-09-02');
    const orderCount = dayTrades.length;
    const dailyPnl = dayTrades.reduce((acc, t) => acc + t.pnl, 0);

    const formatComma = (val: number) => val.toFixed(2).replace('.', ',');

    const cells: string[] = [
      displayDate,
      String(orderCount),
      ...dayTrades.map((t) => formatComma(t.pnl)),
    ];
    cells.push(formatComma(dailyPnl));

    const tsvString = cells.join('\t');
    expect(tsvString).toBe('02.09.2026\t2\t2,50\t-1,20\t1,30');
  });
});
