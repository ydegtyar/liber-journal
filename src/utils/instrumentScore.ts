import { Trade, InstrumentSummary } from '../types/trade';

export type InstrumentRating = 'best' | 'good' | 'neutral' | 'weak' | 'worst' | 'insufficient';

interface ScoreWeights {
  expectancy: number;
  profitFactor: number;
  sortino: number;
  maxDrawdown: number;
  recoveryFactor: number;
  payoffRatio: number;
  winRate: number;
  consistency: number;
}

interface ScoreBreakdownItem {
  key: keyof ScoreWeights;
  value: number;
  percentile: number;
  weight: number;
  contribution: number;
}

export interface InstrumentScoreRow extends InstrumentSummary {
  tradesData?: Trade[];
  expectancy: number;
  profitFactor: number;
  payoffRatio: number;
  maxDrawdown: number;
  recoveryFactor: number;
  sortino: number;
  outlierDependence: number;
  rawScore: number | null;
  score: number | null;
  scoreConfidence: number;
  rating: InstrumentRating;
  warnings: string[];
  breakdown: ScoreBreakdownItem[];
}

export interface InstrumentScoreConfig {
  minTrades: number;
  k: number;
  weights: ScoreWeights;
  hardFlags: {
    maxOutlierDependence: number;
  };
}

export const DEFAULT_SCORE_CONFIG: InstrumentScoreConfig = {
  minTrades: 10,
  k: 20,
  weights: {
    expectancy: 0.25,
    profitFactor: 0.2,
    sortino: 0.15,
    maxDrawdown: 0.15,
    recoveryFactor: 0.1,
    payoffRatio: 0.05,
    winRate: 0.05,
    consistency: 0.05,
  },
  hardFlags: {
    maxOutlierDependence: 60,
  },
};

export interface RawInstrumentMetrics {
  expectancy: number;
  profitFactor: number;
  payoffRatio: number;
  maxDrawdown: number;
  recoveryFactor: number;
  sortino: number;
  outlierDependence: number;
  winRate: number;
}

/**
 * Computes individual trading performance metrics from per-trade data or summary data.
 */
