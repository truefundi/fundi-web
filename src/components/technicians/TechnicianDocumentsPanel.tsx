'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Download, Eye, FileText, X, XCircle } from 'lucide-react';
import { Card, CardBody, CardHeader, Button, ConfirmDialog, ErrorState, Spinner, useToast } from '@/components/ui';
import { technicianDocumentsApi } from '@/lib/api';
import type { DocumentReviewStatus, TechnicianDocumentRecord } from '@/lib/api/endpoints/technician-documents';
import { useReviewTechnicianDocument, useTechnicianDocuments } from '@/hooks/useTechnicianDocuments';
import { useApproveVerification, useRejectVerification } from '@/hooks/useTechnicians';
import type { Technician } from '@/types/technician';
import { VerificationBadge } from './VerificationBadge';

const REVIEW_STATUSES: DocumentReviewStatus[] = ['REVIEWING', 'ACCEPTED', 'DENIED'];

interface PreviewTarget {
  kind: 'document' | 'profile';
  id: string;
  title: string;
  subtitle: string;
  url: string;
  mimeType?: string;
  document?: TechnicianDocumentRecord;
}

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
  const [preview, setPreview] = useState<PreviewTarget | null>(null);
  const [loadingPreviewId, setLoadingPreviewId] = useState<string | null>(null);

  const verificationStatus = technician.verification?.status ?? 'not_submitted';
  const canApprove = verificationStatus === 'pending' || verificationStatus === 'rejected';
  const canReject = verificationStatus === 'pending' || verificationStatus === 'verified';
  const revoking = verificationStatus === 'verified';
  const technicianName = technician.name || 'Technician';

  useEffect(() => {
    return () => {
      if (preview?.kind === 'document' && preview.url.startsWith('blob:')) {
        URL.revokeObjectURL(preview.url);
      }
    };
  }, [preview]);

  function closePreview() {
    if (preview?.kind === 'document' && preview.url.startsWith('blob:')) {
      URL.revokeObjectURL(preview.url);
    }
    setPreview(null);
  }

  function getEffectiveStatus(doc: TechnicianDocumentRecord): DocumentReviewStatus {
    if (statuses[doc.id]) return statuses[doc.id];
    if (doc.status === 'ACCEPTED' || doc.status === 'DENIED' || doc.status === 'REVIEWING') {
      return doc.status;
    }
    return 'REVIEWING';
  }

  const docList = documents.data ?? [];
  const allDocumentsApproved =
    docList.length > 0 && docList.every((doc) => getEffectiveStatus(doc) === 'ACCEPTED');

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

  async function openDocumentPreview(doc: TechnicianDocumentRecord) {
    setLoadingPreviewId(doc.id);
    try {
      const blob = await technicianDocumentsApi.download(doc.id);
      const url = URL.createObjectURL(blob);
      const previousUrl =
        preview?.kind === 'document' && preview.url.startsWith('blob:') ? preview.url : null;
      if (previousUrl) {
        URL.revokeObjectURL(previousUrl);
      }
      const effective = getEffectiveStatus(doc);
      setPreview({
        kind: 'document',
        id: doc.id,
        title: doc.title,
        subtitle: `${technicianName} · ${doc.originalFileName} · ${statusLabel(effective)}`,
        url,
        mimeType: blob.type || doc.mimeType,
        document: doc,
      });
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Could not open the document', 'error');
    } finally {
      setLoadingPreviewId(null);
    }
  }

  function openProfilePicturePreview() {
    if (!technician.profilePictureUrl) return;
    const previousUrl =
      preview?.kind === 'document' && preview.url.startsWith('blob:') ? preview.url : null;
    if (previousUrl) {
      URL.revokeObjectURL(previousUrl);
    }
    setPreview({
      kind: 'profile',
      id: 'profile-picture',
      title: 'Profile picture',
      subtitle: technicianName,
      url: technician.profilePictureUrl,
      mimeType: 'image/*',
    });
  }

  function applyDocumentDecision(
    doc: TechnicianDocumentRecord,
    nextStatus: DocumentReviewStatus,
    overrideNote?: string,
  ) {
    if (nextStatus === 'ACCEPTED' && (doc.status === 'ACCEPTED' || statuses[doc.id] === 'ACCEPTED')) {
      toast(`${doc.title} is already approved`);
      return;
    }

    const reviewNote = (overrideNote ?? notes[doc.id] ?? doc.reviewNote ?? '').trim() || undefined;
    if (nextStatus === 'DENIED' && !reviewNote) {
      toast('Please enter a review note when rejecting a document', 'error');
      return;
    }

    setStatuses((current) => ({ ...current, [doc.id]: nextStatus }));
    review.mutate(
      { documentId: doc.id, status: nextStatus, reviewNote },
      {
        onSuccess: () => {
          toast(
            nextStatus === 'ACCEPTED'
              ? `${doc.title} approved`
              : nextStatus === 'DENIED'
                ? `${doc.title} rejected`
                : 'Document review saved',
          );
          setPreview((current) =>
            current?.kind === 'document' && current.id === doc.id
              ? {
                  ...current,
                  subtitle: `${technicianName} · ${doc.originalFileName} · ${statusLabel(nextStatus)}`,
                  document: { ...doc, status: nextStatus, reviewNote: reviewNote ?? null },
                }
              : current,
          );
        },
        onError: (error) => toast(error.message || 'Could not save the document review', 'error'),
      },
    );
  }

  function submitReview(document: TechnicianDocumentRecord) {
    const status = getEffectiveStatus(document);
    applyDocumentDecision(document, status);
  }

  const activeDoc =
    preview?.kind === 'document'
      ? docList.find((d) => d.id === preview.id) ?? preview.document ?? null
      : null;
  const activeDocStatus = activeDoc ? getEffectiveStatus(activeDoc) : null;

  return (
    <Card>
      <CardHeader
        title={`Verification · ${technicianName}`}
        action={
          <div className="flex flex-wrap items-center justify-end gap-2">
            {canApprove && (
              <Button
                size="sm"
                disabled={!allDocumentsApproved}
                onClick={() => setDialog('approve')}
                className={
                  allDocumentsApproved
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'cursor-not-allowed bg-slate-200 text-slate-500 hover:bg-slate-200'
                }
              >
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
                {revoking ? 'Revoke' : 'Reject'}
              </Button>
            )}
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
            {technician.profilePictureUrl ? (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-4">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={technician.profilePictureUrl}
                    alt={`Profile · ${technicianName}`}
                    className="h-10 w-10 rounded-md object-cover"
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Profile picture <span className="font-normal text-slate-500">· {technicianName}</span>
                    </p>
                    <p className="text-xs text-emerald-700">Uploaded</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={openProfilePicturePreview}>
                  <Eye className="mr-1 h-4 w-4" /> View
                </Button>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Profile picture <span className="font-normal text-slate-500">· {technicianName}</span>
                    </p>
                    <p className="text-xs text-amber-700">
                      Required before verification approval. Upload it from Edit profile at the top of the page.
                    </p>
                  </div>
                  <span className="rounded-md bg-white px-3 py-2 text-sm font-medium text-amber-700">
                    Missing
                  </span>
                </div>
              </div>
            )}

            {docList.map((item) => {
              const currentStatus = getEffectiveStatus(item);
              const isAccepted = currentStatus === 'ACCEPTED';
              return (
                <div key={item.id} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 gap-3">
                      <FileText className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {item.title} <span className="font-normal text-slate-500">· {technicianName}</span>
                        </p>
                        <p className="text-xs text-slate-500">
                          {item.originalFileName} · {statusLabel(currentStatus)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        loading={loadingPreviewId === item.id}
                        onClick={() => openDocumentPreview(item)}
                      >
                        <Eye className="mr-1 h-4 w-4" /> View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => download(item.id, item.originalFileName)}
                      >
                        <Download className="mr-1 h-4 w-4" /> Download
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
                        value={currentStatus}
                        onChange={(event) =>
                          setStatuses((current) => ({
                            ...current,
                            [item.id]: event.target.value as DocumentReviewStatus,
                          }))
                        }
                        className="h-9 min-w-0 rounded-md border border-slate-200 bg-white px-2 text-sm"
                      >
                        {REVIEW_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {statusLabel(status)}
                          </option>
                        ))}
                      </select>
                      <input
                        value={notes[item.id] ?? item.reviewNote ?? ''}
                        onChange={(event) =>
                          setNotes((current) => ({ ...current, [item.id]: event.target.value }))
                        }
                        placeholder="Review note (required when denying)"
                        className="h-9 min-w-0 rounded-md border border-slate-200 px-3 text-sm"
                      />
                      <Button size="sm" loading={review.isPending} onClick={() => submitReview(item)}>
                        Save review
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}

            {!docList.some((item) => item.type === 'NATIONAL_ID') && (
              <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      National ID <span className="font-normal text-slate-500">· {technicianName}</span>
                    </p>
                    <p className="text-xs text-amber-700">
                      Not submitted yet. Upload it from Edit profile.
                    </p>
                  </div>
                  <span className="rounded-md bg-white px-3 py-2 text-sm font-medium text-amber-700">
                    Missing
                  </span>
                </div>
              </div>
            )}

            {!docList.some((item) => item.type === 'CERTIFICATE') && (
              <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Certificate 1 <span className="font-normal text-slate-500">· {technicianName}</span>
                    </p>
                    <p className="text-xs text-amber-700">
                      Not submitted yet. Upload it from Edit profile.
                    </p>
                  </div>
                  <span className="rounded-md bg-white px-3 py-2 text-sm font-medium text-amber-700">
                    Missing
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No documents have been submitted.</p>
        )}
      </CardBody>

      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`${preview.title} — ${technicianName}`}
        >
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-3.5">
              <div className="flex min-w-0 items-center gap-2.5">
                <FileText className="h-5 w-5 shrink-0 text-rose-600" />
                <div className="min-w-0">
                  <h3 className="truncate text-base font-semibold text-slate-900">
                    {preview.title} — {technicianName}
                  </h3>
                  <p className="truncate text-xs text-slate-500">{preview.subtitle}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closePreview}
                aria-label="Close document preview"
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto bg-slate-100 p-4">
              {preview.mimeType?.includes('pdf') ? (
                <iframe
                  src={preview.url}
                  title={`${preview.title} — ${technicianName}`}
                  className="h-[62vh] w-full rounded-lg border border-slate-200 bg-white"
                />
              ) : (
                <div className="flex min-h-[340px] items-center justify-center rounded-lg border border-slate-200 bg-white p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview.url}
                    alt={`${preview.title} — ${technicianName}`}
                    className="max-h-[62vh] w-auto rounded object-contain"
                  />
                </div>
              )}
            </div>

            {activeDoc && (
              <div className="flex flex-col gap-3 border-t border-slate-200 bg-white px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                <input
                  value={notes[activeDoc.id] ?? activeDoc.reviewNote ?? ''}
                  onChange={(event) =>
                    setNotes((current) => ({ ...current, [activeDoc.id]: event.target.value }))
                  }
                  placeholder="Review note (required when rejecting)"
                  className="h-9 flex-1 rounded-md border border-slate-200 px-3 text-sm"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={review.isPending || activeDocStatus === 'ACCEPTED'}
                    onClick={() => applyDocumentDecision(activeDoc, 'ACCEPTED')}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {activeDocStatus === 'ACCEPTED' ? 'Approved' : 'Approve document'}
                  </button>
                  <button
                    type="button"
                    disabled={review.isPending}
                    onClick={() => applyDocumentDecision(activeDoc, 'DENIED')}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
                  >
                    <XCircle className="h-4 w-4 text-slate-700" />
                    Reject document
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={dialog === 'approve'}
        onClose={() => setDialog(null)}
        onConfirm={() =>
          runVerification(() => approve.mutateAsync(technician.id), `${technicianName} is now verified`)
        }
        loading={approve.isPending}
        title={`Verify ${technicianName}?`}
        description="Confirm you have checked the submitted documents."
        confirmLabel="Approve"
      />
      <ConfirmDialog
        open={dialog === 'reject'}
        onClose={() => setDialog(null)}
        onConfirm={(reason) =>
          runVerification(
            () => reject.mutateAsync({ id: technician.id, reason }),
            `Verification ${revoking ? 'revoked' : 'rejected'} for ${technicianName}`,
          )
        }
        loading={reject.isPending}
        destructive
        title={revoking ? `Revoke verification for ${technicianName}?` : `Reject ${technicianName}?`}
        description="The technician will not receive jobs until they resubmit and are approved."
        confirmLabel={revoking ? 'Revoke' : 'Reject'}
        reasonLabel="Reason"
      />
    </Card>
  );
}