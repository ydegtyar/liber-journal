import { GroupByOption, SortOrder } from './trade';

export type Locale = 'en' | 'ru' | 'uk';

export type ThemeMode = 'light' | 'dark' | 'midnight' | 'unicorn' | 'system';

export type NumberFormatOption = 'locale' | 'dot' | 'comma';

export interface JournalSettings {
  initialDeposit: number;
  depositAsOf: string;
  currency: string;
  sortOrder: SortOrder;
  groupBy: GroupByOption;
  numberFormat: NumberFormatOption;
}

export interface AppPreferences {
  locale: Locale;
  themeMode: ThemeMode;
}

export const DEFAULT_JOURNAL_SETTINGS: JournalSettings = {
  initialDeposit: 1000,
  depositAsOf: new Date().toISOString().split('T')[0],
  currency: 'USD',
  sortOrder: 'asc',
  groupBy: 'none',
  numberFormat: 'locale',
};

export const DEFAULT_APP_PREFERENCES: AppPreferences = {
  locale: 'en',
  themeMode: 'dark',
};
