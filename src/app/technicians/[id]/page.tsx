import type { Metadata } from 'next';
import { TechnicianDetailView } from './TechnicianDetailView';

export const metadata: Metadata = { title: 'Technician' };

export default async function TechnicianDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TechnicianDetailView id={id} />;
}
