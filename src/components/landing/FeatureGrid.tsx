import { cn } from '@/lib/utils';
import type { Feature } from './content';

export function FeatureGrid({ features, dark = false }: { features: Feature[]; dark?: boolean }) {
  return (
    <ul className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
      {features.map(({ icon: Icon, title, description }) => (
        <li key={title} className="flex gap-4">
          <span
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
              dark ? 'bg-brand-500/15 text-brand-400' : 'bg-brand-50 text-brand-600',
            )}
          >
            <Icon className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h3 className={cn('text-base font-semibold', dark ? 'text-white' : 'text-slate-900')}>{title}</h3>
            <p className={cn('mt-1.5 text-sm leading-6', dark ? 'text-slate-300' : 'text-slate-600')}>{description}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
