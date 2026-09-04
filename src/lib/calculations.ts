import {
  Trade,
  GroupByOption,
  GroupSummary,
  JournalAnalytics,
  EquityPoint,
  StreakAnalysis,
  PeriodInsight,
  InstrumentSummary,
  YearMonthlyReturns,
  MonthlyReturnItem,
} from '../types/trade';

/**
 * Rounds a number to a specified number of decimal places (default 2).
 */
export function round(value: number, decimals = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/**
 * Sums the net PnL across all trades.
 */
export function calculateNetPnl(trades: Trade[]): number {
  return round(trades.reduce((sum, t) => sum + (t.pnl || 0), 0));
}

/**
 * Calculates current deposit balance: initialDeposit + netPnl.
 */
export function calculateCurrentDeposit(initialDeposit: number, trades: Trade[]): number {
  return round(initialDeposit + calculateNetPnl(trades));
}

/**
 * Calculates ROI percentage: (netPnl / initialDeposit) * 100.
 */
export function calculateRoi(initialDeposit: number, netPnl: number): number {
  if (initialDeposit <= 0) return 0;
  return round((netPnl / initialDeposit) * 100);
}

/**
 * Counts winning, losing, and breakeven trades.
 */
export function calculateWinLossBreakeven(trades: Trade[]): {
  wins: number;
  losses: number;
  breakeven: number;
  total: number;
} {
  let wins = 0;
  let losses = 0;
  let breakeven = 0;

  for (const t of trades) {
    if (t.pnl > 0.0001) {
      wins++;
    } else if (t.pnl < -0.0001) {
      losses++;
    } else {
      breakeven++;
    }
  }

  return {
    wins,
    losses,
    breakeven,
    total: trades.length,
  };
}

/**
 * Calculates win rate percentage excluding breakeven trades from the denominator:
 * wins / (wins + losses) * 100
 */
export function calculateWinRate(trades: Trade[]): number {
  const { wins, losses } = calculateWinLossBreakeven(trades);
  const decisiveTrades = wins + losses;
  if (decisiveTrades === 0) return 0;
  return round((wins / decisiveTrades) * 100);
}

/**
 * Calculates breakeven rate percentage:
 * breakeven / total * 100
 */
export function calculateBreakevenRate(trades: Trade[]): number {
  if (trades.length === 0) return 0;
  const { breakeven } = calculateWinLossBreakeven(trades);
  return round((breakeven / trades.length) * 100);
}

/**
 * Calculates Profit Factor: sum(wins) / abs(sum(losses)).
 * Returns 0 if no wins, and Infinity if wins > 0 and losses === 0.
 */
export function calculateProfitFactor(trades: Trade[]): number {
  let grossWin = 0;
  let grossLoss = 0;

  for (const t of trades) {
    if (t.pnl > 0) {
      grossWin += t.pnl;
    } else if (t.pnl < 0) {
      grossLoss += Math.abs(t.pnl);
    }
  }

  if (grossLoss === 0) {
    return grossWin > 0 ? Infinity : 0;
  }

  return round(grossWin / grossLoss);
}

/**
 * Calculates average winning trade in currency.
 */
export function calculateAvgWin(trades: Trade[]): number {
  const wins = trades.filter((t) => t.pnl > 0.0001);
  if (wins.length === 0) return 0;
  const sum = wins.reduce((acc, t) => acc + t.pnl, 0);
  return round(sum / wins.length);
}

/**
 * Calculates average losing trade (positive absolute value).
 */
export function calculateAvgLoss(trades: Trade[]): number {
  const losses = trades.filter((t) => t.pnl < -0.0001);
  if (losses.length === 0) return 0;
  const sum = losses.reduce((acc, t) => acc + Math.abs(t.pnl), 0);
  return round(sum / losses.length);
}

/**
 * Calculates expectancy per trade:
 * (WinRateDecimal * AvgWin) - ((1 - WinRateDecimal) * AvgLoss)
 */
export function calculateExpectancy(trades: Trade[]): number {
  const { wins, losses } = calculateWinLossBreakeven(trades);
  const decisive = wins + losses;
  if (decisive === 0) return 0;

  const winRateDec = wins / decisive;
  const lossRateDec = losses / decisive;
  const avgWin = calculateAvgWin(trades);
  const avgLoss = calculateAvgLoss(trades);

  return round(winRateDec * avgWin - lossRateDec * avgLoss);
}

/**
 * Builds equity curve points and computes maximum dollar and percentage drawdowns.
 * Trades should be sorted chronologically by closedAt ascending.
 */
export function calculateDrawdowns(
  initialDeposit: number,
  trades: Trade[]
): {
  maxDrawdownAmount: number;
  maxDrawdownPercent: number;
  equityCurve: EquityPoint[];
} {
  const sorted = [...trades].sort((a, b) => {
    return new Date(a.closedAt).getTime() - new Date(b.closedAt).getTime();
  });

  const equityCurve: EquityPoint[] = [];
  let currentEquity = initialDeposit;
  let runningPeak = initialDeposit;
  let maxDrawdownAmount = 0;
  let maxDrawdownPercent = 0;

  // Add initial baseline point
  equityCurve.push({
    index: 0,
    date: sorted.length > 0 ? sorted[0].openedAt : new Date().toISOString(),
    instrument: 'Initial Deposit',
    pnl: 0,
    equity: initialDeposit,
    peak: initialDeposit,
    drawdownAmount: 0,
    drawdownPercent: 0,
  });

  sorted.forEach((t, i) => {
    currentEquity = round(currentEquity + t.pnl);
    if (currentEquity > runningPeak) {
      runningPeak = currentEquity;
    }

    const drawdownAmount = round(runningPeak - currentEquity);
    const drawdownPercent = runningPeak > 0 ? round((drawdownAmount / runningPeak) * 100) : 0;

    if (drawdownAmount > maxDrawdownAmount) {
      maxDrawdownAmount = drawdownAmount;
    }
    if (drawdownPercent > maxDrawdownPercent) {
      maxDrawdownPercent = drawdownPercent;
    }

    equityCurve.push({
      index: i + 1,
      date: t.closedAt,
      dealId: t.dealId,
      instrument: t.instrument,
      pnl: t.pnl,
      equity: currentEquity,
      peak: runningPeak,
      drawdownAmount,
      drawdownPercent,
    });
  });

  return {
    maxDrawdownAmount,
    maxDrawdownPercent,
    equityCurve,
  };
}

/**
 * Computes the current streak (consecutive wins, losses, or breakeven)
 * ending at the most recent trade.
 */
export function calculateCurrentStreak(trades: Trade[]): {
  type: 'win' | 'loss' | 'breakeven' | 'none';
  count: number;
} {
  if (trades.length === 0) {
    return { type: 'none', count: 0 };
  }

  // Sort newest first
  const sorted = [...trades].sort(
    (a, b) => new Date(b.closedAt).getTime() - new Date(a.closedAt).getTime()
  );

  const firstTrade = sorted[0];
  let currentType: 'win' | 'loss' | 'breakeven';
  if (firstTrade.pnl > 0.0001) currentType = 'win';
  else if (firstTrade.pnl < -0.0001) currentType = 'loss';
  else currentType = 'breakeven';

  let count = 0;
  for (const t of sorted) {
    let tType: 'win' | 'loss' | 'breakeven';
    if (t.pnl > 0.0001) tType = 'win';
    else if (t.pnl < -0.0001) tType = 'loss';
    else tType = 'breakeven';

    if (tType === currentType) {
      count++;
    } else {
      break;
    }
  }

  return { type: currentType, count };
}

/**
 * Calculates instrument breakdown and identifies best/worst performers by net P&L.
 */
export function calculateInstrumentPerformance(trades: Trade[]): {
  best: { symbol: string; pnl: number } | null;
  worst: { symbol: string; pnl: number } | null;
  byInstrument: Array<{ symbol: string; pnl: number; trades: number; winRate: number }>;
} {
  if (trades.length === 0) {
    return { best: null, worst: null, byInstrument: [] };
  }

  const map: Record<string, { pnl: number; trades: Trade[] }> = {};
  for (const t of trades) {
    const sym = t.instrument || 'Unknown';
    if (!map[sym]) {
      map[sym] = { pnl: 0, trades: [] };
    }
    map[sym].pnl += t.pnl;
    map[sym].trades.push(t);
  }

  const list = Object.entries(map).map(([symbol, data]) => ({
    symbol,
    pnl: round(data.pnl),
    trades: data.trades.length,
    winRate: calculateWinRate(data.trades),
  }));

  list.sort((a, b) => b.pnl - a.pnl);

  const best = list.length > 0 ? { symbol: list[0].symbol, pnl: list[0].pnl } : null;
  const worst =
    list.length > 0
      ? { symbol: list[list.length - 1].symbol, pnl: list[list.length - 1].pnl }
      : null;

  return { best, worst, byInstrument: list };
}

/**
 * Day of week performance (Monday through Sunday).
 */
export function calculateDayOfWeekPerformance(
  trades: Trade[]
): Array<{ day: string; pnl: number; trades: number; winRate: number }> {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayBuckets: Record<string, Trade[]> = {};
  for (const d of days) {
    dayBuckets[d] = [];
  }

  for (const t of trades) {
    const date = new Date(t.closedAt);
    if (!isNaN(date.getTime())) {
      const dayName = days[date.getDay()];
      dayBuckets[dayName].push(t);
    }
  }

  // Order Monday through Friday first, then weekend
  const orderedDays = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];
  return orderedDays.map((day) => {
    const bucketTrades = dayBuckets[day];
    return {
      day,
      pnl: calculateNetPnl(bucketTrades),
      trades: bucketTrades.length,
      winRate: calculateWinRate(bucketTrades),
    };
  });
}

