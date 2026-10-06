'use client';

import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api';

export const dashboardKeys = {
  jobSummary: ['dashboard', 'job-summary'] as const,
};

export function useJobSummary() {
  return useQuery({ queryKey: dashboardKeys.jobSummary, queryFn: dashboardApi.jobSummary });
}
