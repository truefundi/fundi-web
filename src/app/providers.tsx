'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '@/components/ui/Toast';
import { CommissionSettingsProvider } from '@/context/CommissionSettingsContext';
import { LandingAdsProvider } from '@/context/LandingAdsContext';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <CommissionSettingsProvider>
        <LandingAdsProvider>
          <ToastProvider>{children}</ToastProvider>
        </LandingAdsProvider>
      </CommissionSettingsProvider>
    </QueryClientProvider>
  );
}