/**
 * Hourly distribution (0 - 23) based on trade closed time.
 */
export function calculateHourlyDistribution(
  trades: Trade[]
): Array<{ hour: number; pnl: number; trades: number }> {
  const hours = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    pnl: 0,
    trades: 0,
  }));

  for (const t of trades) {
    const date = new Date(t.closedAt);
    if (!isNaN(date.getTime())) {
      const h = date.getHours();
      hours[h].trades++;
      hours[h].pnl = round(hours[h].pnl + t.pnl);
    }
  }

  return hours;
}

/**
 * Helper to get group key based on date string.
 */
export function getGroupKey(dateStr: string, groupBy: GroupByOption): string {
  if (groupBy === 'none') return 'all';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'Unknown';

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  if (groupBy === 'day') {
    return `${year}-${month}-${day}`;
  }

  if (groupBy === 'month') {
    return `${year}-${month}`;
  }

  if (groupBy === 'week') {
    // ISO week number
    const target = new Date(d.valueOf());
    const dayNr = (d.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) {
      target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
    }
    const weekNum = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
    return `${year}-W${String(weekNum).padStart(2, '0')}`;
  }

  return 'all';
}

/**
 * Groups trades and calculates aggregate stats for each group header row.
 */
export function calculateGroupSummaries(
  trades: Trade[],
  groupBy: GroupByOption
): Record<string, GroupSummary> {
  const groups: Record<string, Trade[]> = {};

  for (const t of trades) {
    const key = getGroupKey(t.closedAt, groupBy);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(t);
  }

  const summaries: Record<string, GroupSummary> = {};
  for (const [key, groupTrades] of Object.entries(groups)) {
    const { wins, losses, breakeven, total } = calculateWinLossBreakeven(groupTrades);
    const netPnl = calculateNetPnl(groupTrades);
    const winRate = calculateWinRate(groupTrades);
    const breakevenRate = calculateBreakevenRate(groupTrades);
    const profitFactor = calculateProfitFactor(groupTrades);
    const totalMargin = round(groupTrades.reduce((acc, t) => acc + (t.margin || 0), 0));
    const grossReturn = round(groupTrades.reduce((acc, t) => acc + (t.grossReturn || 0), 0));

    summaries[key] = {
      groupKey: key,
      tradeCount: total,
      netPnl,
      winCount: wins,
      lossCount: losses,
      breakevenCount: breakeven,
      winRate,
      breakevenRate,
      profitFactor,
      totalMargin,
      grossReturn,
    };
  }

  return summaries;
}

