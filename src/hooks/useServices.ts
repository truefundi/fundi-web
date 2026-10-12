'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { servicesApi } from '@/lib/api';
import type { ServiceInput } from '@/types/service';

export const serviceKeys = { all: ['services'] as const };

export function useServices() {
  return useQuery({ queryKey: serviceKeys.all, queryFn: servicesApi.list });
}

function useServiceMutation<TVars, TResult>(mutationFn: (vars: TVars) => Promise<TResult>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: serviceKeys.all }),
  });
}

export const useCreateService = () => useServiceMutation((input: ServiceInput) => servicesApi.create(input));

export const useUpdateService = () =>
  useServiceMutation(({ id, input }: { id: string; input: ServiceInput }) => servicesApi.update(id, input));

export const useDeleteService = () => useServiceMutation((id: string) => servicesApi.remove(id));
