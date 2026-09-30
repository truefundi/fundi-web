'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { techniciansApi } from '@/lib/api';
import type { TechnicianQuery } from '@/types/api';
import type { AccountStatus } from '@/types/customer';
import type { Technician, TechnicianProfilePatch } from '@/types/technician';
import { statsKey } from './useCustomers';

export const technicianKeys = {
  all: ['technicians'] as const,
  list: (query: TechnicianQuery) => ['technicians', 'list', query] as const,
  detail: (id: string) => ['technicians', 'detail', id] as const,
};

export function useTechnicians(query: TechnicianQuery) {
  return useQuery({
    queryKey: technicianKeys.list(query),
    queryFn: () => techniciansApi.list(query),
    placeholderData: keepPreviousData,
  });
}

export function useTechnician(id: string) {
  return useQuery({ queryKey: technicianKeys.detail(id), queryFn: () => techniciansApi.get(id) });
}

/** Shared onSuccess: write the fresh record into the detail cache and refresh lists/stats. */
function useTechnicianMutation<TVars>(mutationFn: (vars: TVars) => Promise<Technician>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (technician) => {
      queryClient.setQueryData(technicianKeys.detail(technician.id), technician);
      queryClient.invalidateQueries({ queryKey: technicianKeys.all });
      queryClient.invalidateQueries({ queryKey: statsKey });
    },
  });
}

export const useUpdateTechnician = () =>
  useTechnicianMutation(({ id, patch }: { id: string; patch: TechnicianProfilePatch }) =>
    techniciansApi.update(id, patch),
  );

export const useUpdateTechnicianStatus = () =>
  useTechnicianMutation(({ id, status }: { id: string; status: AccountStatus }) =>
    techniciansApi.updateStatus(id, status),
  );

export const useApproveVerification = () => useTechnicianMutation((id: string) => techniciansApi.approve(id));

export const useRejectVerification = () =>
  useTechnicianMutation(({ id, reason }: { id: string; reason: string }) => techniciansApi.reject(id, reason));
