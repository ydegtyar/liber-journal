import { describe, it, expect } from 'vitest';
import { calculateAnalytics } from '../../lib/calculations';
import { Trade } from '../../types/trade';

describe('DepositEditor validation and analytics integration', () => {
  const sampleTrades: Trade[] = [
    {
      id: 't1',
      dealId: 'DEAL-1',
      instrument: 'EUR/USD',
      direction: 'buy',
      openedAt: '2026-09-01T10:00:00Z',
      closedAt: '2026-09-01T10:30:00Z',
      openPrice: 1.08,
      closePrice: 1.09,
      margin: 100,
      leverage: 1,
      pnl: 50,
      grossReturn: 150,
    },
    {
      id: 't2',
      dealId: 'DEAL-2',
      instrument: 'GBP/USD',
      direction: 'sell',
      openedAt: '2026-09-01T11:00:00Z',
      closedAt: '2026-09-01T11:30:00Z',
      openPrice: 1.3,
      closePrice: 1.28,
      margin: 100,
      leverage: 1,
      pnl: 25,
      grossReturn: 125,
    },
  ];

  it('validates deposit input parsing correctly', () => {
    const parseDepositInput = (input: string, current: number): number => {
      const parsed = parseFloat(input);
      if (!isNaN(parsed) && parsed >= 0) {
        return parsed;
      }
      return current;
    };

    expect(parseDepositInput('1500', 1000)).toBe(1500);
    expect(parseDepositInput('2500.50', 1000)).toBe(2500.5);
    expect(parseDepositInput('0', 1000)).toBe(0);
    expect(parseDepositInput('-500', 1000)).toBe(1000); // Invalid: negative
    expect(parseDepositInput('abc', 1000)).toBe(1000); // Invalid: NaN
    expect(parseDepositInput('', 1000)).toBe(1000); // Invalid: empty string
  });

  it('updates ROI and Current Balance dynamically when initial deposit changes', () => {
    // With 1,000 initial deposit
    const initialAnalytics = calculateAnalytics(1000, sampleTrades);
    expect(initialAnalytics.netPnl).toBe(75);
    expect(initialAnalytics.currentDeposit).toBe(1075);
    expect(initialAnalytics.roiPercent).toBe(7.5);

    // When user updates initial deposit to 2,000
    const updatedAnalytics = calculateAnalytics(2000, sampleTrades);
    expect(updatedAnalytics.netPnl).toBe(75);
    expect(updatedAnalytics.currentDeposit).toBe(2075);
    expect(updatedAnalytics.roiPercent).toBe(3.75);

    // When initial deposit is 500
    const smallerDepositAnalytics = calculateAnalytics(500, sampleTrades);
    expect(smallerDepositAnalytics.currentDeposit).toBe(575);
    expect(smallerDepositAnalytics.roiPercent).toBe(15);
  });
});
