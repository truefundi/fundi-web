'use client';

import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api';

export const dashboardKeys = {
  peopleGrowth: ['dashboard', 'people-growth'] as const,
  jobSummary: ['dashboard', 'job-summary'] as const,
  jobPipeline: ['dashboard', 'job-pipeline'] as const,
};

export function useJobSummary() {
  return useQuery({ queryKey: dashboardKeys.jobSummary, queryFn: dashboardApi.jobSummary });
}

export function useJobPipeline() {
  return useQuery({ queryKey: dashboardKeys.jobPipeline, queryFn: dashboardApi.jobPipeline });
}
