'use client';

import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api';

export const dashboardKeys = {
  peopleGrowth: ['dashboard', 'people-growth'] as const,
  jobSummary: ['dashboard', 'job-summary'] as const,
};

export function useJobSummary() {
  return useQuery({ queryKey: dashboardKeys.jobSummary, queryFn: dashboardApi.jobSummary });
}
