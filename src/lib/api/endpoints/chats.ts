import { env } from '@/config/env';
import { clone, delay, mockDb, MockNotFoundError } from '@/mocks/mock-db';
import { mapBackendConversation, type BackendConversation } from '@/lib/api/adapters/chats';
import type { ChatMessage, Conversation, ConversationQuery } from '@/types/chat';
import { api, ApiError, unwrap } from '../client';

function matchesSearch(chat: Conversation, search?: string): boolean {
  const term = search?.trim().toLowerCase();
  if (!term) return true;
  return [chat.customer.name, chat.technician.name, chat.service, chat.problem, chat.jobReference ?? ''].some((v) =>
    v.toLowerCase().includes(term),
  );
}

export const chatsApi = {
  async list(query: ConversationQuery = {}, adminId?: string): Promise<Conversation[]> {
    if (!env.useMocks) {
      const response = await unwrap<{ data: BackendConversation[] }>(api.get('/admin/conversations', { query: { search: query.search?.trim() || undefined, status: query.status?.toUpperCase() } }));
      const rawList = Array.isArray(response) ? response : response?.data || [];
      return rawList.map(mapBackendConversation);
    }
    await delay();
    return clone(
      mockDb.chats
        .filter((c) => matchesSearch(c, query.search) && (!query.status || c.status === query.status))
        .sort((a, b) => Date.parse(b.lastMessageAt) - Date.parse(a.lastMessageAt)),
    ).map((chat) => {
      const adminHasJoined = Boolean(adminId && mockDb.joinedChatsByAdmin[adminId]?.includes(chat.id));
      return { ...chat, messages: adminHasJoined ? chat.messages : [], adminHasJoined };
    });
  },

  async get(id: string, adminId?: string): Promise<Conversation> {
    if (!env.useMocks) {
      const response = await unwrap<BackendConversation>(api.get(`/admin/conversations/${id}`));
      return mapBackendConversation(response);
    }
    await delay();
    const chat = mockDb.chats.find((c) => c.id === id);
    if (!chat) throw new MockNotFoundError('Conversation', id);
    const adminHasJoined = Boolean(adminId && mockDb.joinedChatsByAdmin[adminId]?.includes(id));
    return clone({
      ...chat,
      messages: adminHasJoined ? chat.messages : [],
      adminHasJoined,
    });
  },

  async sendMessage(id: string, text: string, adminId: string, senderName: string): Promise<ChatMessage> {
    if (!env.useMocks) {
      throw new ApiError('Admin messaging is read-only; messages are exchanged between customer and technician.', 403);
    }
    await delay();
    const chat = mockDb.chats.find((c) => c.id === id);
    if (!chat) throw new MockNotFoundError('Conversation', id);
    if (!mockDb.joinedChatsByAdmin[adminId]?.includes(id)) {
      throw new ApiError('Join this conversation before sending a message.', 409);
    }

    const message: ChatMessage = {
      id: `${chat.id}_admin_${Date.now()}`,
      sender: 'admin',
      senderName,
      text: text.trim(),
      at: new Date().toISOString(),
    };
    chat.messages.push(message);
    chat.lastMessageAt = message.at;
    return clone(message);
  },

  async join(id: string, adminId: string): Promise<void> {
    if (!env.useMocks) {
      // Backend admin conversation review is read-only; join is a UI-only state in admin portal
      return;
    }
    await delay();
    const chat = mockDb.chats.find((c) => c.id === id);
    if (!chat) throw new MockNotFoundError('Conversation', id);

    const joinedChats = (mockDb.joinedChatsByAdmin[adminId] ??= []);
    if (!joinedChats.includes(id)) joinedChats.push(id);
  },

  async leave(id: string, adminId: string): Promise<void> {
    if (!env.useMocks) {
      return;
    }
    await delay();
    const chat = mockDb.chats.find((c) => c.id === id);
    if (!chat) throw new MockNotFoundError('Conversation', id);

    mockDb.joinedChatsByAdmin[adminId] = (mockDb.joinedChatsByAdmin[adminId] ?? []).filter((chatId) => chatId !== id);
  },
};
