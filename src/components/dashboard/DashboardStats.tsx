'use client';

import { BadgeCheck, Briefcase, CircleDot, Scale } from 'lucide-react';
import { StatCard } from '@/components/ui';
import { useAdminStats } from '@/hooks/useCustomers';
import { useTechnicians } from '@/hooks/useTechnicians';

/** Technicians who can receive a job right now: verified, active and switched to LIVE. */
const LIVE_QUERY = { verification: 'verified', status: 'active', available: true, pageSize: 1 } as const;

export function DashboardStats() {
  const stats = useAdminStats();
  const live = useTechnicians(LIVE_QUERY);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {/* Jobs and disputes have no API or mock data yet. */}
      <StatCard label="Active Jobs" value="—" hint="Available when jobs are connected" icon={Briefcase} />
      <StatCard
        label="Technicians"
        value={live.data?.total ?? '—'}
        hint="Available to receive jobs right now"
        icon={CircleDot}
        loading={live.isPending}
      />
      <StatCard label="Open Disputes" value="—" hint="Available when jobs are connected" icon={Scale} />
      <StatCard
        label="Pending Verifications"
        value={stats.data?.pendingVerifications ?? '—'}
        hint="Technicians waiting for approval"
        icon={BadgeCheck}
        loading={stats.isPending}
      />
    </div>
  );
}
