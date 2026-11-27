import type { Metadata } from 'next';
import { JobDetailView } from './JobDetailView';

export const metadata: Metadata = { title: 'Job' };

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <JobDetailView id={id} />;
}
