'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiError } from '@/lib/api/client';
import { ToastProvider } from '@/components/ui/Toast';
import { CommissionSettingsProvider } from '@/context/CommissionSettingsContext';
import { LandingAdsProvider } from '@/context/LandingAdsContext';
import { ThemeProvider } from '@/context/ThemeContext';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            // Timeouts/network blips get one retry; permanent client errors do not.
            retry: (failureCount, error) =>
              failureCount < 1 &&
              !(error instanceof ApiError && error.statusCode >= 400 && error.statusCode < 500),
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <CommissionSettingsProvider>
        <LandingAdsProvider>
          <ThemeProvider>
            <ToastProvider>{children}</ToastProvider>
          </ThemeProvider>
        </LandingAdsProvider>
      </CommissionSettingsProvider>
    </QueryClientProvider>
  );
}
