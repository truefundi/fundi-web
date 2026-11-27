'use client';

import Link from 'next/link';
import { Briefcase, CheckCircle2, ChevronRight, Info, Scale, type LucideIcon } from 'lucide-react';
import { Card, CardHeader, ErrorState } from '@/components/ui';
import { useJobSummary } from '@/hooks/useDashboard';
import type { JobSummary } from '@/types/api';

const rows: Array<{ label: string; key: keyof JobSummary; href: string; icon: LucideIcon }> = [
  { label: 'Active jobs', key: 'active', href: '/admin/jobs', icon: Briefcase },
  { label: 'Completed jobs', key: 'completed', href: '/admin/jobs', icon: CheckCircle2 },
  { label: 'Open disputes', key: 'openDisputes', href: '/admin/disputes', icon: Scale },
];

/** Job counts; shows placeholders for any figure the jobs API cannot provide yet. */
export function JobsSummary() {
  const { data, isPending, isError, error, refetch } = useJobSummary();
  const waitingForApi = data && rows.some(({ key }) => data[key] === null);

  return (
    <Card>
      <CardHeader title="Jobs" description="Work happening on the platform" />
      {isError ? (
        <ErrorState title="Could not load jobs" message={error.message} onRetry={() => refetch()} />
      ) : (
        <>
          <ul className="divide-y divide-slate-100">
            {rows.map(({ label, key, href, icon: Icon }) => (
              <li key={key}>
                <Link href={href} className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-slate-50">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="flex-1 text-sm font-medium text-slate-900">{label}</span>
                  {isPending ? (
                    <span className="h-5 w-8 animate-pulse rounded bg-slate-200" aria-label="Loading" />
                  ) : (
                    <span className="text-lg font-bold text-slate-900">{data[key] ?? '—'}</span>
                  )}
                  <ChevronRight className="h-4 w-4 text-slate-400" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
          {waitingForApi && (
            <p className="flex items-start gap-2 border-t border-slate-100 px-6 py-3 text-xs text-slate-500">
              <Info className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
              Job figures will appear when the jobs API is ready.
            </p>
          )}
        </>
      )}
    </Card>
  );
}
