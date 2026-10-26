'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ClipboardCheck, ShieldAlert } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  SegmentedTabs,
  Spinner,
  useToast,
} from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useApprovalRequests, useReviewApproval } from '@/hooks/useApprovals';
import { formatDate, formatRelative } from '@/lib/utils';
import {
  canApproveRequest,
  type ApprovalRequest,
  type ApprovalStatus,
} from '@/types/approval';

const STATUS_TONE: Record<ApprovalStatus, 'warning' | 'success' | 'danger'> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
};

function resourceHref(request: ApprovalRequest): string | null {
  if (request.resourceType === 'technician') return `/admin/technicians/${request.resourceId}`;
  if (request.resourceType === 'customer') return `/admin/customers`;
  if (request.resourceType === 'job' || request.resourceType === 'dispute') return `/admin/jobs/${request.resourceId}`;
  if (request.resourceType === 'settings') return '/admin/settings';
  return null;
}

export function ApprovalQueue() {
  const { user } = useAuth();
  const [status, setStatus] = useState<ApprovalStatus | 'ALL'>('PENDING');
  const list = useApprovalRequests(status === 'ALL' ? undefined : status);
  const review = useReviewApproval();
  const toast = useToast();
  const [selected, setSelected] = useState<ApprovalRequest | null>(null);
  const [decision, setDecision] = useState<'APPROVED' | 'REJECTED' | null>(null);

  const items = list.data ?? [];
  const pendingCount = items.filter((item) => item.status === 'PENDING').length;

  const confirm = async (notes: string) => {
    if (!selected || !decision || !user) return;
    try {
      await review.mutateAsync({
        id: selected.id,
        status: decision,
        notes,
        reviewer: {
          id: user.id,
          name: user.name?.trim() || user.email,
          email: user.email,
          role: user.role,
        },
      });
      toast(decision === 'APPROVED' ? 'Request approved and applied.' : 'Request rejected.');
      setDecision(null);
      setSelected(null);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not review this request', 'error');
    }
  };

  return (
    <div className="space-y-4">
      <SegmentedTabs
        label="Approval status"
        value={status}
        onChange={setStatus}
        tabs={[
          { value: 'PENDING', label: 'Pending', count: status === 'PENDING' ? items.length : undefined },
          { value: 'APPROVED', label: 'Approved' },
          { value: 'REJECTED', label: 'Rejected' },
          { value: 'ALL', label: 'All' },
        ]}
      />

      {list.isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : list.isError ? (
        <ErrorState message={list.error.message} onRetry={() => list.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title={status === 'PENDING' ? 'No pending requests' : 'Nothing to show'}
          description="When a Support Agent needs senior approval, the request appears here."
        />
      ) : (
        <div className="space-y-3">
          {items.map((request) => {
            const href = resourceHref(request);
            const canReview =
              request.status === 'PENDING' && user && canApproveRequest(user.role, request.actionType);
            return (
              <Card key={request.id} className="p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-slate-900">{request.title}</h3>
                      <Badge tone={STATUS_TONE[request.status]}>{request.status.toLowerCase()}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{request.summary}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      {request.resourceName} · requested by {request.requester.name} ({request.requester.role.replaceAll('_', ' ').toLowerCase()}) ·{' '}
                      {formatRelative(request.createdAt)}
                    </p>
                    {request.verificationChecklist && (
                      <ul className="mt-3 grid gap-1 text-xs text-slate-600 sm:grid-cols-3">
                        <li>Phone {request.verificationChecklist.phoneMatched ? 'matches' : 'does not match'}: {request.verificationChecklist.phoneNumber}</li>
                        <li>ID {request.verificationChecklist.idMatched ? 'matches' : 'does not match'}: {request.verificationChecklist.idNumber}</li>
                        <li>Certificate {request.verificationChecklist.certificateMatched ? 'matches' : 'does not match'}</li>
                      </ul>
                    )}
                    {request.rejectionReason && (
                      <p className="mt-2 flex items-start gap-1.5 text-xs text-red-700">
                        <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                        {request.rejectionReason}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {href && (
                      <Button variant="secondary" size="sm" asChild={false}>
                        <Link href={href}>Open record</Link>
                      </Button>
                    )}
                    {canReview && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelected(request);
                            setDecision('APPROVED');
                          }}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="text-red-600"
                          onClick={() => {
                            setSelected(request);
                            setDecision('REJECTED');
                          }}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                {request.reviewedBy && (
                  <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
                    Reviewed by {request.reviewedBy.name} on {formatDate(request.reviewedAt)}
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={decision !== null}
        onClose={() => setDecision(null)}
        onConfirm={(notes) => confirm(notes)}
        loading={review.isPending}
        destructive={decision === 'REJECTED'}
        title={decision === 'APPROVED' ? `Approve ${selected?.title}?` : `Reject ${selected?.title}?`}
        description={
          decision === 'APPROVED'
            ? 'This will apply the action immediately (verify the user, suspend the account, or whatever was requested).'
            : 'The requester will need to submit a new request if they still want this action.'
        }
        confirmLabel={decision === 'APPROVED' ? 'Approve and apply' : 'Reject request'}
        reasonLabel={decision === 'REJECTED' ? 'Reason' : undefined}
        reasonHint={decision === 'REJECTED' ? 'The requester will see this reason.' : undefined}
      />
      {pendingCount === 0 && status === 'ALL' ? null : null}
    </div>
  );
}
