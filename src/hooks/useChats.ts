'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { chatsApi } from '@/lib/api';
import type { ConversationQuery } from '@/types/chat';

export const chatKeys = {
  all: ['chats'] as const,
  list: (query: ConversationQuery, adminId?: string) => ['chats', 'list', query, adminId] as const,
  detail: (id: string, adminId?: string) => ['chats', 'detail', id, adminId] as const,
};

export function useChats(query: ConversationQuery) {
  const { user } = useAuth();
  return useQuery({
    queryKey: chatKeys.list(query, user?.id),
    queryFn: () => chatsApi.list(query, user?.id),
    placeholderData: keepPreviousData,
  });
}

export function useChat(id: string) {
  const { user } = useAuth();
  return useQuery({ queryKey: chatKeys.detail(id, user?.id), queryFn: () => chatsApi.get(id, user?.id) });
}

export function useSendChatMessage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) => {
      if (!user) throw new Error('Sign in again to continue.');
      return chatsApi.sendMessage(id, text, user.id, user.email);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: chatKeys.all }),
  });
}

export function useJoinChat() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      if (!user) throw new Error('Sign in again to continue.');
      return chatsApi.join(id, user.id);
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: chatKeys.all });
      queryClient.invalidateQueries({ queryKey: ['chats', 'detail', id] });
    },
  });
}

export function useLeaveChat() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      if (!user) throw new Error('Sign in again to continue.');
      return chatsApi.leave(id, user.id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: chatKeys.all }),
  });
}
