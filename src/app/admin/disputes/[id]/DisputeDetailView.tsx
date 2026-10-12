'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight, CheckCircle2, MessagesSquare, Quote, Scale, Star } from 'lucide-react';
import { CustomerRatingForm } from '@/components/disputes/CustomerRatingForm';
import { JobTimeline } from '@/components/jobs/JobTimeline';
import { QuoteDetails } from '@/components/jobs/QuoteDetails';
import { Badge, Card, CardBody, CardHeader, EmptyState, ErrorState, Spinner } from '@/components/ui';
import { useDispute } from '@/hooks/useDisputes';
import { approvedTotal, billedTotal, formatMoney } from '@/lib/jobs';
import { formatDate, formatRelative } from '@/lib/utils';
import { DISPUTE_OUTCOME_LABEL } from '@/types/job';

function BackLink() {
  return (
    <Link href="/admin/disputes" className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900">
      <ArrowLeft className="h-4 w-4" aria-hidden />
      Disputes
    </Link>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="text-right text-sm font-medium text-slate-900">{value}</dd>
    </div>
  );
}

export function DisputeDetailView({ jobId }: { jobId: string }) {
  const { data, isLoading, isError, error, refetch } = useDispute(jobId);

  if (isLoading) {
    return (
      <>
        <BackLink />
        <div className="flex justify-center py-24">
          <Spinner size="lg" />
        </div>
      </>
    );
  }

  if (isError || !data) {
    const notFound = (error as { statusCode?: number } | null)?.statusCode === 404;
    return (
      <>
        <BackLink />
        <Card>
          {notFound ? (
            <EmptyState icon={Scale} title="Dispute not found" description="This job has no dispute." />
          ) : (
            <ErrorState message={error?.message} onRetry={() => refetch()} />
          )}
        </Card>
      </>
    );
  }

  const { job, chat } = data;
  const dispute = job.dispute!;
  const resolution = dispute.resolution;
  const opener = dispute.openedBy === 'customer' ? job.customer.name : job.technician?.name;
  // What the technician said about price before the job started: key evidence in a billing dispute.
  const priceMessages = chat?.messages.filter((m) => m.sender === 'technician' && m.text.includes('$')) ?? [];
  const billed = billedTotal(job);
  const approved = approvedTotal(job);

  return (
    <>
      <BackLink />
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dispute on {job.reference}</h1>
          {resolution ? <Badge tone="success">Resolved</Badge> : <Badge tone="danger">Open</Badge>}
        </div>
        <p className="mt-1 text-sm text-slate-500">
          {job.service} · {job.customer.name} vs {job.technician?.name ?? 'no technician'} ·{' '}
          <Link href={`/admin/jobs/${job.id}`} className="text-brand-600 hover:text-brand-700">
            Open job
          </Link>
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="The complaint" description={`Opened by ${opener} · ${formatRelative(dispute.openedAt)}`} />
            <CardBody>
              <blockquote className="flex gap-3 rounded-lg bg-red-50 p-4 text-sm text-red-800">
                <Quote className="h-5 w-5 shrink-0 text-red-400" aria-hidden />
                {dispute.reason}
              </blockquote>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="What was agreed in the chat" description="Before the job started" />
            <CardBody>
              {priceMessages.length > 0 ? (
                <ul className="space-y-2">
                  {priceMessages.map((m) => (
                    <li key={m.id} className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                      <span className="font-medium text-slate-900">{job.technician?.name}:</span> {m.text}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">No price was discussed in the chat.</p>
              )}
              {chat && (
                <Link
                  href={`/admin/chats/${chat.id}`}
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700"
                >
                  <MessagesSquare className="h-4 w-4" aria-hidden /> Read the full chat <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              )}
            </CardBody>
          </Card>

          {job.quote && (
            <Card>
              <CardHeader title="Quote and extra work" description="Extra work must be approved by the customer (§9)" />
              <CardBody>
                <QuoteDetails job={job} />
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader title="Timeline" description="Every step of the job, newest first" />
            <CardBody>
              <JobTimeline events={job.events} />
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Amounts" />
            <CardBody>
              <dl className="divide-y divide-slate-100">
                <Row label="Visit fee (paid)" value={formatMoney(job.visitFee)} />
                <Row label="Approved repair work" value={formatMoney(approved)} />
                <Row label="Billed by technician" value={formatMoney(billed)} />
                {billed > approved && (
                  <Row label="Not approved" value={<span className="text-red-600">{formatMoney(billed - approved)}</span>} />
                )}
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={resolution ? 'Decision' : job.rating ? 'Customer rating' : 'Customer rating'} />
            <CardBody>
              {resolution ? (
                <div className="space-y-3">
                  <p className="flex items-center gap-2 text-sm font-semibold text-green-700">
                    <CheckCircle2 className="h-5 w-5" aria-hidden />
                    {DISPUTE_OUTCOME_LABEL[resolution.outcome]}
                  </p>
                  <dl className="divide-y divide-slate-100">
                    <Row label="Customer settles" value={formatMoney(resolution.amount)} />
                    <Row label="Decided by" value={resolution.resolvedBy} />
                    <Row label="Date" value={formatDate(resolution.resolvedAt)} />
                  </dl>
                  <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{resolution.note}</p>
                </div>
              ) : job.rating ? (
                <div className="space-y-4">
                  <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <Star className="h-5 w-5 fill-amber-400 text-amber-400" aria-hidden />
                    Rated by {job.customer.name}
                  </p>
                  <p className="text-2xl font-bold text-slate-900">{job.rating.overall}/5</p>
                  <p className="mt-2 text-sm italic text-slate-600">&ldquo;{job.rating.comment}&rdquo;</p>
                  <div className="mt-4">
                    <dl className="divide-y divide-slate-100">
                      <Row label="Quality" value={`${job.rating.quality}/5`} />
                      <Row label="Professionalism" value={`${job.rating.professionalism}/5`} />
                      <Row label="Arrival" value={`${job.rating.arrival}/5`} />
                      <Row label="Communication" value={`${job.rating.communication}/5`} />
                      <Row label="Value" value={`${job.rating.value}/5`} />
                    </dl>
                  </div>
                </div>
              ) : (
                <CustomerRatingForm job={job} />
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
