import React, { useMemo } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { useAppPreferences } from './hooks/useAppPreferences';
import { buildAppTheme } from './theme/theme';
import { TradingJournalPage } from './pages/TradingJournalPage';

export const AppContent: React.FC = () => {
  const { themeMode, systemColor } = useAppPreferences();

  const theme = useMemo(() => {
    return buildAppTheme(themeMode, systemColor);
  }, [themeMode, systemColor]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <TradingJournalPage />
    </ThemeProvider>
  );
};
