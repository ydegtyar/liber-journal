import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeMode, NumberFormatOption } from '../types/preferences';
import { useTranslation } from 'react-i18next';

const THEME_STORAGE_KEY = 'liber_journal_theme';
const NUMBER_FORMAT_STORAGE_KEY = 'liber_journal_number_format';

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

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { i18n } = useTranslation();

  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'dark';
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
    return saved && ['light', 'dark', 'midnight', 'unicorn', 'system'].includes(saved)
      ? saved
      : 'dark';
  });

  const [numberFormat, setNumberFormatState] = useState<NumberFormatOption>(() => {
    if (typeof window === 'undefined') return 'locale';
    const saved = localStorage.getItem(NUMBER_FORMAT_STORAGE_KEY) as NumberFormatOption | null;
    return saved && ['locale', 'dot', 'comma'].includes(saved) ? saved : 'locale';
  });

  const [systemColor, setSystemColor] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  });

  // Listen live for OS theme changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      setSystemColor(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {
      // ignore storage quota errors
    }
  };

  const setNumberFormat = (format: NumberFormatOption) => {
    setNumberFormatState(format);
    try {
      localStorage.setItem(NUMBER_FORMAT_STORAGE_KEY, format);
    } catch {
      // ignore storage quota errors
    }
  };

  const setLocale = (locale: string) => {
    i18n.changeLanguage(locale);
  };

  const value: PreferencesContextValue = {
    themeMode,
    setThemeMode,
    systemColor,
    numberFormat,
    setNumberFormat,
    currentLocale: i18n.language || 'en',
    setLocale,
  };

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
};

export function useAppPreferences(): PreferencesContextValue {
  return useContext(PreferencesContext);
}
