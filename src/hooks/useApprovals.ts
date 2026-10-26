'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { approvalsApi } from '@/lib/api';
import type { ApprovalActor, ApprovalStatus, CreateApprovalInput } from '@/types/approval';
import { statsKey } from './useCustomers';
import { technicianKeys } from './useTechnicians';
import { jobKeys } from './useJobs';
import { disputeKeys } from './useDisputes';

export const approvalKeys = {
  all: ['approvals'] as const,
  list: (status?: ApprovalStatus) => ['approvals', 'list', status ?? 'all'] as const,
};

export function useApprovalRequests(status?: ApprovalStatus) {
  return useQuery({
    queryKey: approvalKeys.list(status),
    queryFn: () => approvalsApi.list(status),
  });
}

function invalidateApprovalCaches(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: approvalKeys.all });
  queryClient.invalidateQueries({ queryKey: statsKey });
  queryClient.invalidateQueries({ queryKey: technicianKeys.all });
  queryClient.invalidateQueries({ queryKey: jobKeys.all });
  queryClient.invalidateQueries({ queryKey: disputeKeys.all });
  queryClient.invalidateQueries({ queryKey: ['customers'] });
  queryClient.invalidateQueries({ queryKey: ['users'] });
  queryClient.invalidateQueries({ queryKey: ['dashboard'] });
}

export function useCreateApproval() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ input, requester }: { input: CreateApprovalInput; requester: ApprovalActor }) =>
      approvalsApi.create(input, requester),
    onSuccess: () => invalidateApprovalCaches(queryClient),
  });
}

export function useReviewApproval() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
      notes,
      reviewer,
    }: {
      id: string;
      status: Exclude<ApprovalStatus, 'PENDING'>;
      notes?: string;
      reviewer: ApprovalActor;
    }) => approvalsApi.review(id, { status, notes }, reviewer),
    onSuccess: () => invalidateApprovalCaches(queryClient),
  });
}
