import type { Metadata } from 'next';
import { RatingsView } from './RatingsView';

export const metadata: Metadata = { title: 'Customer Ratings' };

export default function RatingsPage() {
  return <RatingsView />;
}
