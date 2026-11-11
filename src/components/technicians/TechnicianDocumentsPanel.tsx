'use client';

import { useState } from 'react';
import { Download, Eye, FileText } from 'lucide-react';
import { Card, CardBody, CardHeader, Button, ConfirmDialog, ErrorState, Spinner, useToast } from '@/components/ui';
import { technicianDocumentsApi } from '@/lib/api';
import type { DocumentReviewStatus, TechnicianDocumentRecord } from '@/lib/api/endpoints/technician-documents';
import { useReviewTechnicianDocument, useTechnicianDocuments } from '@/hooks/useTechnicianDocuments';
import { useApproveVerification, useRejectVerification } from '@/hooks/useTechnicians';
import type { Technician } from '@/types/technician';
import { VerificationBadge } from './VerificationBadge';

const REVIEW_STATUSES: DocumentReviewStatus[] = ['REVIEWING', 'ACCEPTED', 'DENIED'];

function statusLabel(status: TechnicianDocumentRecord['status']) {
  return status === 'SUBMITTED' ? 'Submitted' : status[0] + status.slice(1).toLowerCase();
}

export function TechnicianDocumentsPanel({ technician }: { technician: Technician }) {
  const documents = useTechnicianDocuments(technician.id);
  const review = useReviewTechnicianDocument();
  const approve = useApproveVerification();
  const reject = useRejectVerification();
  const toast = useToast();
  const [dialog, setDialog] = useState<'approve' | 'reject' | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [statuses, setStatuses] = useState<Record<string, DocumentReviewStatus>>({});
  const verificationStatus = technician.verification?.status ?? 'not_submitted';
  const canApprove = verificationStatus === 'pending' || verificationStatus === 'rejected';
  const canReject = verificationStatus === 'pending' || verificationStatus === 'verified';
  const revoking = verificationStatus === 'verified';

  async function runVerification(action: () => Promise<unknown>, message: string) {
    try {
      await action();
      toast(message);
      setDialog(null);
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Could not update verification', 'error');
    }
  }

  async function download(documentId: string, fileName: string) {
    try {
      const blob = await technicianDocumentsApi.download(documentId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Could not download the document', 'error');
    }
  }

  async function view(documentId: string) {
    try {
      const blob = await technicianDocumentsApi.download(documentId);
      const url = URL.createObjectURL(blob);
      const tab = window.open(url, '_blank', 'noopener,noreferrer');
      if (!tab) {
        URL.revokeObjectURL(url);
        toast('Your browser blocked the document preview. Allow pop-ups and try again.', 'error');
        return;
      }
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Could not open the document', 'error');
    }
  }

  function submitReview(document: TechnicianDocumentRecord) {
    const status = statuses[document.id] ?? (document.status === 'SUBMITTED' ? 'REVIEWING' : document.status);
    review.mutate(
      { documentId: document.id, status, reviewNote: notes[document.id]?.trim() || undefined },
      {
        onSuccess: () => toast('Document review saved'),
        onError: (error) => toast(error.message || 'Could not save the document review', 'error'),
      },
    );
  }

  return (
    <Card>
      <CardHeader
        title="Verification"
        action={
          <div className="flex flex-wrap items-center justify-end gap-2">
            {canApprove && <Button size="sm" onClick={() => setDialog('approve')}>Approve</Button>}
            {canReject && <Button size="sm" variant="secondary" className="text-red-600" onClick={() => setDialog('reject')}>{revoking ? 'Revoke' : 'Reject'}</Button>}
            <VerificationBadge status={verificationStatus} />
          </div>
        }
      />
      <CardBody className="space-y-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Documents</p>

        {documents.isLoading ? (
          <div className="flex justify-center py-4"><Spinner /></div>
        ) : documents.isError ? (
          <ErrorState message={documents.error.message} onRetry={() => documents.refetch()} />
        ) : documents.data ? (
          <div className="space-y-4">
            {technician.profilePictureUrl && (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-4">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={technician.profilePictureUrl} alt="Profile" className="h-10 w-10 rounded-md object-cover" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Profile picture</p>
                    <p className="text-xs text-emerald-700">Uploaded</p>
                  </div>
                </div>
                <a href={technician.profilePictureUrl} target="_blank" rel="noreferrer" className="text-sm font-medium text-brand-600 hover:underline">View</a>
              </div>
            )}
            {documents.data.map((item) => {
              const isAccepted = item.status === 'ACCEPTED';
              return (
                <div key={item.id} className="rounded-lg border border-slate-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 gap-3">
                    <FileText className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{item.title}</p>
                      <p className="text-xs text-slate-500">{item.originalFileName} · {statusLabel(item.status)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => view(item.id)}>
                      <Eye className="h-4 w-4" /> View
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => download(item.id, item.originalFileName)}>
                      <Download className="h-4 w-4" /> Download
                    </Button>
                  </div>
                </div>
                {isAccepted ? (
                  <div className="mt-3 inline-flex rounded-md bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                    Accepted
                  </div>
                ) : (
                  <div className="mt-3 grid gap-2 lg:grid-cols-[10rem_minmax(0,1fr)_auto]">
                    <select
                      value={statuses[item.id] ?? (item.status === 'SUBMITTED' ? 'REVIEWING' : item.status)}
                      onChange={(event) => setStatuses((current) => ({ ...current, [item.id]: event.target.value as DocumentReviewStatus }))}
                      className="h-9 min-w-0 rounded-md border border-slate-200 bg-white px-2 text-sm"
                    >
                      {REVIEW_STATUSES.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
                    </select>
                    <input
                      value={notes[item.id] ?? item.reviewNote ?? ''}
                      onChange={(event) => setNotes((current) => ({ ...current, [item.id]: event.target.value }))}
                      placeholder="Review note (required when denying)"
                      className="h-9 min-w-0 rounded-md border border-slate-200 px-3 text-sm"
                    />
                    <Button size="sm" loading={review.isPending} onClick={() => submitReview(item)}>Save review</Button>
                  </div>
                )}
                </div>
              );
            })}
            {!documents.data.some((item) => item.type === 'NATIONAL_ID') && (
              <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div><p className="text-sm font-semibold text-slate-900">National ID</p><p className="text-xs text-amber-700">Not submitted yet. Upload it from Edit profile.</p></div>
                  <span className="rounded-md bg-white px-3 py-2 text-sm font-medium text-amber-700">Missing</span>
                </div>
              </div>
            )}
            {!documents.data.some((item) => item.type === 'CERTIFICATE') && (
              <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Certificate 1</p>
                    <p className="text-xs text-amber-700">Not submitted yet. Upload it from Edit profile.</p>
                  </div>
                  <span className="rounded-md bg-white px-3 py-2 text-sm font-medium text-amber-700">Missing</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No documents have been submitted.</p>
        )}
      </CardBody>
      <ConfirmDialog
        open={dialog === 'approve'}
        onClose={() => setDialog(null)}
        onConfirm={() => runVerification(() => approve.mutateAsync(technician.id), `${technician.name} is now verified`)}
        loading={approve.isPending}
        title={`Verify ${technician.name}?`}
        description="Confirm you have checked the submitted documents."
        confirmLabel="Approve"
      />
      <ConfirmDialog
        open={dialog === 'reject'}
        onClose={() => setDialog(null)}
        onConfirm={(reason) => runVerification(() => reject.mutateAsync({ id: technician.id, reason }), `Verification ${revoking ? 'revoked' : 'rejected'} for ${technician.name}`)}
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
