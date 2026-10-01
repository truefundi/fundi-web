import type { Metadata } from 'next';
import { FileText } from 'lucide-react';
import { PlaceholderPage } from '@/components/layout/PlaceholderPage';

export const metadata: Metadata = { title: 'Service Records' };

export default function RecordsPage() {
  return (
    <PlaceholderPage
      title="Service Records"
      description="The digital record of every completed job."
      icon={FileText}
      actions={['Job records', 'Photos', 'Timestamps & GPS', 'Audit log', 'Export']}
    />
  );
}
