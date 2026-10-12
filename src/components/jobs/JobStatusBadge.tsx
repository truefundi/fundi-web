import { Badge, type BadgeTone } from '@/components/ui';
import { JOB_STATUS_LABEL, JOB_STATUS_TONE, type JobStatus, type StatusTone, type Urgency } from '@/types/job';

const tones: Record<StatusTone, BadgeTone> = {
  progress: 'info',
  action: 'warning',
  success: 'success',
  danger: 'danger',
};

export function JobStatusBadge({ status }: { status: JobStatus }) {
  return <Badge tone={tones[JOB_STATUS_TONE[status]]}>{JOB_STATUS_LABEL[status]}</Badge>;
}

export function UrgencyBadge({ urgency }: { urgency: Urgency }) {
  return <Badge tone={urgency === 'Emergency' ? 'danger' : 'neutral'}>{urgency}</Badge>;
}
