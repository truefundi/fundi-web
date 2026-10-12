import { env } from '@/config/env';
import { clone, delay, mockDb, MockNotFoundError } from '@/mocks/mock-db';
import type { Conversation, ConversationQuery } from '@/types/chat';
import { api, unwrap } from '../client';

function matchesSearch(chat: Conversation, search?: string): boolean {
  const term = search?.trim().toLowerCase();
  if (!term) return true;
  return [chat.customer.name, chat.technician.name, chat.service, chat.problem, chat.jobReference ?? ''].some((v) =>
    v.toLowerCase().includes(term),
  );
}

/** Read-only for the admin: customers and technicians write the messages in the mobile app. */
export const chatsApi = {
  async list(query: ConversationQuery = {}): Promise<Conversation[]> {
    if (!env.useMocks) return unwrap(api.get('/admin/conversations', { query: { ...query } }));
    await delay();
    return clone(
      mockDb.chats
        .filter((c) => matchesSearch(c, query.search) && (!query.status || c.status === query.status))
        .sort((a, b) => Date.parse(b.lastMessageAt) - Date.parse(a.lastMessageAt)),
    );
  },

  async get(id: string): Promise<Conversation> {
    if (!env.useMocks) return unwrap(api.get(`/admin/conversations/${id}`));
    await delay();
    const chat = mockDb.chats.find((c) => c.id === id);
    if (!chat) throw new MockNotFoundError('Conversation', id);
    return clone(chat);
  },
};
