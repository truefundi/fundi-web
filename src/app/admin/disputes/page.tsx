import type { Metadata } from 'next';
import { Scale } from 'lucide-react';
import { PlaceholderPage } from '@/components/layout/PlaceholderPage';

export const metadata: Metadata = { title: 'Disputes' };

export default function DisputesPage() {
  return (
    <PlaceholderPage
      title="Disputes"
      description="Resolve issues between customers and technicians."
      icon={Scale}
      actions={['Review evidence', 'Decide outcome', 'Refunds']}
    />
  );
}
