import type { Metadata } from 'next';
import { BadgeCheck, Briefcase, CircleDot, Scale } from 'lucide-react';
import { PageHeader, StatCard } from '@/components/ui';
import { AttentionQueue } from '@/components/dashboard/AttentionQueue';
import { JobPipeline } from '@/components/dashboard/JobPipeline';

// The root layout's title template only applies to child routes, so set the full title here.
export const metadata: Metadata = { title: { absolute: 'Dashboard | Fundi Admin' } };

// Placeholder figures until the backend exposes dashboard metrics.
const stats = [
  { label: 'Active Jobs', value: '—', hint: 'Jobs between request and settlement', icon: Briefcase },
  { label: 'Technicians', value: '—', hint: 'Available to receive jobs right now', icon: CircleDot },
  { label: 'Open Disputes', value: '—', hint: 'Waiting for an admin decision', icon: Scale },
  { label: 'Pending Verifications', value: '—', hint: 'Technicians waiting for approval', icon: BadgeCheck },
];

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Everything happening on Fundi at a glance. Figures appear once the backend is connected."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="mt-6">
        <JobPipeline />
      </div>

      <div className="mt-6">
        <AttentionQueue />
      </div>
    </>
  );
}
