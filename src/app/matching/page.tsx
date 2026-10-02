import type { Metadata } from 'next';
import { Shuffle } from 'lucide-react';
import { PlaceholderPage } from '@/components/layout/PlaceholderPage';

export const metadata: Metadata = { title: 'Matching' };

export default function MatchingPage() {
  return (
    <PlaceholderPage
      title="Matching"
      description="See how requests are matched to technicians."
      icon={Shuffle}
      actions={['Matching queue', 'Manual assignment', 'Expired offers']}
    />
  );
}
