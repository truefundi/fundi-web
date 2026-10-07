import { Badge, type BadgeTone } from '@/components/ui';
import { CONVERSATION_STATUS_LABEL, type ConversationStatus } from '@/types/chat';

const tones: Record<ConversationStatus, BadgeTone> = {
  negotiating: 'info',
  agreed: 'success',
  declined: 'neutral',
};

export function ConversationStatusBadge({ status }: { status: ConversationStatus }) {
  return <Badge tone={tones[status]}>{CONVERSATION_STATUS_LABEL[status]}</Badge>;
}
