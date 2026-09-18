import { describe, it, expect } from 'vitest';
import {
  generateForecast,
  calculateQuantile,
  normalCdf,
  extractHistoricalSeries,
  calculateMonteCarloForecast,
  calculateLinearRegressionForecast,
  calculateRunRateForecast,
  calculateCompoundingForecast,
  estimateMonthlyTradesRate,
  getApproxTradesForTimeHorizon,
} from './forecastEngine';
import { Trade } from '../types/trade';

const mockTrades: Trade[] = [
  {
    id: '1',
    instrument: 'EUR/USD',
    direction: 'buy',
    openedAt: '2026-09-01T10:00:00Z',
    closedAt: '2026-09-01T11:00:00Z',
    openPrice: 1.1,
    closePrice: 1.11,
    margin: 100,
    leverage: 50,
    grossReturn: 120,
    pnl: 20,
  },
  {
    id: '2',
    instrument: 'GBP/USD',
    direction: 'sell',
    openedAt: '2026-09-02T10:00:00Z',
    closedAt: '2026-09-02T11:00:00Z',
    openPrice: 1.3,
    closePrice: 1.31,
    margin: 100,
    leverage: 50,
    grossReturn: 90,
    pnl: -10,
  },
  {
    id: '3',
    instrument: 'EUR/USD',
    direction: 'buy',
    openedAt: '2026-09-03T10:00:00Z',
    closedAt: '2026-09-03T11:00:00Z',
    openPrice: 1.1,
    closePrice: 1.12,
    margin: 100,
    leverage: 50,
    grossReturn: 135,
    pnl: 35,
  },
  {
    id: '4',
    instrument: 'USD/JPY',
    direction: 'buy',
    openedAt: '2026-09-04T10:00:00Z',
    closedAt: '2026-09-04T11:00:00Z',
    openPrice: 140,
    closePrice: 140.5,
    margin: 100,
    leverage: 50,
    grossReturn: 115,
    pnl: 15,
  },
  {
    id: '5',
    instrument: 'EUR/USD',
    direction: 'sell',
    openedAt: '2026-09-05T10:00:00Z',
    closedAt: '2026-09-05T11:00:00Z',
    openPrice: 1.12,
    closePrice: 1.125,
    margin: 100,
    leverage: 50,
    grossReturn: 95,
    pnl: -5,
  },
];

