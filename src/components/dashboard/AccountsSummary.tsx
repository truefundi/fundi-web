'use client';

import Link from 'next/link';
import { Ban, ChevronRight, HardHat, Users, type LucideIcon } from 'lucide-react';
import { Card, CardHeader, ErrorState } from '@/components/ui';
import { useAdminStats } from '@/hooks/useCustomers';
import type { AdminStats } from '@/types/api';

const rows: Array<{ label: string; key: keyof AdminStats; href: string; icon: LucideIcon }> = [
  { label: 'Customers', key: 'totalCustomers', href: '/admin/customers', icon: Users },
  { label: 'Technicians', key: 'totalTechnicians', href: '/admin/technicians', icon: HardHat },
  { label: 'Suspended accounts', key: 'suspendedAccounts', href: '/admin/customers?status=suspended', icon: Ban },
];

export function AccountsSummary() {
  const { data, isPending, isError, error, refetch } = useAdminStats();

  return (
    <Card>
      <CardHeader title="Accounts" description="Everyone registered on Fundi" />
      {isError ? (
        <ErrorState title="Could not load accounts" message={error.message} onRetry={() => refetch()} />
      ) : (
        <ul className="divide-y divide-slate-100">
          {rows.map(({ label, key, href, icon: Icon }) => (
            <li key={key}>
              <Link href={href} className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-slate-50">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="flex-1 text-sm font-medium text-slate-900">{label}</span>
                {isPending ? (
                  <span className="h-5 w-8 animate-pulse rounded bg-slate-200" aria-label="Loading" />
                ) : (
                  <span className="text-lg font-bold text-slate-900">{data[key]}</span>
                )}
                <ChevronRight className="h-4 w-4 text-slate-400" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