/**
 * Calculates complete streak analytics including max streaks, average lengths, and consistency ratio.
 */
export function calculateStreakAnalysis(trades: Trade[]): StreakAnalysis {
  if (trades.length === 0) {
    return {
      maxWinStreak: 0,
      maxLossStreak: 0,
      currentStreak: { type: 'none', count: 0 },
      avgWinStreak: 0,
      avgLossStreak: 0,
      streakRatio: 0,
    };
  }

  // Sort chronologically ascending (oldest first)
  const sorted = [...trades].sort(
    (a, b) => new Date(a.closedAt).getTime() - new Date(b.closedAt).getTime()
  );

  const winStreaks: number[] = [];
  const lossStreaks: number[] = [];

  let currentRunType: 'win' | 'loss' | 'breakeven' | null = null;
  let currentRunCount = 0;

  for (const t of sorted) {
    let tType: 'win' | 'loss' | 'breakeven';
    if (t.pnl > 0.0001) tType = 'win';
    else if (t.pnl < -0.0001) tType = 'loss';
    else tType = 'breakeven';

    if (tType === currentRunType) {
      currentRunCount++;
    } else {
      if (currentRunType === 'win' && currentRunCount > 0) {
        winStreaks.push(currentRunCount);
      } else if (currentRunType === 'loss' && currentRunCount > 0) {
        lossStreaks.push(currentRunCount);
      }
      currentRunType = tType;
      currentRunCount = 1;
    }
  }

  // push trailing run
  if (currentRunType === 'win' && currentRunCount > 0) {
    winStreaks.push(currentRunCount);
  } else if (currentRunType === 'loss' && currentRunCount > 0) {
    lossStreaks.push(currentRunCount);
  }

  const maxWinStreak = winStreaks.length > 0 ? Math.max(...winStreaks) : 0;
  const maxLossStreak = lossStreaks.length > 0 ? Math.max(...lossStreaks) : 0;

  const avgWinStreak =
    winStreaks.length > 0
      ? round(winStreaks.reduce((a, b) => a + b, 0) / winStreaks.length, 1)
      : 0;

  const avgLossStreak =
    lossStreaks.length > 0
      ? round(lossStreaks.reduce((a, b) => a + b, 0) / lossStreaks.length, 1)
      : 0;

  let streakRatio = 0;
  if (avgLossStreak > 0) {
    streakRatio = round(avgWinStreak / avgLossStreak, 2);
  } else if (avgWinStreak > 0) {
    streakRatio = avgWinStreak;
  }

  const currentStreak = calculateCurrentStreak(trades);

  return {
    maxWinStreak,
    maxLossStreak,
    currentStreak,
    avgWinStreak,
    avgLossStreak,
    streakRatio,
  };
}

