import type { JobParty } from './job';

/**
 * Customers choose a technician in the mobile app and chat to agree on the visit.
 * Admins can join a conversation to message both parties, then leave without
 * affecting the customer-technician conversation.
 */
export type ConversationStatus = 'negotiating' | 'agreed' | 'declined';

export const CONVERSATION_STATUSES: ConversationStatus[] = ['negotiating', 'agreed', 'declined'];

export const CONVERSATION_STATUS_LABEL: Record<ConversationStatus, string> = {
  negotiating: 'Negotiating',
  agreed: 'Agreed',
  declined: 'Declined',
};

export interface ChatMessage {
  id: string;
  /** `system` messages record outcomes, such as "Agreed. Job FD-1045 was created". */
  sender: 'customer' | 'technician' | 'admin' | 'system';
  senderName?: string;
  text: string;
  at: string;
}

export interface Conversation {
  id: string;
  status: ConversationStatus;
  service: string;
  problem: string;
  customer: JobParty;
  technician: JobParty;
  /** Set when the customer and technician agreed and a job was created. */
  jobId?: string;
  jobReference?: string;
  /** Set when the customer declined this technician. */
  declineReason?: string;
  /** The conversation the customer started with another technician after declining. */
  nextConversationId?: string;
  startedAt: string;
  lastMessageAt: string;
  messages: ChatMessage[];
  /** Whether the authenticated admin explicitly joined this conversation. */
  adminHasJoined?: boolean;
}

export interface ConversationQuery {
  search?: string;
  status?: ConversationStatus;
}
