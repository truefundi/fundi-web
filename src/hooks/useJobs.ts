'use client';

import { useCallback } from 'react';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { jobsApi } from '@/lib/api';
import { jobListItemToJob } from '@/lib/api/adapters/jobs';
import type { JobQuery, PaginatedResponse } from '@/types/api';
import type {
  Job,
  JobEditInput,
  JobInput,
  JobListItem,
  JobParty,
} from '@/types/job';

export const jobKeys = {
  all: ['jobs'] as const,
  list: (query: JobQuery) => ['jobs', 'list', query] as const,
  detail: (id: string) => ['jobs', 'detail', id] as const,
  stats: ['jobs', 'stats'] as const,
};

export function useJobs(query: JobQuery) {
  return useQuery({
    queryKey: jobKeys.list(query),
    queryFn: ({ signal }) => jobsApi.list(query, signal),
    placeholderData: keepPreviousData,
  });
}

export function useRatedJobs() {
  return useQuery({
    queryKey: [...jobKeys.all, 'ratings'],
    queryFn: ({ signal }) => jobsApi.rated(signal),
  });
}

export function useJob(id: string) {
  const queryClient = useQueryClient();
  return useQuery<Job>({
    queryKey: jobKeys.detail(id),
    queryFn: ({ signal }) => jobsApi.get(id, signal),
    // Paint the row we already fetched, then replace it with the full record.
    placeholderData: () => {
      const cached = queryClient.getQueriesData<PaginatedResponse<JobListItem>>({
        queryKey: ['jobs', 'list'],
      });
      for (const [, page] of cached) {
        const item = page?.items.find((row) => row.id === id);
        if (item) return jobListItemToJob(item);
      }
      return undefined;
    },
    staleTime: 30_000,
  });
}

export function usePrefetchJob() {
  const queryClient = useQueryClient();
  return useCallback(
    (id: string) => {
      void queryClient.prefetchQuery({
        queryKey: jobKeys.detail(id),
        queryFn: ({ signal }) => jobsApi.get(id, signal),
        staleTime: 30_000,
      });
    },
    [queryClient],
  );
}

export function useJobStats() {
  return useQuery({
    queryKey: jobKeys.stats,
    queryFn: ({ signal }) => jobsApi.stats(signal),
    placeholderData: keepPreviousData,
  });
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
      queryClient.invalidateQueries({ queryKey: ['payments'] });
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
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });
}


