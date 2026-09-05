import { createContext } from 'react';
import { ThemeMode, NumberFormatOption } from '../types/preferences';

export interface PreferencesContextValue {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  systemColor: 'light' | 'dark';
  numberFormat: NumberFormatOption;
  setNumberFormat: (format: NumberFormatOption) => void;
  currentLocale: string;
  setLocale: (locale: string) => void;
}

const defaultPreferences: PreferencesContextValue = {
  themeMode: 'dark',
  setThemeMode: () => {},
  systemColor: 'dark',
  numberFormat: 'locale',
  setNumberFormat: () => {},
  currentLocale: 'en',
  setLocale: () => {},
};

export const PreferencesContext = createContext<PreferencesContextValue>(defaultPreferences);
