import { describe, it, expect } from 'vitest';
import {
  round,
  calculateNetPnl,
  calculateCurrentDeposit,
  calculateRoi,
  calculateWinLossBreakeven,
  calculateWinRate,
  calculateBreakevenRate,
  calculateProfitFactor,
  calculateAvgWin,
  calculateAvgLoss,
  calculateExpectancy,
  calculateDrawdowns,
  calculateCurrentStreak,
  calculateInstrumentPerformance,
  calculateDayOfWeekPerformance,
  calculateHourlyDistribution,
  calculateGroupSummaries,
  calculateAnalytics,
} from './calculations';
import { Trade } from '../types/trade';

const mockTrades: Trade[] = [
  {
    id: '1',
    dealId: 'EURUSD-1',
    instrument: 'EUR/USD',
    direction: 'buy',
    openedAt: '2026-09-01T10:00:00.000Z',
    closedAt: '2026-09-01T12:00:00.000Z',
    openPrice: 1.1,
    closePrice: 1.11,
    margin: 100,
    leverage: 50,
    grossReturn: 120,
    pnl: 20,
  },
  {
    id: '2',
    dealId: 'EURUSD-2',
    instrument: 'EUR/USD',
    direction: 'sell',
    openedAt: '2026-09-01T13:00:00.000Z',
    closedAt: '2026-09-01T14:00:00.000Z',
    openPrice: 1.11,
    closePrice: 1.115,
    margin: 100,
    leverage: 50,
    grossReturn: 90,
    pnl: -10,
  },
  {
    id: '3',
    dealId: 'GBPUSD-1',
    instrument: 'GBP/USD',
    direction: 'buy',
    openedAt: '2026-09-02T10:00:00.000Z',
    closedAt: '2026-09-02T11:00:00.000Z',
    openPrice: 1.3,
    closePrice: 1.3,
    margin: 100,
    leverage: 50,
    grossReturn: 100,
    pnl: 0, // Breakeven trade
  },
  {
    id: '4',
    dealId: 'GBPUSD-2',
    instrument: 'GBP/USD',
    direction: 'buy',
    openedAt: '2026-09-02T12:00:00.000Z',
    closedAt: '2026-09-02T13:00:00.000Z',
    openPrice: 1.3,
    closePrice: 1.32,
    margin: 100,
    leverage: 50,
    grossReturn: 130,
    pnl: 30,
  },
];

