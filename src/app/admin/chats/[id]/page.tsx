import type { Metadata } from 'next';
import { ChatDetailView } from './ChatDetailView';

export const metadata: Metadata = { title: 'Chat' };

export default async function ChatDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ChatDetailView id={id} />;
}
