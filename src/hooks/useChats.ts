'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { chatsApi } from '@/lib/api';
import type { ConversationQuery } from '@/types/chat';

export const chatKeys = {
  list: (query: ConversationQuery) => ['chats', 'list', query] as const,
  detail: (id: string) => ['chats', 'detail', id] as const,
};

export function useChats(query: ConversationQuery) {
  return useQuery({ queryKey: chatKeys.list(query), queryFn: () => chatsApi.list(query), placeholderData: keepPreviousData });
}

export function useChat(id: string) {
  return useQuery({ queryKey: chatKeys.detail(id), queryFn: () => chatsApi.get(id) });
}
