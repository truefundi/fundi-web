import type { LucideIcon } from 'lucide-react';
import { Card, PageHeader } from '@/components/ui';

/** Scaffold for admin sections that are awaiting backend integration. */
export function PlaceholderPage({
  title,
  description,
  icon: Icon,
  actions,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  /** Short labels for what the admin will be able to do here. */
  actions: string[];
}) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <Card className="flex flex-col items-center px-6 py-14 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <Icon className="h-6 w-6" aria-hidden />
        </span>
        <h2 className="mt-4 text-sm font-semibold text-slate-900">Coming soon</h2>
        <ul className="mt-4 flex max-w-lg flex-wrap justify-center gap-2">
          {actions.map((action) => (
            <li key={action} className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600">
              {action}
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
