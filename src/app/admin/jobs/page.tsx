import type { Metadata } from 'next';
import { Briefcase } from 'lucide-react';
import { PlaceholderPage } from '@/components/layout/PlaceholderPage';

export const metadata: Metadata = { title: 'Jobs' };

export default function JobsPage() {
  return (
    <PlaceholderPage
      title="Jobs"
      description="Oversee every job from request to rating."
      icon={Briefcase}
      actions={['Monitor jobs', 'Job details', 'Reassign technician', 'Cancel job', 'Audit trail']}
    />
  );
}
