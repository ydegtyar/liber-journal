import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PreferencesProvider } from './hooks/useAppPreferences';
import { AppContent } from './AppContent';
import { Analytics } from '@vercel/analytics/react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Analytics />
      <PreferencesProvider>
        <AppContent />
      </PreferencesProvider>
    </QueryClientProvider>
  );
};
