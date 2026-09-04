export type Direction = 'buy' | 'sell';

export type TradingSession = 'asian' | 'london' | 'new_york' | 'other';

export type GroupByOption = 'none' | 'day' | 'week' | 'month';

export type SortOrder = 'asc' | 'desc';

export interface Trade {
  id: string;                       // Unique internal ID (dealId or uuid v4)
  dealId?: string;                  // Original broker deal ID
  instrument: string;               // e.g. "EUR/USD", "Natural Gas Cash"
  direction: Direction;             // "buy" | "sell"
  openedAt: string;                 // ISO 8601 string
  closedAt: string;                 // ISO 8601 string
  openPrice: number;
  closePrice: number;
  margin: number;                   // Collateral / trade size in currency
  leverage: number;                 // Numeric multiplier (e.g. 50)
  grossReturn: number;              // Returned funds (margin + pnl)
  pnl: number;                      // Signed net profit/loss
  tag?: string;                     // Setup / strategy label (e.g. "Breakout", "Pullback")
  session?: TradingSession;         // Auto-derived or manual session
  note?: string;                    // Freeform reflection / execution notes
  plannedRisk?: number;             // Optional planned risk ($) for R-multiple
}

export interface AccountMetadata {
  accountNumber?: string;
  accountHolder?: string;
  currency: string;                 // e.g. "USD", "EUR"
  reportDate?: string;
}

export interface GroupSummary {
  groupKey: string;                 // Formatted date / week / month label
  tradeCount: number;
  netPnl: number;
  winCount: number;
  lossCount: number;
  breakevenCount: number;
  winRate: number;                  // Excludes BE: winCount / (winCount + lossCount) * 100
  breakevenRate: number;            // breakevenCount / tradeCount * 100
  profitFactor: number;
  totalMargin: number;
  grossReturn: number;
}

export interface StreakAnalysis {
  maxWinStreak: number;
  maxLossStreak: number;
  currentStreak: {
    type: 'win' | 'loss' | 'breakeven' | 'none';
    count: number;
  };
  avgWinStreak: number;
  avgLossStreak: number;
  streakRatio: number;
}

export interface PeriodInsight {
  id: string;
  type: 'positive' | 'negative' | 'info' | 'highlight';
  text: string;
}

export interface InstrumentSummary {
  symbol: string;
  trades: number;
  winRate: number;
  netPnl: number;
  avgPnl: number;
  sharePercent: number;
  sparkline: number[];
}

export interface MonthlyReturnItem {
  month: number;
  pnl: number;
  trades: number;
  winRate: number;
}

export interface YearMonthlyReturns {
  year: number;
  months: Record<number, MonthlyReturnItem>;
  totalPnl: number;
  totalTrades: number;
  winRate: number;
}

export type TimeframeOption = '1D' | '7D' | '30D' | 'WTD' | 'MTD' | 'YTD' | 'ALL' | 'CUSTOM';

export interface TimeframeFilter {
  mode: TimeframeOption;
  startDate?: string;
  endDate?: string;
}

export interface JournalAnalytics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakevenTrades: number;          // Explicit BE count
  breakevenRate: number;            // BE % of total trades
  netPnl: number;
  currentDeposit: number;
  roiPercent: number;
  winRate: number;                  // Excludes BE from denominator: wins / (wins + losses) * 100
  profitFactor: number;             // Ratio: sum(wins) / abs(sum(losses))
  avgWin: number;
  avgLoss: number;
  expectancy: number;               // Expected dollar return per decisive trade
  maxDrawdownAmount: number;        // Peak-to-trough drop ($)
  maxDrawdownPercent: number;       // Peak-to-trough drop (%)
  currentStreak: {
    type: 'win' | 'loss' | 'breakeven' | 'none';
    count: number;
  };
  streakAnalysis: StreakAnalysis;
  insights: PeriodInsight[];
  instrumentBreakdown: InstrumentSummary[];
  monthlyReturns: YearMonthlyReturns[];
  bestInstrument: { symbol: string; pnl: number } | null;
  worstInstrument: { symbol: string; pnl: number } | null;
  dayOfWeekPerformance: Array<{ day: string; pnl: number; trades: number; winRate: number }>;
  hourlyDistribution: Array<{ hour: number; pnl: number; trades: number }>;
}

export interface EquityPoint {
  index: number;
  date: string;
  dealId?: string;
  instrument: string;
  pnl: number;
  equity: number;
  peak: number;
  drawdownAmount: number;
  drawdownPercent: number;
}

