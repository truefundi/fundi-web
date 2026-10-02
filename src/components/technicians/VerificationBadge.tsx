import { CircleDashed, Clock, ShieldCheck, XCircle } from 'lucide-react';
import { Badge, type BadgeTone } from '@/components/ui';
import { VERIFICATION_LABEL, type VerificationStatus } from '@/types/technician';

const icon = 'h-3.5 w-3.5';

// Same wording and colours as the mobile verification tag
const styles: Record<VerificationStatus, { tone: BadgeTone; icon: React.ReactNode }> = {
  verified: { tone: 'success', icon: <ShieldCheck className={icon} aria-hidden /> },
  pending: { tone: 'warning', icon: <Clock className={icon} aria-hidden /> },
  rejected: { tone: 'danger', icon: <XCircle className={icon} aria-hidden /> },
  not_submitted: { tone: 'neutral', icon: <CircleDashed className={icon} aria-hidden /> },
};

export function VerificationBadge({ status }: { status: VerificationStatus }) {
  return (
    <Badge tone={styles[status].tone} icon={styles[status].icon}>
      {VERIFICATION_LABEL[status]}
    </Badge>
  );
}