/**
 * Calculates instrument breakdown with cumulative sparkline data and profit share.
 */
export function calculateInstrumentBreakdown(trades: Trade[]): InstrumentSummary[] {
  if (trades.length === 0) return [];

  // Sort trades chronologically
  const sorted = [...trades].sort(
    (a, b) => new Date(a.closedAt).getTime() - new Date(b.closedAt).getTime()
  );

  const totalGrossWin = trades
    .filter((t) => t.pnl > 0)
    .reduce((sum, t) => sum + t.pnl, 0);

  const map: Record<string, Trade[]> = {};
  for (const t of sorted) {
    const sym = t.instrument || 'Unknown';
    if (!map[sym]) {
      map[sym] = [];
    }
    map[sym].push(t);
  }

  const result: InstrumentSummary[] = Object.entries(map).map(([symbol, instTrades]) => {
    const count = instTrades.length;
    const netPnl = calculateNetPnl(instTrades);
    const winRate = calculateWinRate(instTrades);
    const avgPnl = count > 0 ? round(netPnl / count) : 0;

    const instGrossWin = instTrades
      .filter((t) => t.pnl > 0)
      .reduce((sum, t) => sum + t.pnl, 0);

    const sharePercent =
      totalGrossWin > 0 ? round((instGrossWin / totalGrossWin) * 100, 1) : 0;

    // Cumulative sparkline points starting at 0
    let running = 0;
    const sparkline: number[] = [0];
    for (const t of instTrades) {
      running = round(running + t.pnl);
      sparkline.push(running);
    }

    return {
      symbol,
      trades: count,
      winRate,
      netPnl,
      avgPnl,
      sharePercent,
      sparkline,
    };
  });

  return result.sort((a, b) => b.netPnl - a.netPnl);
}

