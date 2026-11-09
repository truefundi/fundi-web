
'use client';

import { useMemo, useState } from 'react';
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

type QueueFilter = 'all' | 'waiting' | 'offered' | 'overdue' | 'emergencies';

/** Emergencies first, then whoever has waited longest. */
function byPriority(a: Job, b: Job): number {
  const urgent =
    Number(b.urgency === 'Emergency') - Number(a.urgency === 'Emergency');

  return urgent || Date.parse(a.createdAt) - Date.parse(b.createdAt);
}

export function MatchingView() {
  const router = useRouter();
  const jobs = useJobs(QUEUE_QUERY);

  const [selectedFilter, setSelectedFilter] = useState<QueueFilter>('all');

  const queue = useMemo(
    () => [...(jobs.data?.items ?? [])].sort(byPriority),
    [jobs.data]
  );

  const waiting = queue.filter((j) => j.status === 'REQUESTED');

  const offered = queue.filter(
    (j) => j.status === 'MATCHING' || j.status === 'OFFERED'
  );

  const overdue = queue.filter((j) => isOverdue(j));

  const emergencies = queue.filter((j) => j.urgency === 'Emergency');

  const filteredQueue = useMemo(() => {
    switch (selectedFilter) {
      case 'waiting':
        return queue.filter((job) => job.status === 'REQUESTED');

      case 'offered':
        return queue.filter(
          (job) => job.status === 'MATCHING' || job.status === 'OFFERED'
        );

      case 'overdue':
        return queue.filter((job) => isOverdue(job));

      case 'emergencies':
        return queue.filter((job) => job.urgency === 'Emergency');

      default:
        return queue;
    }
  }, [queue, selectedFilter]);

  const loading = jobs.isPending;

  const toggleFilter = (filter: QueueFilter) => {
    setSelectedFilter((current) => (current === filter ? 'all' : filter));
  };

  return (
    <>
      <PageHeader
        title="Customer negotiation"
        description="The customer looks for a technician, negotiates the terms, and only then confirms the match. The system does not auto-assign a technician."
      />

      {/* Summary cards */}
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <button
          type="button"
          onClick={() => toggleFilter('waiting')}
          aria-pressed={selectedFilter === 'waiting'}
          className={`min-w-0 rounded-xl text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            selectedFilter === 'waiting'
              ? 'ring-2 ring-blue-500 ring-offset-2'
              : 'hover:-translate-y-0.5'
          }`}
        >
          <StatCard
            label="Waiting for negotiation"
            value={waiting.length}
            hint="Customer is still reviewing options"
            icon={Radar}
            loading={loading}
          />
        </button>

        <button
          type="button"
          onClick={() => toggleFilter('offered')}
          aria-pressed={selectedFilter === 'offered'}
          className={`min-w-0 rounded-xl text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            selectedFilter === 'offered'
              ? 'ring-2 ring-blue-500 ring-offset-2'
              : 'hover:-translate-y-0.5'
          }`}
        >
          <StatCard
            label="In negotiation"
            value={offered.length}
            hint="Customer and technician are discussing terms"
            icon={Users}
            loading={loading}
          />
        </button>

        <button
          type="button"
          onClick={() => toggleFilter('overdue')}
          aria-pressed={selectedFilter === 'overdue'}
          className={`min-w-0 rounded-xl text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            selectedFilter === 'overdue'
              ? 'ring-2 ring-blue-500 ring-offset-2'
              : 'hover:-translate-y-0.5'
          }`}
        >
          <StatCard
            label="Waiting too long"
            value={overdue.length}
            hint="Over 15 min (emergency) or 1 hour"
            icon={Clock}
            loading={loading}
          />
        </button>

        <button
          type="button"
          onClick={() => toggleFilter('emergencies')}
          aria-pressed={selectedFilter === 'emergencies'}
          className={`min-w-0 rounded-xl text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            selectedFilter === 'emergencies'
              ? 'ring-2 ring-blue-500 ring-offset-2'
              : 'hover:-translate-y-0.5'
          }`}
        >
          <StatCard
            label="Emergencies"
            value={emergencies.length}
            hint="Customers who need help now"
            icon={Siren}
            loading={loading}
          />
        </button>
      </div>

      {/* Negotiation queue */}
      <Card className="mt-6 overflow-hidden">
        <CardHeader
          title="Negotiation queue"
          description={
            selectedFilter === 'all'
              ? 'View all customer requests in the matching queue.'
              : `Showing ${selectedFilter} jobs. Click the selected summary card again to clear the filter.`
          }
        />

        {jobs.isError ? (
          <ErrorState
            message={jobs.error.message}
            onRetry={() => jobs.refetch()}
          />
        ) : !loading && filteredQueue.length === 0 ? (
          <EmptyState
            icon={Radar}
            title="No matching requests"
            description="There are no jobs in this category right now."
          />
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
                filteredQueue.map((job) => {
                  const late = isOverdue(job);

                  return (
                    <Tr
                      key={job.id}
                      onClick={() => router.push(`/admin/jobs/${job.id}`)}
                      label={`Open job ${job.reference}`}
                    >
                      <Td>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-slate-900">
                            {job.reference}
                          </p>
                          {job.urgency === 'Emergency' && (
                            <UrgencyBadge urgency={job.urgency} />
                          )}
                        </div>

                        <p className="max-w-[16rem] truncate text-xs text-slate-500">
                          {job.problem} · {job.location}
                        </p>
                      </Td>

                      <Td className="whitespace-nowrap text-slate-600">
                        {job.service}
                      </Td>

                      <Td>
                        <JobStatusBadge status={job.status} />
                        {job.technician && (
                          <p className="mt-1 text-xs text-slate-500">
                            {job.technician.name}
                          </p>
                        )}
                      </Td>

                      <Td className="whitespace-nowrap">
                        <span
                          className={
                            late
                              ? 'inline-flex items-center gap-1.5 font-semibold text-red-600'
                              : 'inline-flex items-center gap-1.5 text-slate-600'
                          }
                        >
                          {late && (
                            <AlertTriangle className="h-4 w-4" aria-hidden />
                          )}
                          {formatWait(job.createdAt)}
                        </span>

                        {late && (
                          <span className="sr-only">
                            {' '}
                            (waiting too long)
                          </span>
                        )}
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
