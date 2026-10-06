'use client';

import { BadgeCheck, HardHat, Users, UsersRound } from 'lucide-react';
import { Card, ErrorState, StatCard } from '@/components/ui';
import { useAdminStats } from '@/hooks/useCustomers';
import { useTechnicians } from '@/hooks/useTechnicians';

/** Technicians who can receive a job right now: verified, active and switched to LIVE. */
const LIVE_QUERY = { verification: 'verified', status: 'active', available: true, pageSize: 1 } as const;

/** Key platform statistics: users, customers, technicians and pending approvals. */
export function DashboardStats() {
  const stats = useAdminStats();
  const live = useTechnicians(LIVE_QUERY);

  if (stats.isError) {
    return (
      <Card>
        <ErrorState
          title="Could not load platform statistics"
          message={stats.error.message}
          onRetry={() => stats.refetch()}
        />
      </Card>
    );
  }

  const data = stats.data;
  const loading = stats.isPending;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Total users"
        value={data?.totalUsers ?? '—'}
        hint={data ? `${data.totalCustomers} customers · ${data.totalTechnicians} technicians` : 'Customers and technicians'}
        icon={UsersRound}
        loading={loading}
      />
      <StatCard
        label="Customers"
        value={data?.totalCustomers ?? '—'}
        hint="People who request repairs"
        icon={Users}
        loading={loading}
      />
      <StatCard
        label="Technicians"
        value={data?.totalTechnicians ?? '—'}
        hint={live.data ? `${live.data.total} LIVE right now` : 'Skilled workers on Fundi'}
        icon={HardHat}
        loading={loading}
      />
      <StatCard
        label="Pending approvals"
        value={data?.pendingVerifications ?? '—'}
        hint="Technicians waiting for verification"
        icon={BadgeCheck}
        loading={loading}
      />
    </div>
  );
}
