import { generateForecast } from '../lib/forecastEngine';
import type { ForecastWorkerRequest, ForecastWorkerResponse } from '../types/forecast';

self.onmessage = (e: MessageEvent<ForecastWorkerRequest>) => {
  const { id, initialDeposit, trades, model, horizon, options } = e.data;
  try {
    const result = generateForecast(initialDeposit, trades, model, horizon, options);
    const response: ForecastWorkerResponse = { id, result };
    self.postMessage(response);
  } catch (err) {
    const response: ForecastWorkerResponse = {
      id,
      error: err instanceof Error ? err.message : String(err),
    };
    self.postMessage(response);
  }
};
