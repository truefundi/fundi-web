'use client';

import { ChevronRight } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui';
import { useJobPipeline } from '@/hooks/useDashboard';

export function JobPipeline() {
  const { data, isLoading, isError } = useJobPipeline();
  const stages = data?.stages ?? [];

  return (
    <Card>
      <CardHeader title="Job Pipeline" description="How many jobs are at each stage of the Fundi lifecycle right now" />
      <div className="overflow-x-auto px-6 py-5">
        <ol className="flex min-w-max items-center gap-1">
          {isLoading || isError ? (
            <li className="text-sm text-slate-500">
              {isLoading ? 'Loading pipeline...' : 'Unable to load pipeline data.'}
            </li>
          ) : stages.map((stage, i) => (
            <li key={stage.key} className="flex items-center gap-1">
              <div className="w-20 rounded-lg border border-slate-200 bg-slate-50 px-2 py-3 text-center" title={stage.description}>
                <p className="text-lg font-bold text-slate-900">{stage.count ?? '—'}</p>
                <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-500">{stage.label}</p>
              </div>
              {i < stages.length - 1 && <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" aria-hidden />}
            </li>
          ))}
        </ol>
      </div>
    </Card>
  );
}
