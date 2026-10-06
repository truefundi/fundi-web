import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui';
import { AttentionQueue } from '@/components/dashboard/AttentionQueue';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { JobPipeline } from '@/components/dashboard/JobPipeline';
import { JobsSummary } from '@/components/dashboard/JobsSummary';
import { VerificationQueue } from '@/components/dashboard/VerificationQueue';

// The root layout's title template only applies to child routes, so set the full title here.
export const metadata: Metadata = { title: { absolute: 'Dashboard | Fundi Admin' } };

export default function DashboardPage() {
  return (
    <>
      <PageHeader title="Dashboard" description="Everything happening on Fundi at a glance." />

      <DashboardStats />

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <VerificationQueue />
        </div>
        <JobsSummary />
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