export function computeMetrics(
  trades: Trade[] | undefined,
  summary: InstrumentSummary
): RawInstrumentMetrics {
  const tradeList = trades && trades.length > 0 ? trades : null;

  if (!tradeList) {
    const pf = summary.netPnl > 0 ? 2 : summary.netPnl < 0 ? 0.5 : 1;
    return {
      expectancy: summary.avgPnl,
      profitFactor: pf,
      payoffRatio: 1,
      maxDrawdown: 0,
      recoveryFactor: summary.netPnl > 0 ? 5 : 0,
      sortino: summary.netPnl > 0 ? 1 : 0,
      outlierDependence: 0,
      winRate: summary.winRate,
    };
  }

  const n = tradeList.length;
  const pnls = tradeList.map((t) => t.pnl);

  // Expectancy: check if all trades have plannedRisk > 0 for R-multiples, else dollar mean
  const hasAllRisks = tradeList.every(
    (t) => typeof t.plannedRisk === 'number' && t.plannedRisk > 0
  );
  let expectancy = 0;
  if (hasAllRisks && n > 0) {
    const rMultiples = tradeList.map((t) => t.pnl / (t.plannedRisk as number));
    expectancy = rMultiples.reduce((sum, r) => sum + r, 0) / n;
  } else {
    expectancy = n > 0 ? pnls.reduce((sum, p) => sum + p, 0) / n : summary.avgPnl;
  }

  // Wins and Losses
  const wins = pnls.filter((p) => p > 0.0001);
  const losses = pnls.filter((p) => p < -0.0001);

  const grossProfit = wins.reduce((sum, p) => sum + p, 0);
  const grossLossAbs = Math.abs(losses.reduce((sum, p) => sum + p, 0));

  let profitFactor = 0;
  if (grossLossAbs === 0) {
    profitFactor = grossProfit > 0 ? 5 : 1;
  } else {
    profitFactor = Math.min(5, grossProfit / grossLossAbs);
  }

  const avgWin = wins.length > 0 ? grossProfit / wins.length : 0;
  const avgLoss = losses.length > 0 ? grossLossAbs / losses.length : 0;
  let payoffRatio = 0;
  if (avgLoss === 0) {
    payoffRatio = avgWin > 0 ? 5 : 1;
  } else {
    payoffRatio = Math.min(5, avgWin / avgLoss);
  }

  // Max drawdown (absolute amount of drop from peak cumulative PnL)
  // Ensure chronological order
  const sortedTrades = [...tradeList].sort((a, b) => {
    const tA = new Date(a.closedAt || a.openedAt).getTime() || 0;
    const tB = new Date(b.closedAt || b.openedAt).getTime() || 0;
    return tA - tB;
  });

  let cumulative = 0;
  let peak = 0;
  let maxDd = 0;
  for (const t of sortedTrades) {
    cumulative += t.pnl;
    if (cumulative > peak) {
      peak = cumulative;
    }
    const drop = peak - cumulative;
    if (drop > maxDd) {
      maxDd = drop;
    }
  }

  const netPnl = summary.netPnl;
  let recoveryFactor = 0;
  if (maxDd === 0) {
    recoveryFactor = netPnl > 0 ? 5 : netPnl < 0 ? -5 : 0;
  } else {
    recoveryFactor = netPnl / maxDd;
  }

  // Sortino ratio: mean return / downside deviation
  // Downside deviation: sqrt(mean of min(0, pnl)^2)
  const sumSquaredNeg = pnls.reduce((acc, p) => {
    const neg = Math.min(0, p);
    return acc + neg * neg;
  }, 0);
  const downsideDev = Math.sqrt(sumSquaredNeg / n);
  const meanReturn = n > 0 ? pnls.reduce((sum, p) => sum + p, 0) / n : 0;
  let sortino = 0;
  if (downsideDev === 0) {
    sortino = meanReturn > 0 ? 5 : meanReturn < 0 ? -5 : 0;
  } else {
    sortino = meanReturn / downsideDev;
  }

  // Outlier dependence: share of net PnL from top 1 (or top 5%) winning trades
  // Top count: Math.max(1, Math.ceil(0.05 * wins.length))
  let outlierDependence = 0;
  if (wins.length > 0 && netPnl > 0) {
    const sortedWinsDesc = [...wins].sort((a, b) => b - a);
    const topCount = Math.max(1, Math.ceil(0.05 * wins.length));
    const topWinsSum = sortedWinsDesc.slice(0, topCount).reduce((sum, p) => sum + p, 0);
    outlierDependence = Math.min(100, Math.max(0, (topWinsSum / netPnl) * 100));
  }

  const winRate = summary.winRate;

  return {
    expectancy,
    profitFactor,
    payoffRatio,
    maxDrawdown: maxDd,
    recoveryFactor,
    sortino,
    outlierDependence,
    winRate,
  };
}

/**
 * Winsorizes an array of numbers at the pLow and pHigh percentiles (e.g. 0.05 and 0.95).
 */
export function winsorize(values: number[], pLow = 0.05, pHigh = 0.95): number[] {
  const n = values.length;
  if (n <= 1) return [...values];

  const sorted = [...values].sort((a, b) => a - b);

  // Exact quantile index helper
  const getQuantile = (p: number) => {
    const idx = (n - 1) * p;
    const lower = Math.floor(idx);
    const upper = Math.ceil(idx);
    const weight = idx - lower;
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  };

  const lowVal = getQuantile(pLow);
  const highVal = getQuantile(pHigh);

  return values.map((v) => {
    if (v < lowVal) return lowVal;
    if (v > highVal) return highVal;
    return v;
  });
}

/**
 * Converts values to percentile ranks (0 - 100).
 * Lower is better can be inverted by setting `invert = true`.
 * For identical values, average rank is used.
 */
