import type { Metadata } from 'next';
import { AdsView } from './AdsView';

export const metadata: Metadata = { title: 'Landing Ads' };

export default function AdsPage() {
  return <AdsView />;
}
