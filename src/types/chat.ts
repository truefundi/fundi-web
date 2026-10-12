import type { JobParty } from './job';

/**
 * Customers choose a technician in the mobile app and chat to agree on the visit.
 * The admin sees these conversations read-only.
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
  sender: 'customer' | 'technician' | 'system';
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
}

export interface ConversationQuery {
  search?: string;
  status?: ConversationStatus;
}
