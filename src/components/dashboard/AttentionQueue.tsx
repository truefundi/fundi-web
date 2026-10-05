'use client';

import Link from 'next/link';
import { BadgeCheck, ChevronRight, HandCoins, Hourglass, Scale, type LucideIcon } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui';
import { useAdminStats } from '@/hooks/useCustomers';
import type { AdminStats } from '@/types/api';

interface AttentionItem {
  icon: LucideIcon;
  label: string;
  detail: string;
  href: string;
  /** Stat that supplies the count; items without one show "—" until jobs data exists. */
  stat?: keyof AdminStats;
}

const items: AttentionItem[] = [
  {
    icon: BadgeCheck,
    label: 'Technicians awaiting verification',
    detail: 'New sign-ups that cannot receive jobs until approved',
    href: '/admin/technicians?verification=pending',
    stat: 'pendingVerifications',
  },
  {
    icon: Hourglass,
    label: 'Unmatched requests',
    detail: 'Customers still waiting for a technician',
    href: '/admin/matching',
  },
  {
    icon: Scale,
    label: 'Open disputes',
    detail: 'Jobs where the customer or technician raised an issue',
    href: '/admin/disputes',
  },
  {
    icon: HandCoins,
    label: 'Unsettled repairs',
    detail: 'Completed jobs with no recorded settlement method',
    href: '/admin/payments',
  },
];

export function AttentionQueue() {
  const { data: stats, isPending } = useAdminStats();

  return (
    <Card>
      <CardHeader title="Needs Your Attention" description="Items waiting for an admin decision" />
      <ul className="divide-y divide-slate-100">
        {items.map(({ icon: Icon, label, detail, href, stat }) => (
          <li key={label}>
            <Link href={href} className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-slate-50">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900">{label}</p>
                <p className="text-xs text-slate-500">{detail}</p>
              </div>
              {stat && isPending ? (
                <span className="h-5 w-8 animate-pulse rounded bg-slate-200" aria-label="Loading" />
              ) : (
                <span className="text-lg font-bold text-slate-900">{(stat && stats?.[stat]) ?? '—'}</span>
              )}
              <ChevronRight className="h-4 w-4 text-slate-400" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
