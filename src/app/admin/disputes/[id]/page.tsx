import type { Metadata } from 'next';
import { DisputeDetailView } from './DisputeDetailView';

export const metadata: Metadata = { title: 'Dispute' };

export default async function DisputeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DisputeDetailView jobId={id} />;
}
