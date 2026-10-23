'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { env } from '@/config/env';
import { broadcastsApi } from '@/lib/api';
import type { BroadcastInput } from '@/types/broadcast';

const broadcastKeys = {
  all: ['broadcasts'] as const,
  preview: (roles: string[]) => ['broadcasts', 'preview', roles] as const,
};

export function useBroadcasts() {
  return useQuery({ queryKey: broadcastKeys.all, queryFn: broadcastsApi.list, enabled: env.useMocks });
}

export function useBroadcastPreview(roles: BroadcastInput['audience']['roles']) {
  return useQuery({
    queryKey: broadcastKeys.preview(roles),
    queryFn: () => broadcastsApi.preview({ roles, status: 'active' }),
    enabled: env.useMocks && roles.length > 0,
  });
}

export function useSendBroadcast() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: BroadcastInput) => broadcastsApi.send(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: broadcastKeys.all });
      await queryClient.invalidateQueries({ queryKey: ['broadcasts', 'preview'] });
    },
  });
}
