import type { ChatMessage, Conversation, ConversationQuery } from '@/types/chat';
import { api, unwrap } from '../client';

type QueryParamValue = string | number | boolean;

function toQueryParams(
  query?: ConversationQuery,
): Record<string, QueryParamValue> | undefined {
  if (!query) return undefined;

  const params: Record<string, QueryParamValue> = {};
  for (const [key, value] of Object.entries(query as Record<string, unknown>)) {
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      params[key] = value;
    }
  }

  return Object.keys(params).length > 0 ? params : undefined;
}

export const chatsApi = {
  async list(
    query?: ConversationQuery,
    _userId?: string,
  ): Promise<Conversation[]> {
    void _userId;
    const result = await unwrap<Conversation[]>(
      api.get('/chats', { query: toQueryParams(query) }),
    );
    return result ?? [];
  },

  async get(id: string, _userId?: string): Promise<Conversation> {
    void _userId;
    return unwrap<Conversation>(api.get(`/chats/${id}`));
  },

  async getById(id: string, _userId?: string): Promise<Conversation> {
    void _userId;
    return unwrap<Conversation>(api.get(`/chats/${id}`));
  },

  async join(id: string, _userId?: string): Promise<Conversation> {
    void _userId;
    return unwrap<Conversation>(api.post(`/chats/${id}/join`));
  },

  async leave(id: string, _userId?: string): Promise<void> {
    void _userId;
    await unwrap(api.post(`/chats/${id}/leave`));
  },

  async sendMessage(
    id: string,
    text: string,
    _userId?: string,
    _userEmail?: string | null,
  ): Promise<ChatMessage> {
    void _userId;
    void _userEmail;
    return unwrap<ChatMessage>(api.post(`/chats/${id}/messages`, { text }));
  },
};