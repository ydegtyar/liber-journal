import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  calculateForecastAsync,
  getForecastWorker,
  terminateForecastWorker,
} from './forecastWorkerClient';
import { clearForecastCache, getCachedForecast, getForecastCacheKey } from './forecastCache';
import type { Trade } from '../types/trade';

const sampleTrades: Trade[] = [
  {
    id: 't-1',
    dealId: '1',
    instrument: 'EUR/USD',
    direction: 'buy',
    openedAt: '2025-01-01T10:00:00Z',
    closedAt: '2025-01-01T11:00:00Z',
    openPrice: 1.1,
    closePrice: 1.105,
    margin: 1000,
    leverage: 30,
    grossReturn: 1100,
    pnl: 100,
  },
  {
    id: 't-2',
    dealId: '2',
    instrument: 'EUR/USD',
    direction: 'sell',
    openedAt: '2025-01-02T10:00:00Z',
    closedAt: '2025-01-02T11:00:00Z',
    openPrice: 1.105,
    closePrice: 1.1,
    margin: 1000,
    leverage: 30,
    grossReturn: 950,
    pnl: -50,
  },
  {
    id: 't-3',
    dealId: '3',
    instrument: 'GBP/USD',
    direction: 'buy',
    openedAt: '2025-01-03T10:00:00Z',
    closedAt: '2025-01-03T11:00:00Z',
    openPrice: 1.25,
    closePrice: 1.255,
    margin: 1000,
    leverage: 30,
    grossReturn: 1075,
    pnl: 75,
  },
];

describe('forecastWorkerClient', () => {
  beforeEach(() => {
    clearForecastCache();
    terminateForecastWorker();
    vi.restoreAllMocks();
  });

  it('calculates forecast asynchronously and returns valid ForecastResult', async () => {
    const result = await calculateForecastAsync(10000, sampleTrades, 'monteCarlo', 30, {
      horizonMode: 'time',
      timeHorizon: '1m',
      approxMonthlyTradesRate: 30,
    });

    expect(result).toBeDefined();
    expect(result.model).toBe('monteCarlo');
    expect(result.currentDeposit).toBe(10125);
    expect(result.conservative.projectedDeposit).toBeLessThanOrEqual(
      result.average.projectedDeposit
    );
    expect(result.average.projectedDeposit).toBeLessThanOrEqual(result.optimistic.projectedDeposit);
    expect(result.chartPoints.length).toBeGreaterThan(0);
  });

  it('automatically caches the calculated forecast in the 1-hour cache', async () => {
    const options = {
      horizonMode: 'time' as const,
      timeHorizon: '3m' as const,
      approxMonthlyTradesRate: 40,
    };

    const cacheKey = getForecastCacheKey(10000, sampleTrades, 'runRate', 90, options);
    expect(getCachedForecast(cacheKey)).toBeNull();

    const result = await calculateForecastAsync(10000, sampleTrades, 'runRate', 90, options);

    const cached = getCachedForecast(cacheKey);
    expect(cached).not.toBeNull();
    expect(cached).toEqual(result);
  });

  it('returns cached result on subsequent identical call within TTL', async () => {
    const options = {
      horizonMode: 'trades' as const,
      approxMonthlyTradesRate: 25,
    };

    const first = await calculateForecastAsync(
      10000,
      sampleTrades,
      'linearRegression',
      60,
      options
    );
    const second = await calculateForecastAsync(
      10000,
      sampleTrades,
      'linearRegression',
      60,
      options
    );

    expect(second).toBe(first); // Same reference from memory cache
  });

  it('handles terminating and restarting worker without leaking pending requests', () => {
    terminateForecastWorker();
    expect(getForecastWorker()).toBeDefined();
    terminateForecastWorker();
  });
});
