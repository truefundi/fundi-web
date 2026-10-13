'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { jobsApi } from '@/lib/api';
import type { JobQuery } from '@/types/api';
import type { Job, JobEditInput, JobInput, JobParty } from '@/types/job';

export const jobKeys = {
  all: ['jobs'] as const,
  list: (query: JobQuery) => ['jobs', 'list', query] as const,
  detail: (id: string) => ['jobs', 'detail', id] as const,
  stats: ['jobs', 'stats'] as const,
};

export function useJobs(query: JobQuery) {
  return useQuery({ queryKey: jobKeys.list(query), queryFn: () => jobsApi.list(query), placeholderData: keepPreviousData });
}

export function usePaymentJobs() {
  return useQuery({
    queryKey: [...jobKeys.all, 'payments'],
    queryFn: async () => {
      const pageSize = 100;
      const firstPage = await jobsApi.list({ page: 1, pageSize });
      const actualPageSize = firstPage.pageSize || pageSize;
      const pageCount = Math.ceil(firstPage.total / actualPageSize);
      const remainingPages = await Promise.all(
        Array.from({ length: Math.max(0, pageCount - 1) }, (_, index) =>
          jobsApi.list({ page: index + 2, pageSize: actualPageSize }),
        ),
      );

      return [firstPage, ...remainingPages].flatMap((result) => result.items).slice(0, firstPage.total);
    },
  });
}

export function useJob(id: string) {
  return useQuery({ queryKey: jobKeys.detail(id), queryFn: () => jobsApi.get(id) });
}

export function useJobStats() {
  return useQuery({ queryKey: jobKeys.stats, queryFn: jobsApi.stats });
}

/** Shared onSuccess: write the fresh job into the detail cache and refresh lists and counts. */
function useJobMutation<TVars>(mutationFn: (vars: TVars) => Promise<Job>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (job) => {
      queryClient.setQueryData(jobKeys.detail(job.id), job);
      queryClient.invalidateQueries({ queryKey: jobKeys.all });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export const useCancelJob = () =>
  useJobMutation(({ id, reason }: { id: string; reason: string }) => jobsApi.cancel(id, reason));

export const useReassignJob = () =>
  useJobMutation(({ id, technician }: { id: string; technician: JobParty }) => jobsApi.reassign(id, technician));

export const useCreateJob = () => useJobMutation((input: JobInput) => jobsApi.create(input));

export const useUpdateJob = () =>
  useJobMutation(({ id, input }: { id: string; input: JobEditInput }) => jobsApi.update(id, input));

export function useDeleteJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => jobsApi.remove(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: jobKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: jobKeys.all });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