describe('Calculations Library', () => {
  it('correctly rounds decimals', () => {
    expect(round(10.125)).toBe(10.13);
    expect(round(10.124)).toBe(10.12);
  });

  it('calculates Net PnL correctly', () => {
    expect(calculateNetPnl(mockTrades)).toBe(40);
  });

  it('calculates current deposit', () => {
    expect(calculateCurrentDeposit(1000, mockTrades)).toBe(1040);
  });

  it('calculates ROI percentage', () => {
    expect(calculateRoi(1000, 40)).toBe(4);
    expect(calculateRoi(0, 40)).toBe(0);
  });

  it('counts wins, losses, and breakeven trades', () => {
    const counts = calculateWinLossBreakeven(mockTrades);
    expect(counts.wins).toBe(2); // +20, +30
    expect(counts.losses).toBe(1); // -10
    expect(counts.breakeven).toBe(1); // 0
    expect(counts.total).toBe(4);
  });

  it('calculates Win Rate excluding Breakeven from denominator', () => {
    // 2 wins, 1 loss, 1 BE -> 2 / (2 + 1) * 100 = 66.67%
    expect(calculateWinRate(mockTrades)).toBe(66.67);
  });

  it('calculates Breakeven Rate', () => {
    // 1 BE out of 4 total -> 25%
    expect(calculateBreakevenRate(mockTrades)).toBe(25);
  });

  it('calculates Profit Factor', () => {
    // Gross wins: 20 + 30 = 50. Gross loss: 10. PF = 50 / 10 = 5
    expect(calculateProfitFactor(mockTrades)).toBe(5);

    // If zero loss, returns Infinity
    const winOnly: Trade[] = [mockTrades[0]];
    expect(calculateProfitFactor(winOnly)).toBe(Infinity);
  });

  it('calculates Avg Win and Avg Loss', () => {
    expect(calculateAvgWin(mockTrades)).toBe(25); // (20 + 30) / 2
    expect(calculateAvgLoss(mockTrades)).toBe(10); // 10 / 1
  });

  it('calculates Expectancy', () => {
    // Decisive = 3 (2 wins, 1 loss)
    // WinRateDec = 2/3, LossRateDec = 1/3
    // AvgWin = 25, AvgLoss = 10
    // Expectancy = (2/3 * 25) - (1/3 * 10) = 16.666 - 3.333 = 13.33
    expect(calculateExpectancy(mockTrades)).toBe(13.33);
  });

  it('calculates Peak-to-Trough Drawdowns', () => {
    // Initial: 1000
    // Trade 1 (+20): 1020, Peak: 1020, DD: 0
    // Trade 2 (-10): 1010, Peak: 1020, DD: 10 (0.98%)
    // Trade 3 (0): 1010, Peak: 1020, DD: 10 (0.98%)
    // Trade 4 (+30): 1040, Peak: 1040, DD: 0
    const { maxDrawdownAmount, maxDrawdownPercent, equityCurve } = calculateDrawdowns(
      1000,
      mockTrades
    );
    expect(maxDrawdownAmount).toBe(10);
    expect(maxDrawdownPercent).toBe(0.98);
    expect(equityCurve.length).toBe(5); // initial + 4 trades
    expect(equityCurve[equityCurve.length - 1].equity).toBe(1040);
  });

  it('calculates Current Streak', () => {
    // Most recent trade is Trade 4 (closedAt 2026-09-02T13:00) with pnl 30 (win)
    // Before that is Trade 3 (closedAt 2026-09-02T11:00) with pnl 0 (breakeven)
    // Streak is 1 win
    const streak = calculateCurrentStreak(mockTrades);
    expect(streak.type).toBe('win');
    expect(streak.count).toBe(1);
  });

  it('calculates Instrument Performance', () => {
    // EUR/USD: 20 - 10 = 10
    // GBP/USD: 0 + 30 = 30
    const { best, worst, byInstrument } = calculateInstrumentPerformance(mockTrades);
    expect(best?.symbol).toBe('GBP/USD');
    expect(best?.pnl).toBe(30);
    expect(worst?.symbol).toBe('EUR/USD');
    expect(worst?.pnl).toBe(10);
    expect(byInstrument.length).toBe(2);
  });

  it('calculates Day of Week and Hourly Performance', () => {
    const dow = calculateDayOfWeekPerformance(mockTrades);
    expect(dow.length).toBe(7);
    const hourly = calculateHourlyDistribution(mockTrades);
    expect(hourly.length).toBe(24);
  });

  it('calculates Group Summaries for day grouping', () => {
    const summaries = calculateGroupSummaries(mockTrades, 'day');
    expect(Object.keys(summaries).length).toBe(2);
    expect(summaries['2026-09-01'].tradeCount).toBe(2);
    expect(summaries['2026-09-01'].netPnl).toBe(10);
    expect(summaries['2026-09-02'].tradeCount).toBe(2);
    expect(summaries['2026-09-02'].netPnl).toBe(30);
  });

  it('calculates complete JournalAnalytics', () => {
    const analytics = calculateAnalytics(1000, mockTrades);
    expect(analytics.totalTrades).toBe(4);
    expect(analytics.winningTrades).toBe(2);
    expect(analytics.losingTrades).toBe(1);
    expect(analytics.breakevenTrades).toBe(1);
    expect(analytics.breakevenRate).toBe(25);
    expect(analytics.netPnl).toBe(40);
    expect(analytics.currentDeposit).toBe(1040);
    expect(analytics.roiPercent).toBe(4);
  });
});
