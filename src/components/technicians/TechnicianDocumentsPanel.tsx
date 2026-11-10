'use client';

import { useState } from 'react';
import { CheckCircle2, Download, Eye, FileText, XCircle } from 'lucide-react';
import { Card, CardBody, CardHeader, Button, ErrorState, Spinner, useToast } from '@/components/ui';
import { technicianDocumentsApi } from '@/lib/api';
import type { DocumentReviewStatus, TechnicianDocumentRecord } from '@/lib/api/endpoints/technician-documents';
import { useReviewTechnicianDocument, useTechnicianDocuments, useTechnicianVerificationChecklist } from '@/hooks/useTechnicianDocuments';

const REVIEW_STATUSES: DocumentReviewStatus[] = ['REVIEWING', 'ACCEPTED', 'DENIED'];

function statusLabel(status: TechnicianDocumentRecord['status']) {
  return status === 'SUBMITTED' ? 'Submitted' : status[0] + status.slice(1).toLowerCase();
}

export function TechnicianDocumentsPanel({ technicianId }: { technicianId: string }) {
  const documents = useTechnicianDocuments(technicianId);
  const checklist = useTechnicianVerificationChecklist(technicianId);
  const review = useReviewTechnicianDocument();
  const toast = useToast();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [statuses, setStatuses] = useState<Record<string, DocumentReviewStatus>>({});

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
      <CardHeader title="Verification documents" description="Review the documents submitted by this technician." />
      <CardBody className="space-y-5">
        {checklist.isLoading ? (
          <div className="flex justify-center py-4"><Spinner /></div>
        ) : checklist.isError ? (
          <ErrorState message={checklist.error.message} onRetry={() => checklist.refetch()} />
        ) : checklist.data ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              {checklist.data.complete ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <XCircle className="h-4 w-4 text-amber-600" />}
              {checklist.data.complete ? 'Ready for approval' : 'Verification incomplete'}
            </div>
            <ul className="mt-2 space-y-1 text-xs text-slate-600">
              {checklist.data.items.map((item) => (
                <li key={item.key} className="flex justify-between gap-3">
                  <span>{item.label}</span><span className={item.satisfied ? 'text-emerald-700' : 'text-amber-700'}>{item.detail}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {documents.isLoading ? (
          <div className="flex justify-center py-4"><Spinner /></div>
        ) : documents.isError ? (
          <ErrorState message={documents.error.message} onRetry={() => documents.refetch()} />
        ) : documents.data?.length ? (
          <div className="space-y-4">
            {documents.data.map((item) => (
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
                <div className="mt-3 grid gap-2 sm:grid-cols-[10rem_1fr_auto]">
                  <select
                    value={statuses[item.id] ?? (item.status === 'SUBMITTED' ? 'REVIEWING' : item.status)}
                    onChange={(event) => setStatuses((current) => ({ ...current, [item.id]: event.target.value as DocumentReviewStatus }))}
                    className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm"
                  >
                    {REVIEW_STATUSES.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
                  </select>
                  <input
                    value={notes[item.id] ?? item.reviewNote ?? ''}
                    onChange={(event) => setNotes((current) => ({ ...current, [item.id]: event.target.value }))}
                    placeholder="Review note (required when denying)"
                    className="h-9 rounded-md border border-slate-200 px-3 text-sm"
                  />
                  <Button size="sm" loading={review.isPending} onClick={() => submitReview(item)}>Save review</Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No documents have been submitted.</p>
        )}
      </CardBody>
    </Card>
  );
}
