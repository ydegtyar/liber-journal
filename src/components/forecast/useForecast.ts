import { useEffect, useRef, useState } from 'react';
import type { Trade } from '../../types/trade';
import type {
  ForecastGenerationOptions,
  ForecastModelId,
  ForecastResult,
} from '../../types/forecast';
import { calculateForecastAsync } from '../../lib/forecastWorkerClient';
import { getCachedForecast, getForecastCacheKey } from '../../lib/forecastCache';

interface UseForecastParams {
  initialDeposit: number;
  trades: Trade[];
  model: ForecastModelId;
  horizon: number | null;
  options: ForecastGenerationOptions;
  enabled?: boolean;
}

interface UseForecastReturn {
  forecast: ForecastResult | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook for lazy asynchronous forecast computation offloaded to a Web Worker
 * with 1-hour caching and loading state transitions upon user selection.
 */
export function useForecast({
  initialDeposit,
  trades,
  model,
  horizon,
  options,
  enabled = true,
}: UseForecastParams): UseForecastReturn {
  const isEnabled = enabled && horizon !== null && trades.length >= 2;
  const effectiveHorizon = horizon ?? 0;

  const cacheKey = isEnabled
    ? getForecastCacheKey(initialDeposit, trades, model, effectiveHorizon, options)
    : '';

  // Synchronously check 1-hour cache if enabled
  const cached = isEnabled ? getCachedForecast(cacheKey) : null;

  const [asyncState, setAsyncState] = useState<{
    key: string;
    forecast: ForecastResult | null;
    isLoading: boolean;
    error: Error | null;
  }>({
    key: cacheKey,
    forecast: cached,
    isLoading: isEnabled && cached === null,
    error: null,
  });

  // Track latest active request ID to ignore stale responses
  const activeRequestIdRef = useRef<number>(0);

  useEffect(() => {
    // If not enabled or no horizon selected, do not compute
    if (!isEnabled || !cacheKey) {
      return;
    }

    // If result is already present in cache, no background calculation needed
    if (getCachedForecast(cacheKey)) {
      return;
    }

    const currentRequestId = ++activeRequestIdRef.current;

    let isMounted = true;

    calculateForecastAsync(initialDeposit, trades, model, effectiveHorizon, options)
      .then((result) => {
        if (isMounted && activeRequestIdRef.current === currentRequestId) {
          setAsyncState({
            key: cacheKey,
            forecast: result,
            isLoading: false,
            error: null,
          });
        }
      })
      .catch((err) => {
        if (isMounted && activeRequestIdRef.current === currentRequestId) {
          setAsyncState((prev) => ({
            ...prev,
            key: cacheKey,
            isLoading: false,
            error: err instanceof Error ? err : new Error(String(err)),
          }));
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isEnabled, cacheKey, initialDeposit, trades, model, effectiveHorizon, options]);

  if (!isEnabled) {
    return {
      forecast: null,
      isLoading: false,
      error: null,
    };
  }

  const isCurrentKey = asyncState.key === cacheKey;
  const effectiveForecast = cached ?? (isCurrentKey ? asyncState.forecast : null);
  const effectiveIsLoading = cached ? false : isCurrentKey ? asyncState.isLoading : true;
  const effectiveError = isCurrentKey ? asyncState.error : null;

  return {
    forecast: effectiveForecast,
    isLoading: effectiveIsLoading,
    error: effectiveError,
  };
}
