import React, { useMemo } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAppPreferences } from './hooks/useAppPreferences';
import { buildAppTheme } from './theme/theme';
import { TradingJournalPage } from './pages/TradingJournalPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

export const App: React.FC = () => {
  const { themeMode, systemColor } = useAppPreferences();

  const theme = useMemo(() => {
    return buildAppTheme(themeMode, systemColor);
  }, [themeMode, systemColor]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <TradingJournalPage />
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
