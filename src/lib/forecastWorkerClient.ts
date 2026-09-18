import type { Trade } from '../types/trade';
import type {
  ForecastGenerationOptions,
  ForecastModelId,
  ForecastResult,
  ForecastWorkerRequest,
  ForecastWorkerResponse,
} from '../types/forecast';
import { generateForecast } from './forecastEngine';
import { getCachedForecast, getForecastCacheKey, setCachedForecast } from './forecastCache';

let workerInstance: Worker | null = null;
const pendingRequests = new Map<
  string,
  {
    resolve: (result: ForecastResult) => void;
    reject: (error: Error) => void;
    timer: ReturnType<typeof setTimeout>;
    cacheKey: string;
  }
>();

/**
 * Initializes or returns the singleton Web Worker instance.
 */
export function getForecastWorker(): Worker | null {
  if (typeof window === 'undefined' || typeof Worker === 'undefined') {
    return null;
  }

  if (!workerInstance) {
    try {
      workerInstance = new Worker(new URL('../workers/forecast.worker.ts', import.meta.url), {
        type: 'module',
      });

      workerInstance.onmessage = (e: MessageEvent<ForecastWorkerResponse>) => {
        const { id, result, error } = e.data;
        const pending = pendingRequests.get(id);
        if (!pending) return;

        pendingRequests.delete(id);
        clearTimeout(pending.timer);

        if (error) {
          pending.reject(new Error(error));
        } else if (result) {
          setCachedForecast(pending.cacheKey, result);
          pending.resolve(result);
        } else {
          pending.reject(new Error('Empty forecast worker response'));
        }
      };

      workerInstance.onerror = (e: ErrorEvent) => {
        console.warn('Forecast Web Worker error, failing over pending requests:', e.message);
        for (const [id, pending] of pendingRequests.entries()) {
          pendingRequests.delete(id);
          clearTimeout(pending.timer);
          pending.reject(new Error(e.message || 'Forecast Web Worker failed'));
        }
        terminateForecastWorker();
      };
    } catch (err) {
      console.warn('Could not spawn Forecast Web Worker, will use main thread fallback:', err);
      workerInstance = null;
    }
  }

  return workerInstance;
}

/**
 * Terminates the singleton worker instance and resets pending requests.
 */
export function terminateForecastWorker(): void {
  if (workerInstance) {
    try {
      workerInstance.terminate();
    } catch {
      // ignore
    }
    workerInstance = null;
  }
  for (const [, pending] of pendingRequests.entries()) {
    clearTimeout(pending.timer);
  }
  pendingRequests.clear();
}

/**
 * Asynchronously calculates the forecast by first checking the 1-minute cache,
 * offloading to the Web Worker background thread if available, or falling back
 * seamlessly to main-thread execution.
 */
export async function calculateForecastAsync(
  initialDeposit: number,
  trades: Trade[],
  model: ForecastModelId,
  horizon: number,
  options?: ForecastGenerationOptions
): Promise<ForecastResult> {
  const cacheKey = getForecastCacheKey(initialDeposit, trades, model, horizon, options);

  // 1. Check 1-minute in-memory cache
  const cached = getCachedForecast(cacheKey);
  if (cached) {
    return cached;
  }

  // 2. Obtain Web Worker instance
  const worker = getForecastWorker();

  // If worker is unavailable (e.g. Node, SSR, restricted CSP), calculate on main thread
  if (!worker) {
    const result = generateForecast(initialDeposit, trades, model, horizon, options);
    setCachedForecast(cacheKey, result);
    return result;
  }

  // 3. Dispatch to Web Worker with a 5-second fallback timeout
  return new Promise<ForecastResult>((resolve, reject) => {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    const timer = setTimeout(() => {
      if (pendingRequests.has(requestId)) {
        pendingRequests.delete(requestId);
        console.warn(
          'Forecast Web Worker timed out after 5s; falling back to synchronous execution'
        );
        try {
          const fallbackResult = generateForecast(initialDeposit, trades, model, horizon, options);
          setCachedForecast(cacheKey, fallbackResult);
          resolve(fallbackResult);
        } catch (err) {
          reject(err instanceof Error ? err : new Error(String(err)));
        }
      }
    }, 5000);

    pendingRequests.set(requestId, {
      resolve,
      reject,
      timer,
      cacheKey,
    });

    const payload: ForecastWorkerRequest = {
      id: requestId,
      initialDeposit,
      trades,
      model,
      horizon,
      options,
    };

    worker.postMessage(payload);
  });
}
