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
  calculateStreakAnalysis,
  calculateInstrumentPerformance,
  calculateInstrumentBreakdown,
  calculateMonthlyReturns,
  generatePeriodInsights,
  calculateDuration,
  calculateAvgTradePnl,
  calculateAvgTradeDuration,
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

  it('calculates complete Streak Analysis suite', () => {
    // mockTrades order: Trade 1 (+20 win), Trade 2 (-10 loss), Trade 3 (0 be), Trade 4 (+30 win)
    // Win streaks: [1, 1], Loss streaks: [1]
    const streaks = calculateStreakAnalysis(mockTrades);
    expect(streaks.maxWinStreak).toBe(1);
    expect(streaks.maxLossStreak).toBe(1);
    expect(streaks.avgWinStreak).toBe(1);
    expect(streaks.avgLossStreak).toBe(1);
    expect(streaks.streakRatio).toBe(1);
    expect(streaks.currentStreak.type).toBe('win');
    expect(streaks.currentStreak.count).toBe(1);

    // Test multi-streak case
    const consecutiveTrades: Trade[] = [
      { ...mockTrades[0], id: 'c1', closedAt: '2026-09-01T10:00:00Z', pnl: 10 },
      { ...mockTrades[0], id: 'c2', closedAt: '2026-09-01T11:00:00Z', pnl: 15 },
      { ...mockTrades[0], id: 'c3', closedAt: '2026-09-01T12:00:00Z', pnl: 20 },
      { ...mockTrades[1], id: 'c4', closedAt: '2026-09-01T13:00:00Z', pnl: -5 },
      { ...mockTrades[0], id: 'c5', closedAt: '2026-09-01T14:00:00Z', pnl: 12 },
      { ...mockTrades[0], id: 'c6', closedAt: '2026-09-01T15:00:00Z', pnl: 8 },
    ];
    // Win streak 1: 3 trades (c1, c2, c3). Loss streak 1: 1 trade (c4). Win streak 2: 2 trades (c5, c6).
    // Max win streak: 3, Max loss streak: 1. Avg win streak: (3+2)/2 = 2.5. Avg loss: 1. Ratio: 2.5 / 1 = 2.5.
    const multiStreaks = calculateStreakAnalysis(consecutiveTrades);
    expect(multiStreaks.maxWinStreak).toBe(3);
    expect(multiStreaks.maxLossStreak).toBe(1);
    expect(multiStreaks.avgWinStreak).toBe(2.5);
    expect(multiStreaks.avgLossStreak).toBe(1);
    expect(multiStreaks.streakRatio).toBe(2.5);
  });

  it('calculates Instrument Breakdown with sparklines and gross win share', () => {
    const breakdown = calculateInstrumentBreakdown(mockTrades);
    expect(breakdown.length).toBe(2);
    // Best is GBP/USD (+30 pnl, 2 trades, 100% win rate excluding BE)
    const gbp = breakdown.find((b) => b.symbol === 'GBP/USD')!;
    expect(gbp).toBeDefined();
    expect(gbp.trades).toBe(2);
    expect(gbp.netPnl).toBe(30);
    expect(gbp.winRate).toBe(100);
    // Total gross wins: 20 (EUR) + 30 (GBP) = 50. GBP share: 30 / 50 = 60%
    expect(gbp.sharePercent).toBe(60);
    expect(gbp.sparkline).toEqual([0, 0, 30]);

    const eur = breakdown.find((b) => b.symbol === 'EUR/USD')!;
    expect(eur).toBeDefined();
    expect(eur.trades).toBe(2);
    expect(eur.netPnl).toBe(10);
    expect(eur.sharePercent).toBe(40);
  });

  it('calculates Monthly Returns table data', () => {
    const monthly = calculateMonthlyReturns(mockTrades);
    expect(monthly.length).toBe(1);
    expect(monthly[0].year).toBe(2026);
    // September (month 9) has all 4 trades
    expect(monthly[0].months[9].trades).toBe(4);
    expect(monthly[0].months[9].pnl).toBe(40);
    expect(monthly[0].months[9].winRate).toBe(66.67);
    // Other months have 0 trades
    expect(monthly[0].months[1].trades).toBe(0);
    expect(monthly[0].totalPnl).toBe(40);
  });

  it('generates period insights dynamically', () => {
    const breakdown = calculateInstrumentBreakdown(mockTrades);
    const streakAnalysis = calculateStreakAnalysis(mockTrades);
    const insights = generatePeriodInsights(mockTrades, breakdown, streakAnalysis, {
      profitFactor: 5,
      winRate: 66.67,
      maxDrawdownPercent: 0.98,
    });
    expect(insights.length).toBeGreaterThan(0);
    expect(insights.some((i) => i.id === 'top-asset-share')).toBe(true);
    expect(insights.some((i) => i.id === 'profit-factor')).toBe(true);
  });

  it('calculates trade duration correctly', () => {
    expect(calculateDuration(null, null).formatted).toBe('—');
    expect(calculateDuration('2026-09-01T10:00:00Z', '2026-09-01T10:45:00Z').formatted).toBe('45m');
    expect(calculateDuration('2026-09-01T10:00:00Z', '2026-09-01T12:30:00Z').formatted).toBe(
      '2h 30m'
    );
    expect(calculateDuration('2026-09-01T10:00:00Z', '2026-09-03T14:15:00Z').formatted).toBe(
      '2d 4h'
    );
  });

  it('calculates average trade PnL correctly', () => {
    expect(calculateAvgTradePnl([])).toBe(0);
    expect(calculateAvgTradePnl(mockTrades)).toBe(10); // (20 - 10 + 0 + 30) / 4 = 10
  });

  it('calculates average trade duration correctly', () => {
    expect(calculateAvgTradeDuration([])).toBe(0);
    // 2h + 1h + 1h + 1h = 5h = 18,000,000 ms / 4 = 4,500,000 ms (1h 15m)
    expect(calculateAvgTradeDuration(mockTrades)).toBe(4500000);

    const invalidTrades: Trade[] = [
      {
        id: 'inv1',
        instrument: 'EUR/USD',
        direction: 'buy',
        openedAt: 'invalid',
        closedAt: '2026-09-01T12:00:00.000Z',
        openPrice: 1,
        closePrice: 1,
        margin: 10,
        leverage: 1,
        grossReturn: 10,
        pnl: 0,
      },
    ];
    expect(calculateAvgTradeDuration(invalidTrades)).toBe(0);
  });

  it('calculates complete JournalAnalytics including new fields', () => {
    const analytics = calculateAnalytics(1000, mockTrades);
    expect(analytics.totalTrades).toBe(4);
    expect(analytics.avgTradePnl).toBe(10);
    expect(analytics.avgTradeDurationMs).toBe(4500000);
    expect(analytics.streakAnalysis).toBeDefined();
    expect(analytics.streakAnalysis.maxWinStreak).toBe(1);
    expect(analytics.insights.length).toBeGreaterThan(0);
    expect(analytics.instrumentBreakdown.length).toBe(2);
    expect(analytics.monthlyReturns.length).toBe(1);
  });
});