/**
 * Calculates monthly performance table / heatmap (Year x Month).
 */
export function calculateMonthlyReturns(trades: Trade[]): YearMonthlyReturns[] {
  if (trades.length === 0) return [];

  const yearMap: Record<number, Record<number, Trade[]>> = {};

  for (const t of trades) {
    const d = new Date(t.closedAt);
    if (isNaN(d.getTime())) continue;
    const year = d.getFullYear();
    const month = d.getMonth() + 1; // 1-12

    if (!yearMap[year]) {
      yearMap[year] = {};
    }
    if (!yearMap[year][month]) {
      yearMap[year][month] = [];
    }
    yearMap[year][month].push(t);
  }

  const years = Object.keys(yearMap)
    .map(Number)
    .sort((a, b) => b - a);

  return years.map((year) => {
    const monthsData: Record<number, MonthlyReturnItem> = {};
    let yearTrades: Trade[] = [];

    for (let m = 1; m <= 12; m++) {
      const monthTrades = yearMap[year][m] || [];
      yearTrades = yearTrades.concat(monthTrades);
      monthsData[m] = {
        month: m,
        pnl: calculateNetPnl(monthTrades),
        trades: monthTrades.length,
        winRate: calculateWinRate(monthTrades),
      };
    }

    return {
      year,
      months: monthsData,
      totalPnl: calculateNetPnl(yearTrades),
      totalTrades: yearTrades.length,
      winRate: calculateWinRate(yearTrades),
    };
  });
}

/**
 * Generates automated bullet insights for the selected period.
 */
export function generatePeriodInsights(
  trades: Trade[],
  instrumentBreakdown: InstrumentSummary[],
  streakAnalysis: StreakAnalysis,
  metrics: { profitFactor: number; winRate: number; maxDrawdownPercent: number }
): PeriodInsight[] {
  if (trades.length === 0) return [];

  const insights: PeriodInsight[] = [];

  // 1. Top asset contribution
  if (instrumentBreakdown.length > 0) {
    const topAsset = instrumentBreakdown[0];
    if (topAsset.netPnl > 0 && topAsset.sharePercent > 0) {
      insights.push({
        id: 'top-asset-share',
        type: 'highlight',
        text: `${topAsset.symbol} contributed ${topAsset.sharePercent}% of gross profit (+${topAsset.netPnl >= 0 ? topAsset.netPnl.toFixed(2) : topAsset.netPnl})`,
      });
    }
  }

  // 2. Current streak
  if (streakAnalysis.currentStreak.count >= 2) {
    const isWin = streakAnalysis.currentStreak.type === 'win';
    insights.push({
      id: 'current-streak',
      type: isWin ? 'positive' : 'negative',
      text: `Current streak: ${streakAnalysis.currentStreak.count} consecutive ${isWin ? 'winning' : 'losing'} trades`,
    });
  } else if (streakAnalysis.maxWinStreak >= 3) {
    insights.push({
      id: 'max-win-streak',
      type: 'positive',
      text: `Best streak: ${streakAnalysis.maxWinStreak} consecutive winning trades in this period`,
    });
  }

  // 3. Profit Factor / Efficiency
  if (metrics.profitFactor >= 2.0 && metrics.profitFactor !== Infinity) {
    insights.push({
      id: 'profit-factor',
      type: 'positive',
      text: `Outstanding profit factor of ${metrics.profitFactor.toFixed(2)} demonstrates high edge`,
    });
  } else if (metrics.profitFactor === Infinity && trades.length >= 3) {
    insights.push({
      id: 'zero-losses',
      type: 'positive',
      text: `Flawless execution: 0 losing trades across ${trades.length} closed deals`,
    });
  }

  // 4. Drawdown control
  if (metrics.maxDrawdownPercent < 5 && trades.length >= 5) {
    insights.push({
      id: 'drawdown-control',
      type: 'info',
      text: `Capital preservation: max drawdown kept under ${metrics.maxDrawdownPercent}%`,
    });
  }

  return insights;
}

