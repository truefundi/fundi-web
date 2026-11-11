'use client';

import { useState } from 'react';
import { Check, ShieldAlert, X } from 'lucide-react';
import { Button, Card, CardBody, CardHeader, ConfirmDialog, useToast } from '@/components/ui';
import { useApproveVerification, useRejectVerification } from '@/hooks/useTechnicians';
import { formatDate } from '@/lib/utils';
import type { Technician } from '@/types/technician';
import { VerificationBadge } from './VerificationBadge';

export function VerificationPanel({ technician }: { technician: Technician }) {
  const verification = technician.verification ?? { status: 'not_submitted', certificateUrls: [] };
  const [dialog, setDialog] = useState<'approve' | 'reject' | null>(null);
  const approve = useApproveVerification();
  const reject = useRejectVerification();
  const toast = useToast();

  const canApprove = verification.status === 'pending' || verification.status === 'rejected';
  const canReject = verification.status === 'pending' || verification.status === 'verified';
  const revoking = verification.status === 'verified';

  const run = async (action: () => Promise<unknown>, success: string) => {
    try {
      await action();
      toast(success);
      setDialog(null);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not update verification', 'error');
    }
  };

  return (
    <Card>
      <CardHeader
        title="Verification"
        action={
          <div className="flex flex-wrap items-center justify-end gap-2">
            {canApprove && (
              <Button size="sm" onClick={() => setDialog('approve')}>
                <Check className="mr-1.5 h-4 w-4" aria-hidden />
                Approve
              </Button>
            )}
            {canReject && (
              <Button
                size="sm"
                variant="secondary"
                className="text-red-600"
                onClick={() => setDialog('reject')}
              >
                <X className="mr-1.5 h-4 w-4" aria-hidden />
                {revoking ? 'Revoke' : 'Reject'}
              </Button>
            )}
            <VerificationBadge status={verification.status} />
          </div>
        }
      />
      <CardBody className="space-y-4">
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-xs text-slate-500">Submitted</dt>
            <dd className="font-medium text-slate-900">{formatDate(verification.submittedAt)}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Reviewed</dt>
            <dd className="font-medium text-slate-900">
              {formatDate(verification.reviewedAt)}
              {verification.reviewedBy && (
                <span className="block text-xs font-normal text-slate-500">by {verification.reviewedBy}</span>
              )}
            </dd>
          </div>
        </dl>

        {verification.status === 'rejected' && verification.rejectionReason && (
          <div className="flex gap-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <div>
              <p className="font-semibold">Rejection reason</p>
              <p>{verification.rejectionReason}</p>
            </div>
          </div>
        )}

      </CardBody>

      <ConfirmDialog
        open={dialog === 'approve'}
        onClose={() => setDialog(null)}
        onConfirm={() => run(() => approve.mutateAsync(technician.id), `${technician.name} is now verified`)}
        loading={approve.isPending}
        title={`Verify ${technician.name}?`}
        description="Confirm you have checked the National ID and certificates. The technician will be able to receive jobs."
        confirmLabel="Approve"
      />
      <ConfirmDialog
        open={dialog === 'reject'}
        onClose={() => setDialog(null)}
        onConfirm={(reason) =>
          run(
            () => reject.mutateAsync({ id: technician.id, reason }),
            `Verification ${revoking ? 'revoked' : 'rejected'} for ${technician.name}`,
          )
        }
        loading={reject.isPending}
        destructive
        title={revoking ? `Revoke verification for ${technician.name}?` : `Reject ${technician.name}?`}
        description="The technician will not receive jobs until they resubmit and are approved."
        confirmLabel={revoking ? 'Revoke' : 'Reject'}
        reasonLabel="Reason"
      />
    </Card>
  );
}
