import type { ChatMessage, Conversation, ConversationStatus } from '@/types/chat';

export interface BackendConversation {
  id: string;
  jobId: string;
  status: string;
  request: { service: string | null; description: string };
  customer: { id: string; fullName: string; phoneNumber: string };
  technician: { id: string; fullName: string; phoneNumber: string } | null;
  declineReason: string | null;
  startedAt: string;
  lastMessageAt: string;
  messages: { id: string; senderRole: string; text: string | null; createdAt: string }[];
}

export function mapBackendConversation(conv: BackendConversation): Conversation {
  return {
    id: conv.id,
    status: ({ PENDING: 'pending', NEGOTIATING: 'negotiating', AGREED: 'agreed', DECLINED: 'declined', EXPIRED: 'expired' } satisfies Record<string, ConversationStatus>)[conv.status as 'PENDING' | 'NEGOTIATING' | 'AGREED' | 'DECLINED' | 'EXPIRED'] ?? 'pending',
    service: conv.request.service || 'General Service', problem: conv.request.description,
    customer: { id: conv.customer.id, name: conv.customer.fullName, phone: conv.customer.phoneNumber },
    technician: { id: conv.technician?.id ?? '', name: conv.technician?.fullName ?? 'Unassigned', phone: conv.technician?.phoneNumber ?? '' },
    jobId: conv.jobId, jobReference: conv.jobId.slice(0, 8).toUpperCase(),
    declineReason: conv.declineReason ?? undefined,
    startedAt: conv.startedAt, lastMessageAt: conv.lastMessageAt,
    messages: conv.messages.map((message): ChatMessage => ({
      id: message.id,
      sender: message.senderRole === 'TECHNICIAN' ? 'technician' : message.senderRole === 'CUSTOMER' ? 'customer' : 'system',
      text: message.text ?? '', at: message.createdAt,
    })),
    adminHasJoined: true,
  };
}