export function percentileRank(values: number[], invert = false): number[] {
  const n = values.length;
  if (n === 0) return [];
  if (n === 1) return [invert ? 50 : 50];

  // Group indices by value
  const indexed = values.map((val, idx) => ({ val, idx }));
  indexed.sort((a, b) => a.val - b.val);

  const ranks = new Array<number>(n);
  let i = 0;
  while (i < n) {
    let j = i;
    while (j < n && indexed[j].val === indexed[i].val) {
      j++;
    }
    // Items from i to j - 1 are identical
    // Standard fractional rank between 0 and 100: (avgIndex / (n - 1)) * 100
    // If all values are identical across the entire array, rank is 50.
    const avgIndex = (i + j - 1) / 2;
    const pct = n === 1 ? 50 : (avgIndex / (n - 1)) * 100;

    for (let k = i; k < j; k++) {
      ranks[indexed[k].idx] = invert ? 100 - pct : pct;
    }
    i = j;
  }

  return ranks;
}

/**
 * Calculates composite Instrument Scores (0-100) and assigns rating categories.
 *
 * Methodology:
 * 1. Filter out instruments with `trades < minTrades` -> rated 'insufficient', score null.
 * 2. Calculate pure trading metrics for eligible instruments.
 * 3. Winsorize each metric across eligible instruments at 5th/95th percentile.
 * 4. Convert each metric to a 0-100 percentile rank (inverted for maxDrawdown and outlierDependence).
 * 5. Compute raw composite score using weights:
 *    - Expectancy: 0.25
 *    - Profit factor: 0.20
 *    - Sortino: 0.15
 *    - Max drawdown (inverted): 0.15
 *    - Recovery factor: 0.10
 *    - Payoff ratio: 0.05
 *    - Win rate: 0.05
 *    - Consistency (inverted outlier dependence): 0.05
 * 6. Confidence shrinkage towards 50: `finalScore = 50 + (rawScore - 50) * (n / (n + k))`
 * 7. Hard-flag overrides:
 *    - Negative expectancy AND profitFactor < 1 -> cannot be rated above 'weak'
 *    - Positive net P&L but outlierDependence > 60% -> warning 'Fragile edge'
 * 8. Rating bands:
 *    - If >= 5 eligible instruments: top 20% -> 'best', next 20% -> 'good', middle 20% -> 'neutral', next 20% -> 'weak', bottom 20% -> 'worst'.
 *    - If < 5 eligible instruments: absolute bands: >=70 'best', 55-70 'good', 45-55 'neutral', 30-45 'weak', <30 'worst'.
 * 9. Tie-breaking by trades descending, then symbol alphabetically.
 */
