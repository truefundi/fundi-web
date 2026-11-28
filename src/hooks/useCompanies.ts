'use client';

import { useQuery } from '@tanstack/react-query';
import { companiesApi } from '@/lib/api';

export const companyKeys = {
  all: ['companies'] as const,
};

export function useCompanies(enabled = true) {
  return useQuery({
    queryKey: companyKeys.all,
    queryFn: companiesApi.list,
    enabled,
  });
}
