import type { Metadata } from 'next';
import { HardHat } from 'lucide-react';
import { PlaceholderPage } from '@/components/layout/PlaceholderPage';

export const metadata: Metadata = { title: 'Technicians' };

export default function TechniciansPage() {
  return (
    <PlaceholderPage
      title="Technicians"
      description="Verify and manage technicians."
      icon={HardHat}
      actions={['Approve sign-ups', 'Skills & areas', 'Who is LIVE', 'Ratings', 'Suspend']}
    />
  );
}
