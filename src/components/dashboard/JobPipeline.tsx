import { ChevronRight } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui';

/** The core Fundi experience (Project Description §1). */
const stages = ['Request', 'Match', 'Accept', 'Visit', 'Diagnose', 'Quote', 'Approve', 'Repair', 'Settle', 'Rate'];

export function JobPipeline() {
  return (
    <Card>
      <CardHeader title="Job Pipeline" description="How many jobs are at each stage of the Fundi lifecycle right now" />
      <div className="overflow-x-auto px-6 py-5">
        <ol className="flex min-w-max items-center gap-1">
          {stages.map((stage, i) => (
            <li key={stage} className="flex items-center gap-1">
              <div className="w-20 rounded-lg border border-slate-200 bg-slate-50 px-2 py-3 text-center">
                <p className="text-lg font-bold text-slate-900">—</p>
                <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-500">{stage}</p>
              </div>
              {i < stages.length - 1 && <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" aria-hidden />}
            </li>
          ))}
        </ol>
      </div>
    </Card>
  );
}
