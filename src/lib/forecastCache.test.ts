import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  clearForecastCache,
  getCachedForecast,
  getForecastCacheKey,
  getForecastCacheSize,
  pruneExpiredForecastCache,
  setCachedForecast,
  FORECAST_CACHE_TTL_MS,
} from './forecastCache';
import type { Trade } from '../types/trade';
import type { ForecastResult } from '../types/forecast';

const mockTrades: Trade[] = [
  {
    id: 't-1',
    dealId: '101',
    instrument: 'EUR/USD',
    direction: 'buy',
    openedAt: '2025-01-01T10:00:00Z',
    closedAt: '2025-01-01T11:00:00Z',
    openPrice: 1.1,
    closePrice: 1.105,
    margin: 1000,
    leverage: 30,
    grossReturn: 1050,
    pnl: 50,
  },
  {
    id: 't-2',
    dealId: '102',
    instrument: 'EUR/USD',
    direction: 'sell',
    openedAt: '2025-01-02T10:00:00Z',
    closedAt: '2025-01-02T11:00:00Z',
    openPrice: 1.105,
    closePrice: 1.1,
    margin: 1000,
    leverage: 30,
    grossReturn: 980,
    pnl: -20,
  },
];

const mockResult: ForecastResult = {
  model: 'monteCarlo',
  horizon: 60,
  horizonMode: 'time',
  timeHorizon: '1m',
  approxMonthlyTradesRate: 35,
  currentDeposit: 10030,
  conservative: { projectedDeposit: 10050, projectedPnl: 20, projectedRoiPercent: 0.2 },
  average: { projectedDeposit: 10100, projectedPnl: 70, projectedRoiPercent: 0.7 },
  optimistic: { projectedDeposit: 10200, projectedPnl: 170, projectedRoiPercent: 1.7 },
  probabilityOfProfit: 75,
  estimatedMaxDrawdownPercent: 5.2,
  chartPoints: [],
  techniqueDescriptionKey: 'forecast.techniques.monteCarlo',
};

describe('forecastCache', () => {
  beforeEach(() => {
    clearForecastCache();
    vi.restoreAllMocks();
  });

  it('generates consistent, deterministic cache keys', () => {
    const key1 = getForecastCacheKey(10000, mockTrades, 'monteCarlo', 60, {
      horizonMode: 'time',
      timeHorizon: '1m',
      approxMonthlyTradesRate: 35.456,
    });
    const key2 = getForecastCacheKey(10000, mockTrades, 'monteCarlo', 60, {
      horizonMode: 'time',
      timeHorizon: '1m',
      approxMonthlyTradesRate: 35.459, // rounds to 35.46
    });
    expect(key1).toBe(key2);
  });

  it('differentiates cache keys on parameter change', () => {
    const keyBase = getForecastCacheKey(10000, mockTrades, 'monteCarlo', 60, {
      horizonMode: 'time',
      timeHorizon: '1m',
    });
    const keyDiffModel = getForecastCacheKey(10000, mockTrades, 'linearRegression', 60, {
      horizonMode: 'time',
      timeHorizon: '1m',
    });
    const keyDiffHorizon = getForecastCacheKey(10000, mockTrades, 'monteCarlo', 90, {
      horizonMode: 'time',
      timeHorizon: '3m',
    });
    const keyDiffMode = getForecastCacheKey(10000, mockTrades, 'monteCarlo', 60, {
      horizonMode: 'trades',
    });

    expect(keyBase).not.toBe(keyDiffModel);
    expect(keyBase).not.toBe(keyDiffHorizon);
    expect(keyBase).not.toBe(keyDiffMode);
  });

  it('caches and retrieves results within the 1-hour TTL', () => {
    const key = 'test-key-1';
    expect(getCachedForecast(key)).toBeNull();

    setCachedForecast(key, mockResult);
    expect(getCachedForecast(key)).toEqual(mockResult);
    expect(getForecastCacheSize()).toBe(1);
  });

  it('expires entries older than 1 hour (3,600,000ms)', () => {
    const key = 'test-key-exp';
    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);

    setCachedForecast(key, mockResult);
    expect(getCachedForecast(key)).toEqual(mockResult);

    // Advance time by 3,600,001 ms (just past 1 hour)
    vi.spyOn(Date, 'now').mockReturnValue(now + FORECAST_CACHE_TTL_MS + 1);

    expect(getCachedForecast(key)).toBeNull();
  });

  it('prunes expired entries while preserving fresh entries', () => {
    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);

    setCachedForecast('key-fresh', mockResult);

    vi.spyOn(Date, 'now').mockReturnValue(now - FORECAST_CACHE_TTL_MS - 10000); // Expired (> 1 hour)
    setCachedForecast('key-expired', mockResult);

    vi.spyOn(Date, 'now').mockReturnValue(now);
    expect(getForecastCacheSize()).toBe(2);

    const purged = pruneExpiredForecastCache();
    expect(purged).toBe(1);
    expect(getForecastCacheSize()).toBe(1);
    expect(getCachedForecast('key-fresh')).toEqual(mockResult);
    expect(getCachedForecast('key-expired')).toBeNull();
  });

  it('clears all items when clearForecastCache is invoked', () => {
    setCachedForecast('k1', mockResult);
    setCachedForecast('k2', mockResult);
    expect(getForecastCacheSize()).toBe(2);

    clearForecastCache();
    expect(getForecastCacheSize()).toBe(0);
    expect(getCachedForecast('k1')).toBeNull();
  });
});
