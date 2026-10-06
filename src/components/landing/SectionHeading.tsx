import { cn } from '@/lib/utils';

export function SectionHeading({
  eyebrow,
  title,
  description,
  dark = false,
  className,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  dark?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('mx-auto max-w-2xl text-center', className)}>
      <p className={cn('text-sm font-semibold uppercase tracking-wider', dark ? 'text-brand-400' : 'text-brand-600')}>
        {eyebrow}
      </p>
      <h2 className={cn('mt-3 text-3xl font-bold tracking-tight sm:text-4xl', dark ? 'text-white' : 'text-slate-900')}>
        {title}
      </h2>
      {description && (
        <p className={cn('mt-4 text-base sm:text-lg', dark ? 'text-slate-300' : 'text-slate-600')}>{description}</p>
      )}
    </div>
  );
}
