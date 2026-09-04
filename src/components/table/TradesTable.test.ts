import { describe, it, expect } from 'vitest';
import { Trade } from '../../types/trade';

describe('TradesTable sorting and structure logic', () => {
  const mockTrades: Trade[] = [
    {
      id: 'trade-1',
      dealId: 'DEAL-1',
      instrument: 'EUR/USD',
      direction: 'buy',
      openedAt: '2026-09-01T10:00:00Z',
      closedAt: '2026-09-01T10:30:00Z',
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
      closedAt: '2026-09-03T14:45:00Z',
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
      closedAt: '2026-09-02T09:15:00Z',
      openPrice: 145.2,
      closePrice: 145.5,
      margin: 200,
      leverage: 10,
      grossReturn: 4.1,
      pnl: 4.1,
    },
  ];

  it('sorts trades by date ascending (oldest first)', () => {
    const sorted = [...mockTrades].sort((a, b) => {
      const timeA = new Date(a.closedAt || a.openedAt).getTime() || 0;
      const timeB = new Date(b.closedAt || b.openedAt).getTime() || 0;
      return timeA - timeB;
    });

    expect(sorted.map((t) => t.id)).toEqual(['trade-1', 'trade-3', 'trade-2']);
  });

  it('sorts trades by date descending (newest first)', () => {
    const sorted = [...mockTrades].sort((a, b) => {
      const timeA = new Date(a.closedAt || a.openedAt).getTime() || 0;
      const timeB = new Date(b.closedAt || b.openedAt).getTime() || 0;
      return timeB - timeA;
    });

    expect(sorted.map((t) => t.id)).toEqual(['trade-2', 'trade-3', 'trade-1']);
  });

  it('handles fallback to openedAt if closedAt is missing', () => {
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

    const sortedAsc = [...tradesWithMissingClosed].sort((a, b) => {
      const timeA = new Date(a.closedAt || a.openedAt).getTime() || 0;
      const timeB = new Date(b.closedAt || b.openedAt).getTime() || 0;
      return timeA - timeB;
    });

    expect(sortedAsc[0].id).toBe('trade-2');
    expect(sortedAsc[1].id).toBe('trade-1');
  });
});
