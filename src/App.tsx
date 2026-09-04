import React, { useMemo } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PreferencesProvider, useAppPreferences } from './hooks/useAppPreferences';
import { buildAppTheme } from './theme/theme';
import { TradingJournalPage } from './pages/TradingJournalPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

const AppContent: React.FC = () => {
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

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <PreferencesProvider>
        <AppContent />
      </PreferencesProvider>
    </QueryClientProvider>
  );
};

export default App;
