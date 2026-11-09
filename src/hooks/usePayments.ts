'use client';

import { useQuery } from '@tanstack/react-query';
import { paymentsApi } from '@/lib/api';

export const paymentKeys = {
  all: ['payments'] as const,
  list: ['payments', 'list'] as const,
};

export function usePayments() {
  return useQuery({
    queryKey: paymentKeys.list,
    queryFn: paymentsApi.list,
  });
}