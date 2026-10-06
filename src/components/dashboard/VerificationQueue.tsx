'use client';

import Link from 'next/link';
import { BadgeCheck, ChevronRight } from 'lucide-react';
import { Avatar, Card, CardHeader, EmptyState, ErrorState } from '@/components/ui';
import { useTechnicians } from '@/hooks/useTechnicians';
import { formatRelative } from '@/lib/utils';
import type { Technician } from '@/types/technician';

// The list API sorts by account creation date, not application date, so fetch the
// pending technicians and order them by when they applied here.
const PENDING_QUERY = { verification: 'pending', pageSize: 100 } as const;
const SHOWN = 5;

const appliedAt = (t: Technician) => Date.parse(t.verification.submittedAt ?? t.createdAt);

/** Technicians waiting longest for approval, so the admin can review them first. */
export function VerificationQueue() {
  const { data, isPending, isError, error, refetch } = useTechnicians(PENDING_QUERY);
  const items = [...(data?.items ?? [])].sort((a, b) => appliedAt(a) - appliedAt(b)).slice(0, SHOWN);

  return (
    <Card>
      <CardHeader
        title="Verification queue"
        description="Technicians who cannot receive jobs until approved"
        action={
          <Link
            href="/admin/technicians?verification=pending"
            className="shrink-0 text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            View all
          </Link>
        }
      />

      {isPending ? (
        <ul className="divide-y divide-slate-100" aria-label="Loading">
          {Array.from({ length: 3 }, (_, i) => (
            <li key={i} className="flex items-center gap-4 px-6 py-4">
              <span className="h-9 w-9 animate-pulse rounded-full bg-slate-200" />
              <span className="h-4 w-40 animate-pulse rounded bg-slate-200" />
            </li>
          ))}
        </ul>
      ) : isError ? (
        <ErrorState title="Could not load technicians" message={error.message} onRetry={() => refetch()} />
      ) : items.length === 0 ? (
        <EmptyState icon={BadgeCheck} title="All caught up" description="No technicians are waiting for verification." />
      ) : (
        <ul className="divide-y divide-slate-100">
          {items.map((technician) => (
            <li key={technician.id}>
              <Link
                href={`/admin/technicians/${technician.id}`}
                className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-slate-50"
              >
                <Avatar name={technician.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{technician.name}</p>
                  <p className="truncate text-xs text-slate-500">{technician.trades.join(', ')}</p>
                </div>
                <span className="hidden text-xs text-slate-500 sm:block">
                  Applied {formatRelative(technician.verification.submittedAt)}
                </span>
                <ChevronRight className="h-4 w-4 text-slate-400" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
