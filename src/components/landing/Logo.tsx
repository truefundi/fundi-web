import Link from 'next/link';
import { cn } from '@/lib/utils';

export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="Fundi home">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-lg font-bold text-white">F</span>
      <span className={cn('text-xl font-bold tracking-tight', dark ? 'text-white' : 'text-slate-900')}>Fundi</span>
    </Link>
  );
}
