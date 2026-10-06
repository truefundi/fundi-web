import type { LucideIcon } from 'lucide-react';
import { Card } from './Card';

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  loading = false,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  /** Shows a placeholder bar instead of the value while data loads. */
  loading?: boolean;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
      </div>
      {loading ? (
        <span className="mt-3 block h-8 w-16 animate-pulse rounded bg-slate-200" aria-label="Loading" />
      ) : (
        <p className="mt-3 text-2xl font-bold text-slate-900">{value}</p>
      )}
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </Card>
  );
}
