import { Trade } from '../types/trade';
import {
  ForecastModelId,
  ForecastHorizon,
  ForecastPoint,
  ForecastResult,
  ForecastScenarioSummary,
  HorizonMode,
  TimeHorizonKey,
} from '../types/forecast';
import { round } from './calculations';

/**
 * Calculates quantile of a pre-sorted numeric array.
 * @param sortedArr Sorted array of numbers
 * @param q Quantile between 0 and 1 (e.g. 0.1 for 10th percentile)
 */
export function calculateQuantile(sortedArr: number[], q: number): number {
  if (sortedArr.length === 0) return 0;
  if (sortedArr.length === 1) return sortedArr[0];

  const pos = (sortedArr.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;

  if (sortedArr[base + 1] !== undefined) {
    return sortedArr[base] + rest * (sortedArr[base + 1] - sortedArr[base]);
  }
  return sortedArr[base];
}

/**
 * Normal cumulative distribution function approximation (Abramowitz and Stegun).
 */
export function normalCdf(x: number): number {
  const b1 = 0.31938153;
  const b2 = -0.356563782;
  const b3 = 1.781477937;
  const b4 = -1.821255978;
  const b5 = 1.330274429;
  const p = 0.2316419;
  const c = 0.39894228;

  if (x >= 0.0) {
    const t = 1.0 / (1.0 + p * x);
    return 1.0 - c * Math.exp((-x * x) / 2.0) * t * (t * (t * (t * (t * b5 + b4) + b3) + b2) + b1);
  } else {
    const t = 1.0 / (1.0 - p * x);
    return c * Math.exp((-x * x) / 2.0) * t * (t * (t * (t * (t * b5 + b4) + b3) + b2) + b1);
  }
}

/**
 * Extracts running equity history and trade PnLs from trades array.
 */
export function extractHistoricalSeries(
  initialDeposit: number,
  trades: Trade[]
): {
  pnls: number[];
  equities: number[];
} {
  const pnls: number[] = [];
  const equities: number[] = [initialDeposit];
  let running = initialDeposit;

  for (const t of trades) {
    const pnl = t.pnl || 0;
    pnls.push(pnl);
    running = round(running + pnl);
    equities.push(running);
  }

  return { pnls, equities };
}

/**
 * Calculates Monte Carlo Bootstrap forecast by resampling historical trade PnLs.
 */
export function calculateMonteCarloForecast(
  currentDeposit: number,
  pnls: number[],
  horizon: ForecastHorizon,
  iterations = 2000
): {
  conservativeCurve: number[];
  averageCurve: number[];
  optimisticCurve: number[];
  probabilityOfProfit: number;
  estimatedMaxDrawdownPercent: number;
} {
  if (pnls.length === 0) {
    const flat = Array(horizon + 1).fill(currentDeposit);
    return {
      conservativeCurve: flat,
      averageCurve: flat,
      optimisticCurve: flat,
      probabilityOfProfit: 50,
      estimatedMaxDrawdownPercent: 0,
    };
  }

  const pnlCount = pnls.length;
  // Step-wise simulations: step 0 to horizon
  // We'll store simulation equities per step to compute percentiles at key intervals
  const stepBuckets: number[][] = Array.from({ length: horizon + 1 }, () => []);
  const maxDrawdowns: number[] = [];
  let profitablePathsCount = 0;

  for (let iter = 0; iter < iterations; iter++) {
    let pathEquity = currentDeposit;
    let pathPeak = currentDeposit;
    let pathMaxDdAmount = 0;

    stepBuckets[0].push(currentDeposit);

    for (let h = 1; h <= horizon; h++) {
      // Uniform random bootstrap sampling with replacement
      const randomIndex = Math.floor(Math.random() * pnlCount);
      pathEquity += pnls[randomIndex];
      stepBuckets[h].push(pathEquity);

      if (pathEquity > pathPeak) {
        pathPeak = pathEquity;
      } else {
        const dd = pathPeak - pathEquity;
        if (dd > pathMaxDdAmount) {
          pathMaxDdAmount = dd;
        }
      }
    }

    if (pathEquity > currentDeposit) {
      profitablePathsCount++;
    }

    const ddPercent = pathPeak > 0 ? (pathMaxDdAmount / pathPeak) * 100 : 0;
    maxDrawdowns.push(ddPercent);
  }

  // Derive percentiles per step: 10th (conservative), 50th (median/average), 90th (optimistic)
  const conservativeCurve: number[] = [];
  const averageCurve: number[] = [];
  const optimisticCurve: number[] = [];

  for (let h = 0; h <= horizon; h++) {
    const bucket = stepBuckets[h].sort((a, b) => a - b);
    conservativeCurve.push(round(calculateQuantile(bucket, 0.1)));
    averageCurve.push(round(calculateQuantile(bucket, 0.5)));
    optimisticCurve.push(round(calculateQuantile(bucket, 0.9)));
  }

  maxDrawdowns.sort((a, b) => a - b);
  const medianDrawdown = round(calculateQuantile(maxDrawdowns, 0.5));
  const winProb = round((profitablePathsCount / iterations) * 100, 1);

  return {
    conservativeCurve,
    averageCurve,
    optimisticCurve,
    probabilityOfProfit: winProb,
    estimatedMaxDrawdownPercent: medianDrawdown,
  };
}

/**
 * Calculates Ordinary Least Squares (OLS) linear regression trend forecast.
 */
export function calculateLinearRegressionForecast(
  currentDeposit: number,
  pnls: number[],
  horizon: ForecastHorizon
): {
  conservativeCurve: number[];
  averageCurve: number[];
  optimisticCurve: number[];
  probabilityOfProfit: number;
  estimatedMaxDrawdownPercent: number;
} {
  const n = pnls.length;
  if (n < 2) {
    return calculateMonteCarloForecast(currentDeposit, pnls, horizon, 200);
  }

  // Cumulative PnL series: x = 1..n, y = running PnL
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  let runningPnl = 0;
  const runningPnlList: number[] = [];

  for (let i = 0; i < n; i++) {
    const x = i + 1;
    runningPnl += pnls[i];
    runningPnlList.push(runningPnl);
    sumX += x;
    sumY += runningPnl;
    sumXY += x * runningPnl;
    sumXX += x * x;
  }

  const meanX = sumX / n;
  const meanY = sumY / n;
  const denom = sumXX - n * meanX * meanX;
  const slope = denom !== 0 ? (sumXY - n * meanX * meanY) / denom : 0;
  const intercept = meanY - slope * meanX;

  // Residual standard error
  let sumSqResiduals = 0;
  for (let i = 0; i < n; i++) {
    const x = i + 1;
    const yHat = intercept + slope * x;
    const res = runningPnlList[i] - yHat;
    sumSqResiduals += res * res;
  }
  const stdError = Math.sqrt(sumSqResiduals / Math.max(1, n - 2));

  const conservativeCurve: number[] = [currentDeposit];
  const averageCurve: number[] = [currentDeposit];
  const optimisticCurve: number[] = [currentDeposit];

  // z-score 1.28 corresponds to 10th & 90th percentile bounds
  const z = 1.28;

  for (let k = 1; k <= horizon; k++) {
    const xForecast = n + k;
    const predictedDelta = slope * k;
    // Prediction interval expands with horizon
    const predictionSe =
      stdError * Math.sqrt(1 + 1 / n + Math.pow(xForecast - meanX, 2) / Math.max(1, denom));

    const avg = currentDeposit + predictedDelta;
    const cons = currentDeposit + predictedDelta - z * predictionSe;
    const opt = currentDeposit + predictedDelta + z * predictionSe;

    conservativeCurve.push(round(cons));
    averageCurve.push(round(avg));
    optimisticCurve.push(round(opt));
  }

  const finalDelta = slope * horizon;
  const finalSe =
    stdError * Math.sqrt(1 + 1 / n + Math.pow(n + horizon - meanX, 2) / Math.max(1, denom));
  const zFinal = finalSe > 0 ? finalDelta / finalSe : finalDelta >= 0 ? 3 : -3;
  const probabilityOfProfit = round(Math.min(99.9, Math.max(0.1, normalCdf(zFinal) * 100)), 1);

  // Approximate peak-to-trough drop from conservative trajectory
  const minEquity = Math.min(...conservativeCurve);
  const maxDrop = Math.max(0, currentDeposit - minEquity);
  const estimatedMaxDrawdownPercent =
    currentDeposit > 0 ? round((maxDrop / currentDeposit) * 100, 1) : 0;

  return {
    conservativeCurve,
    averageCurve,
    optimisticCurve,
    probabilityOfProfit,
    estimatedMaxDrawdownPercent,
  };
}

/**
 * Calculates Rolling Moving Average Run-Rate forecast.
 */
export function calculateRunRateForecast(
  currentDeposit: number,
  pnls: number[],
  horizon: ForecastHorizon,
  windowSize = 20
): {
  conservativeCurve: number[];
  averageCurve: number[];
  optimisticCurve: number[];
  probabilityOfProfit: number;
  estimatedMaxDrawdownPercent: number;
} {
  const n = pnls.length;
  if (n === 0) {
    const flat = Array(horizon + 1).fill(currentDeposit);
    return {
      conservativeCurve: flat,
      averageCurve: flat,
      optimisticCurve: flat,
      probabilityOfProfit: 50,
      estimatedMaxDrawdownPercent: 0,
    };
  }

  // Take recent window
  const windowTrades = pnls.slice(-windowSize);
  const meanPnl = windowTrades.reduce((acc, v) => acc + v, 0) / windowTrades.length;

  let varianceSum = 0;
  for (const p of windowTrades) {
    varianceSum += Math.pow(p - meanPnl, 2);
  }
  const stdDev = Math.sqrt(varianceSum / Math.max(1, windowTrades.length - 1));

  const conservativeCurve: number[] = [currentDeposit];
  const averageCurve: number[] = [currentDeposit];
  const optimisticCurve: number[] = [currentDeposit];
  const z = 1.28;

  for (let k = 1; k <= horizon; k++) {
    const expectedGain = meanPnl * k;
    const pathVol = stdDev * Math.sqrt(k);

    conservativeCurve.push(round(currentDeposit + expectedGain - z * pathVol));
    averageCurve.push(round(currentDeposit + expectedGain));
    optimisticCurve.push(round(currentDeposit + expectedGain + z * pathVol));
  }

  const finalVol = stdDev * Math.sqrt(horizon);
  const zScore = finalVol > 0 ? (meanPnl * horizon) / finalVol : meanPnl >= 0 ? 3 : -3;
  const probabilityOfProfit = round(Math.min(99.9, Math.max(0.1, normalCdf(zScore) * 100)), 1);

  const minEquity = Math.min(...conservativeCurve);
  const maxDrop = Math.max(0, currentDeposit - minEquity);
  const estimatedMaxDrawdownPercent =
    currentDeposit > 0 ? round((maxDrop / currentDeposit) * 100, 1) : 0;

  return {
    conservativeCurve,
    averageCurve,
    optimisticCurve,
    probabilityOfProfit,
    estimatedMaxDrawdownPercent,
  };
}

/**
 * Calculates Compounding Geometric Return forecast.
 */
export function calculateCompoundingForecast(
  currentDeposit: number,
  pnls: number[],
  horizon: ForecastHorizon
): {
  conservativeCurve: number[];
  averageCurve: number[];
  optimisticCurve: number[];
  probabilityOfProfit: number;
  estimatedMaxDrawdownPercent: number;
} {
  const n = pnls.length;
  if (n === 0 || currentDeposit <= 0) {
    const flat = Array(horizon + 1).fill(currentDeposit);
    return {
      conservativeCurve: flat,
      averageCurve: flat,
      optimisticCurve: flat,
      probabilityOfProfit: 50,
      estimatedMaxDrawdownPercent: 0,
    };
  }

  // Convert PnLs to bounded decimal returns relative to moving baseline
  const returns: number[] = [];
  let tempDeposit = Math.max(100, currentDeposit * 0.8);
  for (const pnl of pnls) {
    const r = pnl / tempDeposit;
    returns.push(Math.max(-0.8, Math.min(1.0, r)));
    tempDeposit = Math.max(50, tempDeposit + pnl);
  }

  // Logarithmic returns
  const logReturns = returns.map((r) => Math.log(1 + r));
  const meanLogR = logReturns.reduce((sum, v) => sum + v, 0) / logReturns.length;

  let varSum = 0;
  for (const lr of logReturns) {
    varSum += Math.pow(lr - meanLogR, 2);
  }
  const stdLogR = Math.sqrt(varSum / Math.max(1, logReturns.length - 1));

  const conservativeCurve: number[] = [currentDeposit];
  const averageCurve: number[] = [currentDeposit];
  const optimisticCurve: number[] = [currentDeposit];
  const z = 1.28;

  for (let k = 1; k <= horizon; k++) {
    const meanGrowth = k * meanLogR;
    const vol = stdLogR * Math.sqrt(k);

    const avg = currentDeposit * Math.exp(meanGrowth);
    const cons = currentDeposit * Math.exp(meanGrowth - z * vol);
    const opt = currentDeposit * Math.exp(meanGrowth + z * vol);

    conservativeCurve.push(round(cons));
    averageCurve.push(round(avg));
    optimisticCurve.push(round(opt));
  }

  const finalVol = stdLogR * Math.sqrt(horizon);
  const zScore = finalVol > 0 ? (meanLogR * horizon) / finalVol : meanLogR >= 0 ? 3 : -3;
  const probabilityOfProfit = round(Math.min(99.9, Math.max(0.1, normalCdf(zScore) * 100)), 1);

  const minEquity = Math.min(...conservativeCurve);
  const maxDrop = Math.max(0, currentDeposit - minEquity);
  const estimatedMaxDrawdownPercent =
    currentDeposit > 0 ? round((maxDrop / currentDeposit) * 100, 1) : 0;

  return {
    conservativeCurve,
    averageCurve,
    optimisticCurve,
    probabilityOfProfit,
    estimatedMaxDrawdownPercent,
  };
}

/**
 * Calculates historical trade frequency (trades per month) based on date span of trades.
 * Returns an approximation of monthly trades rate (default 20 trades/month baseline).
 */
export function estimateMonthlyTradesRate(trades: Trade[]): number {
  if (trades.length < 2) return 20;

  let earliest = Infinity;
  let latest = -Infinity;

  for (const t of trades) {
    const openTime = new Date(t.openedAt).getTime();
    if (!isNaN(openTime)) {
      if (openTime < earliest) earliest = openTime;
      if (openTime > latest) latest = openTime;
    }
    if (t.closedAt) {
      const closeTime = new Date(t.closedAt).getTime();
      if (!isNaN(closeTime)) {
        if (closeTime > latest) latest = closeTime;
      }
    }
  }

  if (earliest === Infinity || latest === -Infinity || latest <= earliest) {
    return 20;
  }

  const durationDays = Math.max(1, (latest - earliest) / (1000 * 60 * 60 * 24));
  const months = durationDays / 30.4375;
  const rawRate = trades.length / Math.max(0.2, months);

  return Math.max(5, Math.min(1000, Math.round(rawRate)));
}

/**
 * Maps a time horizon key ('1m' | '3m' | '6m' | '12m') to an approximate trade count
 * based on the trader's historical monthly velocity.
 */
export function getApproxTradesForTimeHorizon(
  monthlyRate: number,
  timeHorizon: TimeHorizonKey
): number {
  switch (timeHorizon) {
    case '1m':
      return Math.max(5, Math.round(monthlyRate * 1));
    case '3m':
      return Math.max(15, Math.round(monthlyRate * 3));
    case '6m':
      return Math.max(30, Math.round(monthlyRate * 6));
    case '12m':
      return Math.max(60, Math.round(monthlyRate * 12));
    default:
      return Math.max(15, Math.round(monthlyRate * 3));
  }
}

export interface GenerateForecastOptions {
  horizonMode?: HorizonMode;
  timeHorizon?: TimeHorizonKey;
  approxMonthlyTradesRate?: number;
}

/**
 * Main dispatcher generating uniform ForecastResult.
 */
export function generateForecast(
  initialDeposit: number,
  trades: Trade[],
  model: ForecastModelId = 'monteCarlo',
  horizon: ForecastHorizon = 60,
  options: GenerateForecastOptions = {}
): ForecastResult {
  const { pnls, equities } = extractHistoricalSeries(initialDeposit, trades);
  const currentDeposit = equities[equities.length - 1] || initialDeposit;

  const horizonMode: HorizonMode = options.horizonMode || 'time';
  const approxMonthlyTradesRate =
    options.approxMonthlyTradesRate ?? estimateMonthlyTradesRate(trades);

  let modelOutput: {
    conservativeCurve: number[];
    averageCurve: number[];
    optimisticCurve: number[];
    probabilityOfProfit: number;
    estimatedMaxDrawdownPercent: number;
  };

  switch (model) {
    case 'linearRegression':
      modelOutput = calculateLinearRegressionForecast(currentDeposit, pnls, horizon);
      break;
    case 'runRate':
      modelOutput = calculateRunRateForecast(currentDeposit, pnls, horizon);
      break;
    case 'compounding':
      modelOutput = calculateCompoundingForecast(currentDeposit, pnls, horizon);
      break;
    case 'monteCarlo':
    default:
      modelOutput = calculateMonteCarloForecast(currentDeposit, pnls, horizon, 2000);
      break;
  }

  const {
    conservativeCurve,
    averageCurve,
    optimisticCurve,
    probabilityOfProfit,
    estimatedMaxDrawdownPercent,
  } = modelOutput;

  // Build chart points: combine anchor historical points with forecast points
  const historicalTailCount = Math.min(15, equities.length);
  const historicalStartIndex = equities.length - historicalTailCount;
  const chartPoints: ForecastPoint[] = [];

  for (let i = historicalStartIndex; i < equities.length; i++) {
    const tradeIdx = i;
    const isNow = i === equities.length - 1;
    chartPoints.push({
      index: tradeIdx,
      label: isNow ? 'Now' : `#${tradeIdx}`,
      isForecast: false,
      historicalEquity: equities[i],
      conservativeEquity: equities[i],
      averageEquity: equities[i],
      optimisticEquity: equities[i],
    });
  }

  // Sample forecast curve points
  const stepStride = horizon <= 60 ? 1 : Math.ceil(horizon / 40);
  const lastHistoricalIndex = equities.length - 1;

  const totalMonths =
    options.timeHorizon === '1m'
      ? 1
      : options.timeHorizon === '3m'
        ? 3
        : options.timeHorizon === '6m'
          ? 6
          : options.timeHorizon === '12m'
            ? 12
            : round(horizon / approxMonthlyTradesRate, 1);

  for (let k = 1; k <= horizon; k++) {
    if (k % stepStride === 0 || k === horizon) {
      const monthFraction = round((k / horizon) * totalMonths, 1);
      const label =
        horizonMode === 'time'
          ? monthFraction < 1 && totalMonths <= 1
            ? `+${Math.round(monthFraction * 30)}d`
            : `+${monthFraction}M`
          : `+${k}`;

      chartPoints.push({
        index: lastHistoricalIndex + k,
        label,
        timeLabel: `~${monthFraction}M (${k} trades)`,
        isForecast: true,
        conservativeEquity: conservativeCurve[k],
        averageEquity: averageCurve[k],
        optimisticEquity: optimisticCurve[k],
      });
    }
  }

  const finalConservative = conservativeCurve[horizon] ?? currentDeposit;
  const finalAverage = averageCurve[horizon] ?? currentDeposit;
  const finalOptimistic = optimisticCurve[horizon] ?? currentDeposit;

  const createSummary = (finalVal: number): ForecastScenarioSummary => {
    const pnl = round(finalVal - currentDeposit);
    const roi = currentDeposit > 0 ? round((pnl / currentDeposit) * 100) : 0;
    return {
      projectedDeposit: round(finalVal),
      projectedPnl: pnl,
      projectedRoiPercent: roi,
    };
  };

  const descriptionKeyMap: Record<ForecastModelId, string> = {
    monteCarlo: 'forecast.techniqueDescription.monteCarlo',
    linearRegression: 'forecast.techniqueDescription.linearRegression',
    runRate: 'forecast.techniqueDescription.runRate',
    compounding: 'forecast.techniqueDescription.compounding',
  };

  return {
    model,
    horizon,
    horizonMode,
    timeHorizon: options.timeHorizon,
    approxMonthlyTradesRate,
    currentDeposit: round(currentDeposit),
    conservative: createSummary(finalConservative),
    average: createSummary(finalAverage),
    optimistic: createSummary(finalOptimistic),
    probabilityOfProfit,
    estimatedMaxDrawdownPercent,
    chartPoints,
    techniqueDescriptionKey: descriptionKeyMap[model],
  };
}
