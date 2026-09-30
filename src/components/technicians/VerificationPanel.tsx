'use client';

import { useState } from 'react';
import { Check, ExternalLink, ShieldAlert, X } from 'lucide-react';
import { Button, Card, CardBody, CardHeader, ConfirmDialog, Modal, useToast } from '@/components/ui';
import { useApproveVerification, useRejectVerification } from '@/hooks/useTechnicians';
import { formatDate } from '@/lib/utils';
import type { Technician } from '@/types/technician';
import { VerificationBadge } from './VerificationBadge';

export function VerificationPanel({ technician }: { technician: Technician }) {
  const { verification } = technician;
  const [preview, setPreview] = useState<{ label: string; url: string } | null>(null);
  const [dialog, setDialog] = useState<'approve' | 'reject' | null>(null);
  const approve = useApproveVerification();
  const reject = useRejectVerification();
  const toast = useToast();

  const documents = [
    ...(verification.idDocumentUrl ? [{ label: 'National ID', url: verification.idDocumentUrl }] : []),
    ...verification.certificateUrls.map((url, i) => ({ label: `Certificate ${i + 1}`, url })),
  ];
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
      <CardHeader title="Verification" action={<VerificationBadge status={verification.status} />} />
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

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Documents</p>
          {documents.length > 0 ? (
            documents.map((doc) => (
              <button
                key={doc.url}
                type="button"
                onClick={() => setPreview(doc)}
                className="flex w-full items-center gap-3 rounded-lg border border-slate-200 p-2 text-left transition-colors hover:border-brand-500"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- uploaded document URLs from the backend */}
                <img src={doc.url} alt="" className="h-10 w-10 shrink-0 rounded-md bg-slate-100 object-cover" />
                <span className="flex-1 truncate text-sm font-medium text-slate-900">{doc.label}</span>
                <span className="text-xs font-medium text-brand-600">View</span>
              </button>
            ))
          ) : (
            <p className="rounded-lg bg-slate-50 px-3 py-4 text-center text-sm text-slate-500">No documents submitted yet.</p>
          )}
        </div>

        {(canApprove || canReject) && (
          <div className="flex gap-2 pt-1">
            {canApprove && (
              <Button className="flex-1" onClick={() => setDialog('approve')}>
                <Check className="h-4 w-4" aria-hidden />
                Approve
              </Button>
            )}
            {canReject && (
              <Button variant="secondary" className="flex-1 text-red-600" onClick={() => setDialog('reject')}>
                <X className="h-4 w-4" aria-hidden />
                {revoking ? 'Revoke' : 'Reject'}
              </Button>
            )}
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
      <Modal open={preview !== null} onClose={() => setPreview(null)} title={preview?.label ?? ''}>
        {preview && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview.url} alt={preview.label} className="w-full rounded-lg border border-slate-200" />
            <a
              href={preview.url}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              Open original
            </a>
          </>
        )}
      </Modal>
    </Card>
  );
}
