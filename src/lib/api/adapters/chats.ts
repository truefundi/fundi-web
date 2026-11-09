import type { ChatMessage, Conversation, ConversationStatus } from '@/types/chat';

function mapBackendMessage(msg: any): ChatMessage {
  const senderRole = (msg.senderRole || msg.sender || '').toLowerCase();
  let sender: 'customer' | 'technician' | 'admin' | 'system' = 'customer';
  if (senderRole.includes('tech')) sender = 'technician';
  else if (senderRole.includes('admin')) sender = 'admin';
  else if (senderRole.includes('sys')) sender = 'system';

  return {
    id: msg.id,
    sender,
    senderName: msg.senderName || msg.sender?.fullName,
    text: msg.text || msg.body || msg.message || '',
    at: typeof msg.createdAt === 'string' ? msg.createdAt : msg.createdAt?.toISOString?.() ?? (typeof msg.at === 'string' ? msg.at : new Date().toISOString()),
  };
}

export function mapBackendConversation(conv: any): Conversation {
  if (!conv) {
    return {
      id: '',
      status: 'negotiating',
      service: 'Unspecified',
      problem: '',
      customer: { id: '', name: '—', phone: '' },
      technician: { id: '', name: '—', phone: '' },
      startedAt: new Date().toISOString(),
      lastMessageAt: new Date().toISOString(),
      messages: [],
    };
  }

  // Already adapted
  if ('customer' in conv && 'name' in conv.customer) {
    return conv as Conversation;
  }

  const rawStatus = (conv.status || '').toUpperCase();
  let status: ConversationStatus = 'negotiating';
  if (rawStatus === 'AGREED') status = 'agreed';
  else if (rawStatus === 'DECLINED' || rawStatus === 'CANCELLED' || rawStatus === 'EXPIRED') status = 'declined';

  return {
    id: conv.id,
    status,
    service: conv.request?.service || conv.service || 'General Service',
    problem: conv.request?.description || conv.problem || '',
    customer: {
      id: conv.customer?.id ?? '',
      name: conv.customer?.fullName ?? conv.customer?.name ?? 'Customer',
      phone: conv.customer?.phoneNumber ?? conv.customer?.phone ?? '',
    },
    technician: {
      id: conv.technician?.id ?? '',
      name: conv.technician?.fullName ?? conv.technician?.name ?? 'Technician',
      phone: conv.technician?.phoneNumber ?? conv.technician?.phone ?? '',
    },
    jobId: conv.jobId,
    jobReference: conv.jobId ? conv.jobId.slice(0, 8).toUpperCase() : undefined,
    declineReason: conv.declineReason ?? undefined,
    startedAt: typeof conv.startedAt === 'string' ? conv.startedAt : conv.startedAt?.toISOString?.() ?? new Date().toISOString(),
    lastMessageAt: typeof conv.lastMessageAt === 'string' ? conv.lastMessageAt : conv.lastMessageAt?.toISOString?.() ?? new Date().toISOString(),
    messages: (conv.messages || []).map(mapBackendMessage),
    adminHasJoined: true,
  };
}
