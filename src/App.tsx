import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PreferencesProvider } from './hooks/useAppPreferences';
import { AppContent } from './AppContent';
import { Analytics } from '@vercel/analytics/react';

// Lazy loading the Info presentation page for ultra-fast startup and code-splitting
const InfoPage = lazy(() => import('./pages/InfoPage'));

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
        <BrowserRouter>
          <Routes>
            <Route
              path="/info"
              element={
                <Suspense
                  fallback={
                    <div
                      style={{
                        minHeight: '100vh',
                        backgroundColor: '#000000',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#38bdf8',
                        fontFamily: 'monospace',
                        fontSize: '0.875rem',
                      }}
                    >
                      Loading Liber Journal Presentation...
                    </div>
                  }
                >
                  <InfoPage />
                </Suspense>
              }
            />
            <Route path="*" element={<AppContent />} />
          </Routes>
        </BrowserRouter>
      </PreferencesProvider>
    </QueryClientProvider>
  );
};
