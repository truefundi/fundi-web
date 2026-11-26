import type {
  ChatMessage,
  Conversation,
  ConversationQuery,
  ConversationStatus,
} from '@/types/chat';
import type { JobParty } from '@/types/job';
import { api, unwrap } from '../client';

type QueryParamValue = string | number | boolean;

type RawParty = {
  id?: string;
  name?: string | null;
  fullName?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
};

type RawChatRoom = Partial<Conversation> & {
  id: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  job?: {
    id?: string;
    reference?: string | null;
    status?: string;
    cooperationStatus?: string | null;
    description?: string | null;
    service?: string | null;
    customer?: RawParty | null;
    technician?: RawParty | null;
  } | null;
  messages?: ChatMessage[];
};

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

function toParty(party?: RawParty | null, fallbackName = 'Unknown'): JobParty {
  return {
    id: party?.id ?? '',
    name: party?.name?.trim() || party?.fullName?.trim() || fallbackName,
    phone: party?.phone ?? undefined,
    avatarUrl: party?.avatarUrl ?? undefined,
  } as JobParty;
}

function mapStatus(rawStatus?: string, jobCooperation?: string | null): ConversationStatus {
  const normalized = (rawStatus ?? '').toLowerCase();
  if (
    normalized === 'pending' ||
    normalized === 'negotiating' ||
    normalized === 'agreed' ||
    normalized === 'declined' ||
    normalized === 'expired'
  ) {
    return normalized;
  }

  const coop = (jobCooperation ?? '').toUpperCase();
  if (coop === 'AGREED' || coop === 'CONFIRMED') return 'agreed';
  if (coop === 'DECLINED' || coop === 'REJECTED') return 'declined';
  if (coop === 'EXPIRED') return 'expired';
  return 'negotiating';
}

function normalizeConversation(raw: RawChatRoom): Conversation {
  const job = raw.job ?? undefined;
  return {
    id: raw.id,
    status: mapStatus(raw.status, job?.cooperationStatus),
    service: raw.service ?? job?.service ?? 'General service',
    problem: raw.problem ?? job?.description ?? '',
    customer: toParty(raw.customer ?? job?.customer, 'Customer'),
    technician: toParty(raw.technician ?? job?.technician, 'Technician'),
    jobId: raw.jobId ?? job?.id,
    jobReference: raw.jobReference ?? job?.reference ?? undefined,
    declineReason: raw.declineReason,
    nextConversationId: raw.nextConversationId,
    startedAt: raw.startedAt ?? raw.createdAt ?? new Date(0).toISOString(),
    lastMessageAt: raw.lastMessageAt ?? raw.updatedAt ?? raw.createdAt ?? new Date(0).toISOString(),
    messages: Array.isArray(raw.messages) ? raw.messages : [],
    adminHasJoined: raw.adminHasJoined,
  };
}

export const chatsApi = {
  async list(
    query?: ConversationQuery,
    _userId?: string,
  ): Promise<Conversation[]> {
    void _userId;
    const result = await unwrap<RawChatRoom[]>(
      api.get('/admin/chat/rooms', { query: toQueryParams(query) }),
    );
    return (result ?? []).map(normalizeConversation);
  },

  async get(id: string, _userId?: string): Promise<Conversation> {
    void _userId;
    const result = await unwrap<RawChatRoom>(
      api.get(`/admin/chat/rooms/${id}`),
    );
    return normalizeConversation(result);
  },

  async getById(id: string, _userId?: string): Promise<Conversation> {
    void _userId;
    const result = await unwrap<RawChatRoom>(
      api.get(`/admin/chat/rooms/${id}`),
    );
    return normalizeConversation(result);
  },

  async join(id: string, _userId?: string): Promise<Conversation> {
    void _userId;
    const result = await unwrap<RawChatRoom>(
      api.post(`/admin/chat/rooms/${id}/join`),
    );
    return normalizeConversation(result);
  },

  async leave(id: string, _userId?: string): Promise<void> {
    void _userId;
    await unwrap(api.post(`/admin/chat/rooms/${id}/leave`));
  },

  async sendMessage(
    id: string,
    text: string,
    _userId?: string,
    _userEmail?: string | null,
  ): Promise<ChatMessage> {
    void _userId;
    void _userEmail;
    return unwrap<ChatMessage>(
      api.post(`/admin/chat/rooms/${id}/messages`, { text }),
    );
  },
};