export function calculateInstrumentScores(
  rows: Array<InstrumentSummary & { tradesData?: Trade[] }>,
  options?: Partial<InstrumentScoreConfig>
): InstrumentScoreRow[] {
  const config: InstrumentScoreConfig = {
    ...DEFAULT_SCORE_CONFIG,
    ...options,
    weights: {
      ...DEFAULT_SCORE_CONFIG.weights,
      ...(options?.weights || {}),
    },
    hardFlags: {
      ...DEFAULT_SCORE_CONFIG.hardFlags,
      ...(options?.hardFlags || {}),
    },
  };

  if (!rows || rows.length === 0) {
    return [];
  }

  // Pre-calculate metrics for each row
  const metricsList = rows.map((row) => computeMetrics(row.tradesData, row));

  const eligibleIndices: number[] = [];
  rows.forEach((row, idx) => {
    if (row.trades >= config.minTrades) {
      eligibleIndices.push(idx);
    }
  });

  const mCount = eligibleIndices.length;

  // Arrays to hold scores & breakdown
  const rawScores = new Array<number | null>(rows.length).fill(null);
  const finalScores = new Array<number | null>(rows.length).fill(null);
  const confidences = new Array<number>(rows.length).fill(0);
  const breakdowns = new Array<ScoreBreakdownItem[]>(rows.length).fill([]);
  const warningsList = new Array<string[]>(rows.length).fill([]);
  const ratings = new Array<InstrumentRating>(rows.length).fill('insufficient');

  // Compute confidence for all rows
  rows.forEach((row, idx) => {
    confidences[idx] = row.trades / (row.trades + config.k);
    breakdowns[idx] = [];
    warningsList[idx] = [];
  });

  if (mCount > 0) {
    // Extract raw metrics for eligible instruments
    const expVals = eligibleIndices.map((i) => metricsList[i].expectancy);
    const pfVals = eligibleIndices.map((i) => metricsList[i].profitFactor);
    const sortinoVals = eligibleIndices.map((i) => metricsList[i].sortino);
    const maxDdVals = eligibleIndices.map((i) => metricsList[i].maxDrawdown);
    const recVals = eligibleIndices.map((i) => metricsList[i].recoveryFactor);
    const payoffVals = eligibleIndices.map((i) => metricsList[i].payoffRatio);
    const winRateVals = eligibleIndices.map((i) => metricsList[i].winRate);
    const outlierVals = eligibleIndices.map((i) => metricsList[i].outlierDependence);

    // Winsorize
    const winExp = winsorize(expVals);
    const winPf = winsorize(pfVals);
    const winSortino = winsorize(sortinoVals);
    const winMaxDd = winsorize(maxDdVals);
    const winRec = winsorize(recVals);
    const winPayoff = winsorize(payoffVals);
    const winWinRate = winsorize(winRateVals);
    const winOutlier = winsorize(outlierVals);

    // Percentile ranks
    const rankExp = percentileRank(winExp, false);
    const rankPf = percentileRank(winPf, false);
    const rankSortino = percentileRank(winSortino, false);
    const rankMaxDd = percentileRank(winMaxDd, true); // inverted
    const rankRec = percentileRank(winRec, false);
    const rankPayoff = percentileRank(winPayoff, false);
    const rankWinRate = percentileRank(winWinRate, false);
    const rankConsistency = percentileRank(winOutlier, true); // inverted (lower outlier = higher consistency)

    const w = config.weights;

    eligibleIndices.forEach((origIdx, eIdx) => {
      const expPct = rankExp[eIdx];
      const pfPct = rankPf[eIdx];
      const sortinoPct = rankSortino[eIdx];
      const ddPct = rankMaxDd[eIdx];
      const recPct = rankRec[eIdx];
      const payoffPct = rankPayoff[eIdx];
      const winRatePct = rankWinRate[eIdx];
      const consPct = rankConsistency[eIdx];

      const breakdown: ScoreBreakdownItem[] = [
        {
          key: 'expectancy',
          value: metricsList[origIdx].expectancy,
          percentile: expPct,
          weight: w.expectancy,
          contribution: expPct * w.expectancy,
        },
        {
          key: 'profitFactor',
          value: metricsList[origIdx].profitFactor,
          percentile: pfPct,
          weight: w.profitFactor,
          contribution: pfPct * w.profitFactor,
        },
        {
          key: 'sortino',
          value: metricsList[origIdx].sortino,
          percentile: sortinoPct,
          weight: w.sortino,
          contribution: sortinoPct * w.sortino,
        },
        {
          key: 'maxDrawdown',
          value: metricsList[origIdx].maxDrawdown,
          percentile: ddPct,
          weight: w.maxDrawdown,
          contribution: ddPct * w.maxDrawdown,
        },
        {
          key: 'recoveryFactor',
          value: metricsList[origIdx].recoveryFactor,
          percentile: recPct,
          weight: w.recoveryFactor,
          contribution: recPct * w.recoveryFactor,
        },
        {
          key: 'payoffRatio',
          value: metricsList[origIdx].payoffRatio,
          percentile: payoffPct,
          weight: w.payoffRatio,
          contribution: payoffPct * w.payoffRatio,
        },
        {
          key: 'winRate',
          value: metricsList[origIdx].winRate,
          percentile: winRatePct,
          weight: w.winRate,
          contribution: winRatePct * w.winRate,
        },
        {
          key: 'consistency',
          value: metricsList[origIdx].outlierDependence,
          percentile: consPct,
          weight: w.consistency,
          contribution: consPct * w.consistency,
        },
      ];

      const rawScore = breakdown.reduce((sum, item) => sum + item.contribution, 0);
      const conf = confidences[origIdx];
      const finalScore = 50 + (rawScore - 50) * conf;

      rawScores[origIdx] = Math.round(rawScore * 10) / 10;
      finalScores[origIdx] = Math.max(0, Math.min(100, Math.round(finalScore * 10) / 10));
      breakdowns[origIdx] = breakdown;

      // Hard flag warnings
      const warnings: string[] = [];
      if (
        rows[origIdx].netPnl > 0 &&
        metricsList[origIdx].outlierDependence > config.hardFlags.maxOutlierDependence
      ) {
        warnings.push('fragileEdge');
      }
      warningsList[origIdx] = warnings;
    });

    // Rating bands assignment
    if (mCount < 5) {
      // Absolute bands: >=70 best, 55-70 good, 45-55 neutral, 30-45 weak, <30 worst
      eligibleIndices.forEach((origIdx) => {
        const sc = finalScores[origIdx] ?? 0;
        let r: InstrumentRating = 'neutral';
        if (sc >= 70) r = 'best';
        else if (sc >= 55) r = 'good';
        else if (sc >= 45) r = 'neutral';
        else if (sc >= 30) r = 'weak';
        else r = 'worst';

        // Check hard-flag override:
        // Negative expectancy AND profit factor < 1 -> cannot be rated above weak
        const met = metricsList[origIdx];
        if (met.expectancy < 0 && met.profitFactor < 1) {
          if (r === 'best' || r === 'good' || r === 'neutral') {
            r = 'weak';
          }
        }
        ratings[origIdx] = r;
      });
    } else {
      // Quantile bands: top 20% -> best, next 20% -> good, middle 20% -> neutral, next 20% -> weak, bottom 20% -> worst
      // Sort eligible by finalScore descending, tie-breaking by trades descending, then symbol alphabetically
      const sortedEligible = [...eligibleIndices].sort((a, b) => {
        const scoreA = finalScores[a] ?? 0;
        const scoreB = finalScores[b] ?? 0;
        if (Math.abs(scoreB - scoreA) > 1e-6) {
          return scoreB - scoreA;
        }
        if (rows[b].trades !== rows[a].trades) {
          return rows[b].trades - rows[a].trades;
        }
        return rows[a].symbol.localeCompare(rows[b].symbol);
      });

      sortedEligible.forEach((origIdx, rankIdx) => {
        // Percentile rank in population [0, 1): rankIdx / mCount
        const fraction = rankIdx / mCount;
        let r: InstrumentRating = 'neutral';
        if (fraction < 0.2) r = 'best';
        else if (fraction < 0.4) r = 'good';
        else if (fraction < 0.6) r = 'neutral';
        else if (fraction < 0.8) r = 'weak';
        else r = 'worst';

        // Hard-flag override: Negative expectancy AND profit factor < 1 -> cannot be rated above weak
        const met = metricsList[origIdx];
        if (met.expectancy < 0 && met.profitFactor < 1) {
          if (r === 'best' || r === 'good' || r === 'neutral') {
            r = 'weak';
          }
        }
        ratings[origIdx] = r;
      });
    }
  }

  return rows.map((row, idx) => ({
    ...row,
    expectancy: metricsList[idx].expectancy,
    profitFactor: metricsList[idx].profitFactor,
    payoffRatio: metricsList[idx].payoffRatio,
    maxDrawdown: metricsList[idx].maxDrawdown,
    recoveryFactor: metricsList[idx].recoveryFactor,
    sortino: metricsList[idx].sortino,
    outlierDependence: metricsList[idx].outlierDependence,
    rawScore: rawScores[idx],
    score: finalScores[idx],
    scoreConfidence: confidences[idx],
    rating: ratings[idx],
    warnings: warningsList[idx],
    breakdown: breakdowns[idx],
  }));
}
