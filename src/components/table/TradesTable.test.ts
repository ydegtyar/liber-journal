import { describe, it, expect } from 'vitest';
import { Trade } from '../../types/trade';
import {
  sortTrades,
  getTradeDurationMs,
  filterTradesByInstrument,
} from './TradesTable';

describe('TradesTable sorting and structure logic', () => {
  const mockTrades: Trade[] = [
    {
      id: 'trade-1',
      dealId: 'DEAL-1',
      instrument: 'EUR/USD',
      direction: 'buy',
      openedAt: '2026-09-01T10:00:00Z',
      closedAt: '2026-09-01T10:30:00Z', // 30 mins
      openPrice: 1.085,
      closePrice: 1.087,
      margin: 100,
      leverage: 20,
      grossReturn: 2.5,
      pnl: 2.5,
    },
    {
      id: 'trade-2',
      dealId: 'DEAL-2',
      instrument: 'GBP/USD',
      direction: 'sell',
      openedAt: '2026-09-03T14:00:00Z',
      closedAt: '2026-09-03T14:45:00Z', // 45 mins
      openPrice: 1.285,
      closePrice: 1.288,
      margin: 100,
      leverage: 20,
      grossReturn: -1.2,
      pnl: -1.2,
    },
    {
      id: 'trade-3',
      dealId: 'DEAL-3',
      instrument: 'USD/JPY',
      direction: 'buy',
      openedAt: '2026-09-02T09:00:00Z',
      closedAt: '2026-09-02T09:15:00Z', // 15 mins
      openPrice: 145.2,
      closePrice: 145.5,
      margin: 200,
      leverage: 10,
      grossReturn: 4.1,
      pnl: 4.1,
    },
  ];

  it('sorts trades by date ascending (oldest first)', () => {
    const sorted = sortTrades(mockTrades, 'date', 'asc');
    expect(sorted.map((t) => t.id)).toEqual(['trade-1', 'trade-3', 'trade-2']);
  });

  it('sorts trades by date descending (newest first)', () => {
    const sorted = sortTrades(mockTrades, 'date', 'desc');
    expect(sorted.map((t) => t.id)).toEqual(['trade-2', 'trade-3', 'trade-1']);
  });

  it('sorts trades by duration ascending (shortest first)', () => {
    const sorted = sortTrades(mockTrades, 'duration', 'asc');
    expect(sorted.map((t) => t.id)).toEqual(['trade-3', 'trade-1', 'trade-2']);
  });

  it('sorts trades by duration descending (longest first)', () => {
    const sorted = sortTrades(mockTrades, 'duration', 'desc');
    expect(sorted.map((t) => t.id)).toEqual(['trade-2', 'trade-1', 'trade-3']);
  });

  it('sorts trades by grossReturn ascending (lowest first)', () => {
    const sorted = sortTrades(mockTrades, 'grossReturn', 'asc');
    expect(sorted.map((t) => t.id)).toEqual(['trade-2', 'trade-1', 'trade-3']);
  });

  it('sorts trades by grossReturn descending (highest first)', () => {
    const sorted = sortTrades(mockTrades, 'grossReturn', 'desc');
    expect(sorted.map((t) => t.id)).toEqual(['trade-3', 'trade-1', 'trade-2']);
  });

  it('sorts trades by pnl ascending (worst loss first)', () => {
    const sorted = sortTrades(mockTrades, 'pnl', 'asc');
    expect(sorted.map((t) => t.id)).toEqual(['trade-2', 'trade-1', 'trade-3']);
  });

  it('sorts trades by pnl descending (best profit first)', () => {
    const sorted = sortTrades(mockTrades, 'pnl', 'desc');
    expect(sorted.map((t) => t.id)).toEqual(['trade-3', 'trade-1', 'trade-2']);
  });

  it('calculates trade duration correctly in ms', () => {
    expect(getTradeDurationMs('2026-09-01T10:00:00Z', '2026-09-01T10:30:00Z')).toBe(30 * 60 * 1000);
    expect(getTradeDurationMs(undefined, '2026-09-01T10:30:00Z')).toBe(0);
    expect(getTradeDurationMs('2026-09-01T10:30:00Z', '2026-09-01T10:00:00Z')).toBe(0);
  });

  it('filters trades by instrument search query (case-insensitive substring)', () => {
    expect(filterTradesByInstrument(mockTrades, 'eur').map((t) => t.id)).toEqual(['trade-1']);
    expect(filterTradesByInstrument(mockTrades, 'USD').map((t) => t.id)).toEqual([
      'trade-1',
      'trade-2',
      'trade-3',
    ]);
    expect(filterTradesByInstrument(mockTrades, 'jpy').map((t) => t.id)).toEqual(['trade-3']);
    expect(filterTradesByInstrument(mockTrades, 'xyz')).toEqual([]);
    expect(filterTradesByInstrument(mockTrades, '')).toEqual(mockTrades);
    expect(filterTradesByInstrument(mockTrades, undefined)).toEqual(mockTrades);
  });

  it('handles fallback to openedAt if closedAt is missing for date sort', () => {
    const tradesWithMissingClosed: Trade[] = [
      {
        ...mockTrades[0],
        closedAt: '',
        openedAt: '2026-09-05T10:00:00Z',
      },
      {
        ...mockTrades[1],
        closedAt: '2026-09-01T10:00:00Z',
      },
    ];

    const sortedAsc = sortTrades(tradesWithMissingClosed, 'date', 'asc');
    expect(sortedAsc[0].id).toBe('trade-2');
    expect(sortedAsc[1].id).toBe('trade-1');
  });
});
