'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft, Ban, Briefcase, MapPin, Star, UserRoundCog } from 'lucide-react';
import { JobStatusBadge, UrgencyBadge } from '@/components/jobs/JobStatusBadge';
import { JobTimeline } from '@/components/jobs/JobTimeline';
import { QuoteDetails } from '@/components/jobs/QuoteDetails';
import { ReassignDialog } from '@/components/jobs/ReassignDialog';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Spinner,
  useToast,
} from '@/components/ui';
import { useCancelJob, useJob } from '@/hooks/useJobs';
import { canCancel, canReassign, COMMISSION_RATE, formatMoney, repairTotal, visitFeeSplit } from '@/lib/jobs';
import { formatDate, formatPhone } from '@/lib/utils';
import type { Job } from '@/types/job';

function BackLink() {
  return (
    <Link
      href="/admin/jobs"
      className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden />
      Jobs
    </Link>
  );
}

function Details({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <dl className="divide-y divide-slate-100">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
          <dt className="text-sm text-slate-500">{label}</dt>
          <dd className="text-right text-sm font-medium text-slate-900">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function ExceptionBanner({ job }: { job: Job }) {
  if (job.status === 'DISPUTED') {
    const dispute = [...job.events].reverse().find((e) => e.status === 'DISPUTED');
    return (
      <div className="mb-6 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4" role="alert">
        <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" aria-hidden />
        <div>
          <p className="text-sm font-semibold text-red-800">This job is disputed</p>
          {dispute && <p className="mt-0.5 text-sm text-red-700">{dispute.text}</p>}
        </div>
      </div>
    );
  }
  if (job.status === 'CANCELLED') {
    return (
      <div className="mb-6 flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <Ban className="h-5 w-5 shrink-0 text-slate-500" aria-hidden />
        <div>
          <p className="text-sm font-semibold text-slate-800">This job was cancelled</p>
          {job.cancellationReason && <p className="mt-0.5 text-sm text-slate-600">{job.cancellationReason}</p>}
        </div>
      </div>
    );
  }
  return null;
}

export function JobDetailView({ id }: { id: string }) {
  const { data: job, isLoading, isError, error, refetch } = useJob(id);
  const cancelJob = useCancelJob();
  const toast = useToast();
  const [reassignOpen, setReassignOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

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

  if (isError || !job) {
    const notFound = (error as { statusCode?: number } | null)?.statusCode === 404;
    return (
      <>
        <BackLink />
        <Card>
          {notFound ? (
            <EmptyState icon={Briefcase} title="Job not found" description="It may have been removed." />
          ) : (
            <ErrorState message={error?.message} onRetry={() => refetch()} />
          )}
        </Card>
      </>
    );
  }

  const split = visitFeeSplit(job);
  const visitPaid = job.events.some((e) => e.status === 'VISIT_PAID');

  return (
    <>
      <BackLink />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{job.reference}</h1>
            <JobStatusBadge status={job.status} />
            <UrgencyBadge urgency={job.urgency} />
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {job.service} · Requested {formatDate(job.createdAt)}
          </p>
        </div>
        <div className="flex gap-2">
          {canReassign(job) && (
            <Button variant="secondary" onClick={() => setReassignOpen(true)}>
              <UserRoundCog className="h-4 w-4" aria-hidden />
              {job.technician ? 'Reassign' : 'Assign'}
            </Button>
          )}
          {canCancel(job) && (
            <Button variant="danger" onClick={() => setCancelOpen(true)}>
              <Ban className="h-4 w-4" aria-hidden />
              Cancel job
            </Button>
          )}
        </div>
      </div>

      <ExceptionBanner job={job} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Problem" />
            <CardBody>
              <p className="text-sm text-slate-700">{job.problem}</p>
              <p className="mt-3 flex items-center gap-1.5 text-sm text-slate-500">
                <MapPin className="h-4 w-4" aria-hidden /> {job.location}
              </p>
            </CardBody>
          </Card>

          {job.quote && (
            <Card>
              <CardHeader title="Diagnosis & quote" description="What the technician found and charged" />
              <CardBody>
                <QuoteDetails job={job} />
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader title="Timeline" description="Every step of this job, newest first" />
            <CardBody>
              <JobTimeline events={job.events} />
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="People" />
            <CardBody>
              <Details
                rows={[
                  ['Customer', job.customer.name],
                  ['Customer phone', formatPhone(job.customer.phone)],
                  [
                    'Technician',
                    job.technician ? (
                      <Link href={`/admin/technicians/${job.technician.id}`} className="text-brand-600 hover:text-brand-700">
                        {job.technician.name}
                      </Link>
                    ) : (
                      <span className="text-slate-400">Not assigned yet</span>
                    ),
                  ],
                  ...(job.technician
                    ? ([['Technician phone', formatPhone(job.technician.phone)]] as [string, React.ReactNode][])
                    : []),
                ]}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Payment" />
            <CardBody>
              <Details
                rows={[
                  ['Visit fee', formatMoney(job.visitFee)],
                  [`Fundi commission (${COMMISSION_RATE * 100}%)`, formatMoney(split.fundi)],
                  ['Technician share', formatMoney(split.technician)],
                  [
                    'Visit fee paid',
                    visitPaid ? job.visitPaymentMethod : <span className="text-slate-400">Not yet</span>,
                  ],
                  ['Repair total', job.quote ? formatMoney(repairTotal(job)) : <span className="text-slate-400">No quote yet</span>],
                  [
                    'Repair settled by',
                    job.settlementMethod ?? <span className="text-slate-400">Not recorded</span>,
                  ],
                ]}
              />
            </CardBody>
          </Card>

          {job.rating && (
            <Card>
              <CardHeader title="Customer rating" />
              <CardBody>
                <p className="flex items-center gap-1.5 text-2xl font-bold text-slate-900">
                  <Star className="h-6 w-6 fill-amber-400 text-amber-400" aria-hidden />
                  {job.rating.overall}/5
                </p>
                <p className="mt-2 text-sm italic text-slate-600">&ldquo;{job.rating.comment}&rdquo;</p>
                <div className="mt-4">
                  <Details
                    rows={[
                      ['Quality', `${job.rating.quality}/5`],
                      ['Professionalism', `${job.rating.professionalism}/5`],
                      ['Arrival', `${job.rating.arrival}/5`],
                      ['Communication', `${job.rating.communication}/5`],
                      ['Value', `${job.rating.value}/5`],
                    ]}
                  />
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      <ReassignDialog job={job} open={reassignOpen} onClose={() => setReassignOpen(false)} />
      <ConfirmDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title={`Cancel job ${job.reference}?`}
        description="The customer and technician will be notified. This cannot be undone."
        confirmLabel="Cancel job"
        destructive
        loading={cancelJob.isPending}
        reasonLabel="Reason for cancelling"
        reasonHint="The customer and technician will see this reason."
        onConfirm={(reason) =>
          cancelJob.mutate(
            { id: job.id, reason },
            {
              onSuccess: () => {
                toast(`Job ${job.reference} cancelled`);
                setCancelOpen(false);
              },
              onError: (err) => toast(err.message || 'Could not cancel the job', 'error'),
            },
          )
        }
      />
    </>
  );
}
