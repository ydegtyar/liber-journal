import type { Trade } from '../types/trade';
import type { ForecastGenerationOptions, ForecastModelId, ForecastResult } from '../types/forecast';

export const FORECAST_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour (3,600,000 ms)

interface ForecastCacheEntry {
  result: ForecastResult;
  timestamp: number;
}

const forecastCache = new Map<string, ForecastCacheEntry>();

/**
 * Generates a stable deterministic cache key based on trades snapshot and parameters.
 */
export function getForecastCacheKey(
  initialDeposit: number,
  trades: Trade[],
  model: ForecastModelId,
  horizon: number,
  options?: ForecastGenerationOptions
): string {
  const tradesLen = trades.length;
  const firstTradeId = tradesLen > 0 ? trades[0].id : 'none';
  const lastTrade = tradesLen > 0 ? trades[tradesLen - 1] : null;
  const lastTradeId = lastTrade ? lastTrade.id : 'none';
  const lastTradeClose = lastTrade ? (lastTrade.closedAt ?? lastTrade.openedAt ?? '') : '';
  const roundedMonthlyRate = Math.round((options?.approxMonthlyTradesRate ?? 0) * 100) / 100;

  return [
    `len:${tradesLen}`,
    `first:${firstTradeId}`,
    `last:${lastTradeId}`,
    `ts:${lastTradeClose}`,
    `dep:${initialDeposit}`,
    `mod:${model}`,
    `hz:${horizon}`,
    `hm:${options?.horizonMode ?? 'time'}`,
    `th:${options?.timeHorizon ?? ''}`,
    `rate:${roundedMonthlyRate}`,
  ].join('|');
}

/**
 * Retrieves a cached forecast if it exists and is less than 1 hour old (or custom maxAgeMs).
 */
export function getCachedForecast(
  key: string,
  maxAgeMs: number = FORECAST_CACHE_TTL_MS
): ForecastResult | null {
  const entry = forecastCache.get(key);
  if (!entry) return null;

  const age = Date.now() - entry.timestamp;
  if (age > maxAgeMs) {
    forecastCache.delete(key);
    return null;
  }

  return entry.result;
}

/**
 * Stores a forecast result in the cache with the current timestamp.
 */
export function setCachedForecast(key: string, result: ForecastResult): void {
  // Prune if cache grows too large (> 100 entries)
  if (forecastCache.size > 100) {
    pruneExpiredForecastCache();
  }
  forecastCache.set(key, {
    result,
    timestamp: Date.now(),
  });
}

/**
 * Prunes expired entries older than maxAgeMs. Returns count of purged items.
 */
export function pruneExpiredForecastCache(maxAgeMs: number = FORECAST_CACHE_TTL_MS): number {
  const now = Date.now();
  let purged = 0;
  for (const [k, v] of forecastCache.entries()) {
    if (now - v.timestamp > maxAgeMs) {
      forecastCache.delete(k);
      purged++;
    }
  }
  return purged;
}

/**
 * Clears the entire cache (useful for testing or full resets).
 */
export function clearForecastCache(): void {
  forecastCache.clear();
}

/**
 * Returns current count of entries in the cache.
 */
export function getForecastCacheSize(): number {
  return forecastCache.size;
}
