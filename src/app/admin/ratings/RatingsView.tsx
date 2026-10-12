'use client';

import Link from 'next/link';
import { Star } from 'lucide-react';
import { Badge, Card, EmptyState, ErrorState, PageHeader } from '@/components/ui';
import { useJobs } from '@/hooks/useJobs';
import { formatDate } from '@/lib/utils';

const RATINGS_QUERY = { pageSize: 100 } as const;

export function RatingsView() {
  const jobs = useJobs(RATINGS_QUERY);
  const ratedJobs = (jobs.data?.items ?? []).filter((job) => job.rating);

  return (
    <>
      <PageHeader
        title="Customer ratings"
        description="Feedback customers submitted about technicians after their jobs."
      />

      <Card className="overflow-hidden">
        {jobs.isError ? (
          <ErrorState message={jobs.error.message} onRetry={() => jobs.refetch()} />
        ) : jobs.isPending ? (
          <ul className="divide-y divide-slate-100" aria-label="Loading customer ratings">
            {Array.from({ length: 3 }, (_, index) => (
              <li key={index} className="space-y-2 px-6 py-5">
                <span className="block h-4 w-48 animate-pulse rounded bg-slate-200" />
                <span className="block h-4 w-80 animate-pulse rounded bg-slate-200" />
              </li>
            ))}
          </ul>
        ) : ratedJobs.length === 0 ? (
          <EmptyState
            icon={Star}
            title="No customer ratings yet"
            description="Ratings and comments submitted by customers will appear here."
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {ratedJobs.map((job) => {
              const rating = job.rating!;
              const ratedAt = [...job.events].reverse().find((event) => event.title === 'Customer rating')?.at;

              return (
                <li key={job.id}>
                  <Link
                    href={`/admin/jobs/${job.id}`}
                    className="block px-6 py-5 transition-colors hover:bg-slate-50"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900">{job.customer.name}</p>
                          <span className="text-sm text-slate-500">rated</span>
                          <p className="text-sm font-medium text-slate-900">
                            {job.technician?.name ?? 'Technician'}
                          </p>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {job.reference} · {job.service}
                          {ratedAt ? ` · ${formatDate(ratedAt)}` : ''}
                        </p>
                      </div>
                      <Badge tone="warning">
                        <span className="inline-flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-current" aria-hidden />
                          {rating.overall}/5
                        </span>
                      </Badge>
                    </div>
                    {rating.comment && (
                      <p className="mt-3 text-sm text-slate-700">&ldquo;{rating.comment}&rdquo;</p>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
