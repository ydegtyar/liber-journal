import { GroupByOption, SortOrder } from './trade';

export type Locale = 'en' | 'uk';

export type ThemeMode = 'light' | 'dark' | 'midnight' | 'unicorn' | 'system';

export type NumberFormatOption = 'locale' | 'dot' | 'comma';

export type MatrixColumnBlockId = 'date' | 'ordersCount' | 'dailyPnl' | 'orders';

export const DEFAULT_MATRIX_COLUMN_ORDER: MatrixColumnBlockId[] = [
  'date',
  'ordersCount',
  'dailyPnl',
  'orders',
];

export type PageBlockId =
  | 'timeframeBanner'
  | 'statsGrid'
  | 'periodInsights'
  | 'visualizations'
  | 'streakAnalysis'
  | 'instrumentsTable'
  | 'monthlyReturns'
  | 'tradesView';

export const DEFAULT_PAGE_BLOCK_ORDER: PageBlockId[] = [
  'timeframeBanner',
  'statsGrid',
  'periodInsights',
  'visualizations',
  'streakAnalysis',
  'instrumentsTable',
  'monthlyReturns',
  'tradesView',
];

export interface JournalSettings {
  initialDeposit: number;
  depositAsOf: string;
  currency: string;
  sortOrder: SortOrder;
  groupBy: GroupByOption;
  numberFormat: NumberFormatOption;
  monthlyGoal?: number;
  matrixColumnOrder?: MatrixColumnBlockId[];
  pageBlockOrder?: PageBlockId[];
  hiddenPageBlocks?: PageBlockId[];
}

export const DEFAULT_JOURNAL_SETTINGS: JournalSettings = {
  initialDeposit: 1000,
  depositAsOf: new Date().toISOString().split('T')[0],
  currency: 'USD',
  sortOrder: 'asc',
  groupBy: 'none',
  numberFormat: 'locale',
  monthlyGoal: 0,
  matrixColumnOrder: DEFAULT_MATRIX_COLUMN_ORDER,
  pageBlockOrder: DEFAULT_PAGE_BLOCK_ORDER,
  hiddenPageBlocks: [],
};