describe('forecastEngine', () => {
  it('calculates quantiles accurately', () => {
    const arr = [10, 20, 30, 40, 50];
    expect(calculateQuantile(arr, 0)).toBe(10);
    expect(calculateQuantile(arr, 0.5)).toBe(30);
    expect(calculateQuantile(arr, 1)).toBe(50);
    expect(calculateQuantile(arr, 0.1)).toBeCloseTo(14, 1);
    expect(calculateQuantile(arr, 0.9)).toBeCloseTo(46, 1);
  });

  it('computes normal CDF accurately', () => {
    expect(normalCdf(0)).toBeCloseTo(0.5, 4);
    expect(normalCdf(1.96)).toBeCloseTo(0.975, 2);
    expect(normalCdf(-1.96)).toBeCloseTo(0.025, 2);
  });

  it('extracts historical series with running equity', () => {
    const { pnls, equities } = extractHistoricalSeries(1000, mockTrades);
    expect(pnls).toEqual([20, -10, 35, 15, -5]);
    expect(equities).toEqual([1000, 1020, 1010, 1045, 1060, 1055]);
  });

  it('Monte Carlo simulation yields conservative <= average <= optimistic bounds', () => {
    const pnls = [20, -10, 35, 15, -5];
    const res = calculateMonteCarloForecast(1000, pnls, 30, 500);

    const horizon = 30;
    const cons = res.conservativeCurve[horizon];
    const avg = res.averageCurve[horizon];
    const opt = res.optimisticCurve[horizon];

    expect(cons).toBeLessThanOrEqual(avg);
    expect(avg).toBeLessThanOrEqual(opt);
    expect(res.probabilityOfProfit).toBeGreaterThan(50);
    expect(res.estimatedMaxDrawdownPercent).toBeGreaterThanOrEqual(0);
  });

  it('Linear regression forecast yields conservative <= average <= optimistic bounds', () => {
    const pnls = [20, -10, 35, 15, -5];
    const res = calculateLinearRegressionForecast(1055, pnls, 30);

    const horizon = 30;
    const cons = res.conservativeCurve[horizon];
    const avg = res.averageCurve[horizon];
    const opt = res.optimisticCurve[horizon];

    expect(cons).toBeLessThanOrEqual(avg);
    expect(avg).toBeLessThanOrEqual(opt);
    expect(res.probabilityOfProfit).toBeGreaterThan(50);
  });

  it('Run-rate forecast projects moving average with volatility bounds', () => {
    const pnls = [20, -10, 35, 15, -5];
    const res = calculateRunRateForecast(1055, pnls, 30);

    const horizon = 30;
    const cons = res.conservativeCurve[horizon];
    const avg = res.averageCurve[horizon];
    const opt = res.optimisticCurve[horizon];

    expect(cons).toBeLessThanOrEqual(avg);
    expect(avg).toBeLessThanOrEqual(opt);
    expect(avg).toBeGreaterThan(1055); // Positive expected trade PnL
  });

  it('Compounding forecast compounds returns with variance bounds', () => {
    const pnls = [20, -10, 35, 15, -5];
    const res = calculateCompoundingForecast(1055, pnls, 30);

    const horizon = 30;
    const cons = res.conservativeCurve[horizon];
    const avg = res.averageCurve[horizon];
    const opt = res.optimisticCurve[horizon];

    expect(cons).toBeLessThanOrEqual(avg);
    expect(avg).toBeLessThanOrEqual(opt);
    expect(avg).toBeGreaterThan(1055);
  });

  it('generateForecast outputs uniform ForecastResult structure across all models', () => {
    const models = ['monteCarlo', 'linearRegression', 'runRate', 'compounding'] as const;

    for (const model of models) {
      const forecast = generateForecast(1000, mockTrades, model, 60);

      expect(forecast.model).toBe(model);
      expect(forecast.horizon).toBe(60);
      expect(forecast.currentDeposit).toBe(1055);
      expect(forecast.conservative.projectedDeposit).toBeLessThanOrEqual(
        forecast.average.projectedDeposit
      );
      expect(forecast.average.projectedDeposit).toBeLessThanOrEqual(
        forecast.optimistic.projectedDeposit
      );
      expect(forecast.chartPoints.length).toBeGreaterThan(15);
      expect(forecast.techniqueDescriptionKey).toContain('forecast.techniqueDescription.');
    }
  });

  it('handles empty trades list gracefully without crashing', () => {
    const forecast = generateForecast(1000, [], 'monteCarlo', 30);
    expect(forecast.currentDeposit).toBe(1000);
    expect(forecast.average.projectedDeposit).toBe(1000);
    expect(forecast.probabilityOfProfit).toBe(50);
  });

  it('estimates monthly trades rate and maps time horizons correctly', () => {
    const rate = estimateMonthlyTradesRate(mockTrades);
    expect(rate).toBeGreaterThanOrEqual(5);

    const trades1m = getApproxTradesForTimeHorizon(rate, '1m');
    const trades3m = getApproxTradesForTimeHorizon(rate, '3m');
    const trades6m = getApproxTradesForTimeHorizon(rate, '6m');
    const trades12m = getApproxTradesForTimeHorizon(rate, '12m');

    expect(trades1m).toBeLessThanOrEqual(trades3m);
    expect(trades3m).toBeLessThanOrEqual(trades6m);
    expect(trades6m).toBeLessThanOrEqual(trades12m);
    expect(trades12m).toBeGreaterThanOrEqual(60);
  });

  it('generates forecast in time horizon mode with timeLabels on chartPoints', () => {
    const rate = estimateMonthlyTradesRate(mockTrades);
    const resolvedTrades = getApproxTradesForTimeHorizon(rate, '3m');

    const forecast = generateForecast(1000, mockTrades, 'monteCarlo', resolvedTrades, {
      horizonMode: 'time',
      timeHorizon: '3m',
      approxMonthlyTradesRate: rate,
    });

    expect(forecast.horizonMode).toBe('time');
    expect(forecast.timeHorizon).toBe('3m');
    expect(forecast.approxMonthlyTradesRate).toBe(rate);

    const forecastPoints = forecast.chartPoints.filter((p) => p.isForecast);
    expect(forecastPoints.length).toBeGreaterThan(0);
    expect(forecastPoints[0].timeLabel).toBeDefined();
    expect(forecastPoints[forecastPoints.length - 1].timeLabel).toContain('3M');
  });
});
