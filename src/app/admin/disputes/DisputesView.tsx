'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Scale } from 'lucide-react';
import { Badge, Card, EmptyState, ErrorState, PageHeader, SegmentedTabs } from '@/components/ui';
import { useDisputes } from '@/hooks/useDisputes';
import type { DisputeState } from '@/lib/api/endpoints/disputes';
import { approvedTotal, billedTotal, formatMoney } from '@/lib/jobs';
import { formatRelative } from '@/lib/utils';
import { DISPUTE_OUTCOME_LABEL } from '@/types/job';

export function DisputesView() {
  const [state, setState] = useState<DisputeState>('open');
  const open = useDisputes('open');
  const resolved = useDisputes('resolved');
  const current = state === 'open' ? open : resolved;

  return (
    <>
      <PageHeader
        title="Disputes"
        description="Disagreements between customers and technicians. Review the evidence and decide."
      />

      <div className="mb-4">
        <SegmentedTabs
          label="Dispute state"
          tabs={[
            { value: 'open', label: 'Open', count: open.data?.length },
            { value: 'resolved', label: 'Resolved', count: resolved.data?.length },
          ]}
          value={state}
          onChange={setState}
        />
      </div>

      <Card className="overflow-hidden">
        {current.isError ? (
          <ErrorState message={current.error.message} onRetry={() => current.refetch()} />
        ) : current.isPending ? (
          <ul className="divide-y divide-slate-100" aria-label="Loading">
            {Array.from({ length: 2 }, (_, i) => (
              <li key={i} className="space-y-2 px-6 py-5">
                <span className="block h-4 w-48 animate-pulse rounded bg-slate-200" />
                <span className="block h-4 w-80 animate-pulse rounded bg-slate-200" />
              </li>
            ))}
          </ul>
        ) : current.data.length === 0 ? (
          <EmptyState
            icon={Scale}
            title={state === 'open' ? 'No open disputes' : 'No resolved disputes yet'}
            description={state === 'open' ? 'Every disagreement has been settled.' : 'Decisions you make will appear here.'}
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {current.data.map((job) => {
              const billed = billedTotal(job);
              const approved = approvedTotal(job);
              const resolution = job.dispute?.resolution;
              return (
                <li key={job.id}>
                  <Link
                    href={`/admin/disputes/${job.id}`}
                    className="flex items-start gap-4 px-6 py-5 transition-colors hover:bg-slate-50"
                  >
                    <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
                      <Scale className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <p className="text-sm font-semibold text-slate-900">{job.reference}</p>
                        <span className="text-sm text-slate-500">
                          {job.customer.name} vs {job.technician?.name ?? 'no technician'} · {job.service}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-700">&ldquo;{job.dispute?.reason}&rdquo;</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {resolution
                          ? `Settled at ${formatMoney(resolution.amount)}`
                          : billed > approved
                            ? `Billed ${formatMoney(billed)} · approved ${formatMoney(approved)}`
                            : `Repair total ${formatMoney(billed)}`}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      {resolution ? (
                        <Badge tone="success">{DISPUTE_OUTCOME_LABEL[resolution.outcome]}</Badge>
                      ) : (
                        <Badge tone="danger">Open</Badge>
                      )}
                      <span className="text-xs text-slate-400">
                        {formatRelative(resolution?.resolvedAt ?? job.dispute?.openedAt)}
                      </span>
                    </div>
                    <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
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
