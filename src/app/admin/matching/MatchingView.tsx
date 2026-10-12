'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Clock, Radar, Siren, Users } from 'lucide-react';
import { JobStatusBadge, UrgencyBadge } from '@/components/jobs/JobStatusBadge';
import {
  Card,
  CardHeader,
  EmptyState,
  ErrorState,
  PageHeader,
  StatCard,
  Table,
  TableSkeleton,
  Td,
  Th,
  Tr,
} from '@/components/ui';
import { useJobs } from '@/hooks/useJobs';
import { formatWait, isOverdue } from '@/lib/jobs';
import type { Job } from '@/types/job';

const QUEUE_QUERY = { group: 'matching', pageSize: 100 } as const;

/** Emergencies first, then whoever has waited longest. */
function byPriority(a: Job, b: Job): number {
  const urgent = Number(b.urgency === 'Emergency') - Number(a.urgency === 'Emergency');
  return urgent || Date.parse(a.createdAt) - Date.parse(b.createdAt);
}

export function MatchingView() {
  const router = useRouter();
  const jobs = useJobs(QUEUE_QUERY);

  const queue = useMemo(() => [...(jobs.data?.items ?? [])].sort(byPriority), [jobs.data]);

  const waiting = queue.filter((j) => j.status === 'REQUESTED');
  const offered = queue.filter((j) => j.status === 'MATCHING' || j.status === 'OFFERED');
  const overdue = queue.filter((j) => isOverdue(j));
  const emergencies = queue.filter((j) => j.urgency === 'Emergency');
  const loading = jobs.isPending;

  return (
    <>
      <PageHeader
        title="Customer negotiation"
        description="The customer looks for a technician, negotiates the terms, and only then confirms the match. The system does not auto-assign a technician."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Waiting for negotiation" value={waiting.length} hint="Customer is still reviewing options" icon={Radar} loading={loading} />
        <StatCard label="In negotiation" value={offered.length} hint="Customer and technician are discussing terms" icon={Users} loading={loading} />
        <StatCard label="Waiting too long" value={overdue.length} hint="Over 15 min (emergency) or 1 hour" icon={Clock} loading={loading} />
        <StatCard label="Emergencies" value={emergencies.length} hint="Customers who need help now" icon={Siren} loading={loading} />
      </div>

      <Card className="mt-6 overflow-hidden">
        <CardHeader title="Negotiation queue" description="View customer requests in the matching queue." />
        {jobs.isError ? (
          <ErrorState message={jobs.error.message} onRetry={() => jobs.refetch()} />
        ) : !loading && queue.length === 0 ? (
          <EmptyState icon={Radar} title="Nobody is waiting" description="Every request has already moved past the matching stage." />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Request</Th>
                <Th>Service</Th>
                <Th>Status</Th>
                <Th>Waiting</Th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton columns={4} rows={4} />
              ) : (
                queue.map((job) => {
                  const late = isOverdue(job);
                  return (
                    <Tr key={job.id} onClick={() => router.push(`/admin/jobs/${job.id}`)} label={`Open job ${job.reference}`}>
                      <Td>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-slate-900">{job.reference}</p>
                          {job.urgency === 'Emergency' && <UrgencyBadge urgency={job.urgency} />}
                        </div>
                        <p className="max-w-[16rem] truncate text-xs text-slate-500">
                          {job.problem} · {job.location}
                        </p>
                      </Td>
                      <Td className="whitespace-nowrap text-slate-600">{job.service}</Td>
                      <Td>
                        <JobStatusBadge status={job.status} />
                        {job.technician && <p className="mt-1 text-xs text-slate-500">{job.technician.name}</p>}
                      </Td>
                      <Td className="whitespace-nowrap">
                        <span className={late ? 'inline-flex items-center gap-1.5 font-semibold text-red-600' : 'inline-flex items-center gap-1.5 text-slate-600'}>
                          {late && <AlertTriangle className="h-4 w-4" aria-hidden />}
                          {formatWait(job.createdAt)}
                        </span>
                        {late && <span className="sr-only"> (waiting too long)</span>}
                      </Td>
                    </Tr>
                  );
                })
              )}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
