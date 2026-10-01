import { Spinner } from '@/components/ui';

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <Spinner size="lg" />
      <p className="mt-4 text-sm font-medium text-slate-500">Loading…</p>
    </div>
  );
}