/**
 * Calculates trade holding duration from openedAt to closedAt.
 */
export function calculateDuration(
  openedAt?: string | null,
  closedAt?: string | null
): { formatted: string; ms: number } {
  if (!openedAt || !closedAt) {
    return { formatted: '—', ms: 0 };
  }

  const tOpen = new Date(openedAt).getTime();
  const tClose = new Date(closedAt).getTime();

  if (isNaN(tOpen) || isNaN(tClose) || tClose < tOpen) {
    return { formatted: '—', ms: 0 };
  }

  const diffMs = tClose - tOpen;
  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return { formatted: `${days}d ${hours}h`, ms: diffMs };
  }
  if (hours > 0) {
    return { formatted: `${hours}h ${minutes}m`, ms: diffMs };
  }
  if (minutes > 0) {
    return { formatted: `${minutes}m`, ms: diffMs };
  }
  return { formatted: `${seconds}s`, ms: diffMs };
}

/**
 * Calculates complete dashboard analytics.
 */
export function calculateAnalytics(initialDeposit: number, trades: Trade[]): JournalAnalytics {
  const { wins, losses, breakeven, total } = calculateWinLossBreakeven(trades);
  const netPnl = calculateNetPnl(trades);
  const currentDeposit = calculateCurrentDeposit(initialDeposit, trades);
  const roiPercent = calculateRoi(initialDeposit, netPnl);
  const winRate = calculateWinRate(trades);
  const breakevenRate = calculateBreakevenRate(trades);
  const profitFactor = calculateProfitFactor(trades);
  const avgWin = calculateAvgWin(trades);
  const avgLoss = calculateAvgLoss(trades);
  const expectancy = calculateExpectancy(trades);
  const { maxDrawdownAmount, maxDrawdownPercent } = calculateDrawdowns(initialDeposit, trades);
  const currentStreak = calculateCurrentStreak(trades);
  const streakAnalysis = calculateStreakAnalysis(trades);
  const { best, worst } = calculateInstrumentPerformance(trades);
  const instrumentBreakdown = calculateInstrumentBreakdown(trades);
  const monthlyReturns = calculateMonthlyReturns(trades);
  const dayOfWeekPerformance = calculateDayOfWeekPerformance(trades);
  const hourlyDistribution = calculateHourlyDistribution(trades);
  const insights = generatePeriodInsights(trades, instrumentBreakdown, streakAnalysis, {
    profitFactor,
    winRate,
    maxDrawdownPercent,
  });

  return {
    totalTrades: total,
    winningTrades: wins,
    losingTrades: losses,
    breakevenTrades: breakeven,
    breakevenRate,
    netPnl,
    currentDeposit,
    roiPercent,
    winRate,
    profitFactor,
    avgWin,
    avgLoss,
    expectancy,
    maxDrawdownAmount,
    maxDrawdownPercent,
    currentStreak,
    streakAnalysis,
    insights,
    instrumentBreakdown,
    monthlyReturns,
    bestInstrument: best,
    worstInstrument: worst,
    dayOfWeekPerformance,
    hourlyDistribution,
  };
}
