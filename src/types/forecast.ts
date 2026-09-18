import type { Trade } from './trade';

export type ForecastModelId = 'monteCarlo' | 'linearRegression' | 'runRate' | 'compounding';

export type ForecastScenarioId = 'conservative' | 'average' | 'optimistic';

export type HorizonMode = 'time' | 'trades';

export type TimeHorizonKey = '1m' | '3m' | '6m' | '12m';

export type ForecastHorizon = number;

export interface ForecastPoint {
  index: number;
  label: string;
  isForecast: boolean;
  timeLabel?: string;
  historicalEquity?: number;
  conservativeEquity: number;
  averageEquity: number;
  optimisticEquity: number;
}

export interface ForecastScenarioSummary {
  projectedDeposit: number;
  projectedPnl: number;
  projectedRoiPercent: number;
}

export interface ForecastResult {
  model: ForecastModelId;
  horizon: number;
  horizonMode: HorizonMode;
  timeHorizon?: TimeHorizonKey;
  approxMonthlyTradesRate: number;
  currentDeposit: number;
  conservative: ForecastScenarioSummary;
  average: ForecastScenarioSummary;
  optimistic: ForecastScenarioSummary;
  probabilityOfProfit: number; // e.g. 78.5 (%)
  estimatedMaxDrawdownPercent: number; // e.g. 8.4 (%)
  chartPoints: ForecastPoint[];
  techniqueDescriptionKey: string;
}

export interface ForecastGenerationOptions {
  horizonMode?: HorizonMode;
  timeHorizon?: TimeHorizonKey;
  approxMonthlyTradesRate?: number;
}

export interface ForecastWorkerRequest {
  id: string;
  initialDeposit: number;
  trades: Trade[];
  model: ForecastModelId;
  horizon: number;
  options?: ForecastGenerationOptions;
}

export interface ForecastWorkerResponse {
  id: string;
  result?: ForecastResult;
  error?: string;
}

export const FORECAST_STORAGE_KEYS = {
  MODEL: 'liber_journal_forecast_model',
  HORIZON_MODE: 'liber_journal_forecast_horizon_mode',
  TIME_HORIZON: 'liber_journal_forecast_time_horizon',
  TRADES_HORIZON: 'liber_journal_forecast_trades_horizon',
  SCENARIO: 'liber_journal_forecast_scenario',
} as const;
