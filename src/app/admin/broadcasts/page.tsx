import type { Metadata } from 'next';
import { BroadcastsView } from './BroadcastsView';

export const metadata: Metadata = { title: 'Broadcasts' };

export default function BroadcastsPage() {
  return <BroadcastsView />;
}
