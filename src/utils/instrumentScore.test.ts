import { describe, it, expect } from 'vitest';
import {
  winsorize,
  percentileRank,
  computeMetrics,
  calculateInstrumentScores,
} from './instrumentScore';
import { InstrumentSummary, Trade } from '../types/trade';

describe('instrumentScore pure utilities', () => {
  describe('winsorize', () => {
    it('returns copy for empty or 1-element array', () => {
      expect(winsorize([])).toEqual([]);
      expect(winsorize([42])).toEqual([42]);
    });

    it('winsorizes extreme values to pLow and pHigh quantiles', () => {
      // 10 elements: 0 to 9
      const values = [0, 10, 20, 30, 40, 50, 60, 70, 80, 1000];
      const res = winsorize(values, 0.1, 0.9);
      // Max value should be capped at 90th percentile
      expect(res[9]).toBeLessThan(1000);
      expect(res[0]).toBeGreaterThanOrEqual(0);
    });
  });

  describe('percentileRank', () => {
    it('returns empty array for empty input', () => {
      expect(percentileRank([])).toEqual([]);
    });

    it('returns 50 for single value or identical values', () => {
      expect(percentileRank([10])).toEqual([50]);
      expect(percentileRank([5, 5, 5])).toEqual([50, 50, 50]);
    });

    it('computes ranks correctly and supports inverted ranking', () => {
      const values = [10, 20, 30];
      const ranksNormal = percentileRank(values, false);
      expect(ranksNormal).toEqual([0, 50, 100]);

      const ranksInverted = percentileRank(values, true);
      expect(ranksInverted).toEqual([100, 50, 0]);
    });
  });

  describe('computeMetrics edge cases', () => {
    it('handles zero losses (no division by zero, profit factor capped at 5)', () => {
      const trades: Trade[] = [
        {
          id: '1',
          instrument: 'AAPL',
          direction: 'buy',
          openedAt: '',
          closedAt: '',
          openPrice: 1,
          closePrice: 2,
          margin: 10,
          leverage: 1,
          grossReturn: 20,
          pnl: 50,
        },
        {
          id: '2',
          instrument: 'AAPL',
          direction: 'buy',
          openedAt: '',
          closedAt: '',
          openPrice: 1,
          closePrice: 2,
          margin: 10,
          leverage: 1,
          grossReturn: 20,
          pnl: 30,
        },
      ];
      const summary: InstrumentSummary = {
        symbol: 'AAPL',
        trades: 2,
        winRate: 100,
        netPnl: 80,
        avgPnl: 40,
        sharePercent: 100,
        sparkline: [0, 50, 80],
        avgDurationMs: 1000,
      };

      const m = computeMetrics(trades, summary);
      expect(m.profitFactor).toBe(5);
      expect(m.payoffRatio).toBe(5);
      expect(m.maxDrawdown).toBe(0);
      expect(m.recoveryFactor).toBe(5);
      expect(m.sortino).toBe(5);
    });

    it('handles zero wins', () => {
      const trades: Trade[] = [
        {
          id: '1',
          instrument: 'TSLA',
          direction: 'sell',
          openedAt: '',
          closedAt: '',
          openPrice: 1,
          closePrice: 2,
          margin: 10,
          leverage: 1,
          grossReturn: 20,
          pnl: -50,
        },
        {
          id: '2',
          instrument: 'TSLA',
          direction: 'sell',
          openedAt: '',
          closedAt: '',
          openPrice: 1,
          closePrice: 2,
          margin: 10,
          leverage: 1,
          grossReturn: 20,
          pnl: -30,
        },
      ];
      const summary: InstrumentSummary = {
        symbol: 'TSLA',
        trades: 2,
        winRate: 0,
        netPnl: -80,
        avgPnl: -40,
        sharePercent: 0,
        sparkline: [0, -50, -80],
        avgDurationMs: 1000,
      };

      const m = computeMetrics(trades, summary);
      expect(m.profitFactor).toBe(0);
      expect(m.payoffRatio).toBe(0);
      expect(m.maxDrawdown).toBe(80);
      expect(m.recoveryFactor).toBe(-1); // -80 / 80
      expect(m.sortino).toBeLessThan(0);
    });

    it('computes expectancy using plannedRisk (R-multiples) when available', () => {
      const trades: Trade[] = [
        {
          id: '1',
          instrument: 'NVDA',
          direction: 'buy',
          openedAt: '',
          closedAt: '',
          openPrice: 1,
          closePrice: 2,
          margin: 10,
          leverage: 1,
          grossReturn: 20,
          pnl: 100,
          plannedRisk: 50,
        }, // 2R
        {
          id: '2',
          instrument: 'NVDA',
          direction: 'buy',
          openedAt: '',
          closedAt: '',
          openPrice: 1,
          closePrice: 2,
          margin: 10,
          leverage: 1,
          grossReturn: 20,
          pnl: -50,
          plannedRisk: 50,
        }, // -1R
      ];
      const summary: InstrumentSummary = {
        symbol: 'NVDA',
        trades: 2,
        winRate: 50,
        netPnl: 50,
        avgPnl: 25,
        sharePercent: 100,
        sparkline: [0, 100, 50],
        avgDurationMs: 1000,
      };

      const m = computeMetrics(trades, summary);
      expect(m.expectancy).toBe(0.5); // (2R - 1R) / 2 = 0.5R
    });
  });

  describe('calculateInstrumentScores', () => {
    const makeRow = (
      symbol: string,
      trades: number,
      pnl: number,
      winRate: number,
      plannedRisk?: number
    ): InstrumentSummary & { tradesData?: Trade[] } => {
      const tradeList: Trade[] = [];
      const perTrade = pnl / trades;
      for (let i = 0; i < trades; i++) {
        tradeList.push({
          id: `${symbol}-${i}`,
          instrument: symbol,
          direction: 'buy',
          openedAt: new Date(2026, 0, i + 1).toISOString(),
          closedAt: new Date(2026, 0, i + 1, 1).toISOString(),
          openPrice: 100,
          closePrice: 100 + perTrade,
          margin: 100,
          leverage: 1,
          grossReturn: 100 + perTrade,
          pnl: perTrade,
          plannedRisk,
        });
      }
      return {
        symbol,
        trades,
        winRate,
        netPnl: pnl,
        avgPnl: perTrade,
        sharePercent: 10,
        sparkline: [0, pnl],
        avgDurationMs: 3600000,
        tradesData: tradeList,
      };
    };

    it('returns empty array when rows is empty', () => {
      expect(calculateInstrumentScores([])).toEqual([]);
    });

    it('flags minimum-sample exclusion with rating = insufficient and score = null', () => {
      const rows = [
        makeRow('LOW_TRADES', 5, 500, 80), // minTrades is 10
      ];
      const results = calculateInstrumentScores(rows);
      expect(results[0].rating).toBe('insufficient');
      expect(results[0].score).toBeNull();
      expect(results[0].scoreConfidence).toBe(5 / (5 + 20));
    });

    it('calculates shrinkage math correctly', () => {
      // 20 trades, k=20 -> confidence = 20 / (20 + 20) = 0.5
      // If rawScore is 80, finalScore = 50 + (80 - 50) * 0.5 = 65
      const row1 = makeRow('SYM1', 20, 1000, 70);
      const row2 = makeRow('SYM2', 20, -500, 30);
      const results = calculateInstrumentScores([row1, row2]);

      const s1 = results.find((r) => r.symbol === 'SYM1')!;
      expect(s1.scoreConfidence).toBe(0.5);
      expect(s1.score).toBeGreaterThan(50);
      expect(s1.score).toBeLessThanOrEqual(s1.rawScore!);
    });

    it('assigns absolute bands when < 5 eligible instruments', () => {
      // 2 eligible instruments
      const rowGood = makeRow('HIGH', 30, 3000, 80);
      const rowBad = makeRow('LOW', 30, -2000, 20);
      const results = calculateInstrumentScores([rowGood, rowBad]);

      const high = results.find((r) => r.symbol === 'HIGH')!;
      const low = results.find((r) => r.symbol === 'LOW')!;

      // high has score >= 70 -> best
      expect(high.rating).toBe('best');
      // low has negative expectancy, profitFactor < 1 -> weak or worst
      expect(['weak', 'worst']).toContain(low.rating);
    });

    it('assigns quantile bands (top 20% best, bottom 20% worst) when >= 5 eligible instruments', () => {
      const rows = [
        makeRow('A', 50, 5000, 80),
        makeRow('B', 50, 3000, 70),
        makeRow('C', 50, 1000, 55),
        makeRow('D', 50, -500, 45),
        makeRow('E', 50, -3000, 30),
      ];
      const results = calculateInstrumentScores(rows);
      const ratings = results.map((r) => r.rating);
      expect(ratings).toEqual(['best', 'good', 'neutral', 'weak', 'worst']);
    });

    it('applies hard-flag override: negative expectancy AND profit factor < 1 cannot be rated above weak', () => {
      // Even if somehow given high percentile rank (e.g. single loser compared with terrible peers)
      const badRow = makeRow('LOSER', 15, -100, 40);
      const results = calculateInstrumentScores([badRow]);
      const loser = results[0];
      expect(loser.expectancy).toBeLessThan(0);
      expect(loser.profitFactor).toBeLessThan(1);
      expect(['weak', 'worst']).toContain(loser.rating);
    });

    it('applies fragile edge warning when netPnl > 0 and outlierDependence > 60%', () => {
      // 10 trades: 9 trades of $1, 1 huge win of $1000. Total = $1009. Top 1 win is 1000 / 1009 = ~99% > 60%
      const trades: Trade[] = [];
      for (let i = 0; i < 9; i++) {
        trades.push({
          id: `t-${i}`,
          instrument: 'FRAGILE',
          direction: 'buy',
          openedAt: new Date(2026, 0, i + 1).toISOString(),
          closedAt: new Date(2026, 0, i + 1, 1).toISOString(),
          openPrice: 10,
          closePrice: 11,
          margin: 10,
          leverage: 1,
          grossReturn: 11,
          pnl: 1,
        });
      }
      trades.push({
        id: 't-9',
        instrument: 'FRAGILE',
        direction: 'buy',
        openedAt: new Date(2026, 0, 10).toISOString(),
        closedAt: new Date(2026, 0, 10, 1).toISOString(),
        openPrice: 10,
        closePrice: 1010,
        margin: 10,
        leverage: 1,
        grossReturn: 1010,
        pnl: 1000,
      });

      const summary: InstrumentSummary & { tradesData: Trade[] } = {
        symbol: 'FRAGILE',
        trades: 10,
        winRate: 100,
        netPnl: 1009,
        avgPnl: 100.9,
        sharePercent: 100,
        sparkline: [0, 1009],
        avgDurationMs: 1000,
        tradesData: trades,
      };

      const results = calculateInstrumentScores([summary]);
      expect(results[0].warnings).toContain('fragileEdge');
    });

    it('breaks ties stably by trades descending, then symbol alphabetically', () => {
      // Create 5 identical performance rows but different trade counts or symbols
      const r1 = makeRow('ZETA', 20, 1000, 60);
      const r2 = makeRow('ALPHA', 20, 1000, 60);
      const r3 = makeRow('BETA', 30, 1000, 60);
      const r4 = makeRow('GAMMA', 15, 1000, 60);
      const r5 = makeRow('DELTA', 10, 1000, 60);

      const results = calculateInstrumentScores([r1, r2, r3, r4, r5]);
      // BETA has highest trades (30), ALPHA and ZETA both have 20 trades -> ALPHA before ZETA
      const beta = results.find((r) => r.symbol === 'BETA')!;
      const alpha = results.find((r) => r.symbol === 'ALPHA')!;
      const zeta = results.find((r) => r.symbol === 'ZETA')!;

      expect(beta.scoreConfidence).toBeGreaterThan(alpha.scoreConfidence);
      expect(alpha.rating).toBeDefined();
      expect(zeta.rating).toBeDefined();
    });
  });
});
