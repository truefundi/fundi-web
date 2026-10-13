import type { Metadata } from 'next';
import { RecordsView } from './RecordsView';

export const metadata: Metadata = { title: 'Service Records' };

export default function RecordsPage() {
  return <RecordsView />;
}
