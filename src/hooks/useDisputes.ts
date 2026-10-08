'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { disputesApi } from '@/lib/api';
import type { DisputeDecision, DisputeState } from '@/lib/api/endpoints/disputes';
import { jobKeys } from './useJobs';

export const disputeKeys = {
  all: ['disputes'] as const,
  list: (state: DisputeState) => ['disputes', 'list', state] as const,
  detail: (jobId: string) => ['disputes', 'detail', jobId] as const,
};

export function useDisputes(state: DisputeState) {
  return useQuery({ queryKey: disputeKeys.list(state), queryFn: () => disputesApi.list(state) });
}

export function useDispute(jobId: string) {
  return useQuery({ queryKey: disputeKeys.detail(jobId), queryFn: () => disputesApi.get(jobId) });
}

export function useResolveDispute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ jobId, decision }: { jobId: string; decision: DisputeDecision }) =>
      disputesApi.resolve(jobId, decision),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: disputeKeys.all });
      queryClient.invalidateQueries({ queryKey: jobKeys.all });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
