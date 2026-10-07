'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Clock, Radar, Siren, UserRoundCog, Users } from 'lucide-react';
import { JobStatusBadge, UrgencyBadge } from '@/components/jobs/JobStatusBadge';
import { ReassignDialog } from '@/components/jobs/ReassignDialog';
import {
  Badge,
  Button,
  Card,
  CardBody,
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
import { SERVICE_CATEGORIES, type ServiceCategory } from '@/config/services';
import { useJobs } from '@/hooks/useJobs';
import { useTechnicians } from '@/hooks/useTechnicians';
import { formatWait, isOverdue } from '@/lib/jobs';
import { cn } from '@/lib/utils';
import type { Job } from '@/types/job';

const QUEUE_QUERY = { group: 'matching', pageSize: 100 } as const;
const VERIFIED_QUERY = { verification: 'verified', status: 'active', pageSize: 100 } as const;

/** Emergencies first, then whoever has waited longest. */
function byPriority(a: Job, b: Job): number {
  const urgent = Number(b.urgency === 'Emergency') - Number(a.urgency === 'Emergency');
  return urgent || Date.parse(a.createdAt) - Date.parse(b.createdAt);
}

/** Matching factors from the Project Description §6, shown so admins know what the system weighs. */
const FACTORS = [
  ['Skill', 'Can do the requested service'],
  ['Availability', 'LIVE and free to take work'],
  ['Distance / ETA', 'Can realistically reach the customer'],
  ['Rating & history', 'Track record on past jobs'],
  ['Workload', 'No overlapping job'],
] as const;

export function MatchingView() {
  const router = useRouter();
  const jobs = useJobs(QUEUE_QUERY);
  const technicians = useTechnicians(VERIFIED_QUERY);
  const [assigning, setAssigning] = useState<Job | null>(null);

  const queue = useMemo(() => [...(jobs.data?.items ?? [])].sort(byPriority), [jobs.data]);

  // Verified technicians and how many are LIVE, per service.
  const coverage = useMemo(() => {
    const counts = Object.fromEntries(SERVICE_CATEGORIES.map((s) => [s, { verified: 0, live: 0 }])) as Record<
      ServiceCategory,
      { verified: number; live: number }
    >;
    for (const t of technicians.data?.items ?? []) {
      for (const trade of t.trades) {
        counts[trade].verified += 1;
        if (t.isAvailable) counts[trade].live += 1;
      }
    }
    return counts;
  }, [technicians.data]);

  const waiting = queue.filter((j) => j.status !== 'OFFERED');
  const offered = queue.filter((j) => j.status === 'OFFERED');
  const overdue = queue.filter((j) => isOverdue(j));
  const emergencies = queue.filter((j) => j.urgency === 'Emergency');
  const gaps = SERVICE_CATEGORIES.filter((s) => coverage[s].live === 0);
  const loading = jobs.isPending || technicians.isPending;

  return (
    <>
      <PageHeader
        title="Matching"
        description="Requests waiting for a technician. Emergencies and the longest waits are at the top."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Waiting for a match" value={waiting.length} hint="No technician has accepted yet" icon={Radar} loading={loading} />
        <StatCard label="Offered" value={offered.length} hint="Waiting for the technician to accept" icon={Users} loading={loading} />
        <StatCard label="Waiting too long" value={overdue.length} hint="Over 15 min (emergency) or 1 hour" icon={Clock} loading={loading} />
        <StatCard label="Emergencies" value={emergencies.length} hint="Customers who need help now" icon={Siren} loading={loading} />
      </div>

      <Card className="mt-6 overflow-hidden">
        <CardHeader title="Matching queue" description="Click a request to see it, or assign a technician yourself" />
        {jobs.isError ? (
          <ErrorState message={jobs.error.message} onRetry={() => jobs.refetch()} />
        ) : !loading && queue.length === 0 ? (
          <EmptyState icon={Radar} title="Nobody is waiting" description="Every request has a technician." />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Request</Th>
                <Th>Service</Th>
                <Th>Status</Th>
                <Th>Waiting</Th>
                <Th>Technicians LIVE</Th>
                <Th>
                  <span className="sr-only">Action</span>
                </Th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton columns={6} rows={4} />
              ) : (
                queue.map((job) => {
                  const late = isOverdue(job);
                  // A service added by the admin has no technicians until they add it as a trade.
                  const live = coverage[job.service as ServiceCategory]?.live ?? 0;
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
                        <span className={cn('inline-flex items-center gap-1.5', late ? 'font-semibold text-red-600' : 'text-slate-600')}>
                          {late && <AlertTriangle className="h-4 w-4" aria-hidden />}
                          {formatWait(job.createdAt)}
                        </span>
                        {late && <span className="sr-only"> (waiting too long)</span>}
                      </Td>
                      <Td>
                        {live > 0 ? (
                          <span className="text-slate-600">{live}</span>
                        ) : (
                          <Badge tone="danger">None</Badge>
                        )}
                      </Td>
                      <Td className="text-right">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAssigning(job);
                          }}
                        >
                          <UserRoundCog className="h-4 w-4" aria-hidden />
                          {job.technician ? 'Reassign' : 'Assign'}
                        </Button>
                      </Td>
                    </Tr>
                  );
                })
              )}
            </tbody>
          </Table>
        )}
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Coverage" description="Verified technicians per service, and how many are LIVE now" />
          {technicians.isError ? (
            <ErrorState message={technicians.error.message} onRetry={() => technicians.refetch()} />
          ) : (
            <CardBody>
              {gaps.length > 0 && !loading && (
                <div className="mb-4 flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden />
                  <p>
                    <span className="font-semibold">No LIVE technician for {gaps.join(', ')}.</span> Requests for these
                    services cannot be matched until a verified technician goes LIVE.{' '}
                    <Link href="/admin/technicians?verification=pending" className="font-medium underline">
                      Review pending verifications
                    </Link>
                  </p>
                </div>
              )}
              <ul className="grid gap-2 sm:grid-cols-2">
                {SERVICE_CATEGORIES.map((service) => {
                  const { verified, live } = coverage[service];
                  return (
                    <li key={service} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5">
                      <span className="text-sm font-medium text-slate-900">{service}</span>
                      {loading ? (
                        <span className="h-4 w-20 animate-pulse rounded bg-slate-200" aria-label="Loading" />
                      ) : (
                        <span className="text-xs text-slate-500">
                          <span className={cn('font-semibold', live ? 'text-green-700' : 'text-red-600')}>{live} LIVE</span>
                          {' · '}
                          {verified} verified
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </CardBody>
          )}
        </Card>

        <Card>
          <CardHeader title="How matching works" description="What Fundi weighs when offering a job" />
          <CardBody>
            <ul className="space-y-3">
              {FACTORS.map(([factor, detail]) => (
                <li key={factor}>
                  <p className="text-sm font-medium text-slate-900">{factor}</p>
                  <p className="text-xs text-slate-500">{detail}</p>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>

      {assigning && <ReassignDialog job={assigning} open onClose={() => setAssigning(null)} />}
    </>
  );
}
