import Link from 'next/link';
import { cn } from '@/lib/utils';

export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <Link
      href="/"
      className={cn(
        'inline-flex items-center gap-3 rounded-xl px-3 py-2.5',
        dark ? 'bg-slate-900/20' : 'bg-slate-100',
      )}
      aria-label="Fundi home"
    >
      <img
        src="/images/logo1.jpeg"
        alt="Fundi logo"
        className="h-12 w-12 rounded-lg object-cover shadow-sm"
      />
      <span className={cn('text-3xl font-bold tracking-tight', dark ? 'text-white' : 'text-slate-900')}>Fundi</span>
    </Link>
  );
}
