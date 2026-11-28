'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { customersApi } from '@/lib/api';
import { dashboardKeys } from '@/hooks/useDashboard';
import type { CustomerQuery } from '@/types/api';
import type { AccountStatus } from '@/types/customer';

export const customerKeys = {
  all: ['customers'] as const,
  list: (query: CustomerQuery) => ['customers', 'list', query] as const,
};

export const statsKey = ['admin-stats'] as const;

export function useCustomers(query: CustomerQuery, enabled = true) {
  return useQuery({
    queryKey: customerKeys.list(query),
    queryFn: ({ signal }) => customersApi.list(query, signal),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useAdminStats() {
  return useQuery({ queryKey: statsKey, queryFn: ({ signal }) => customersApi.stats(signal) });
}

export function useUpdateCustomerStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: AccountStatus }) => customersApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
      queryClient.invalidateQueries({ queryKey: statsKey });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.peopleGrowth });
    },
  });
}
