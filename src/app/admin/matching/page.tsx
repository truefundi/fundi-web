import type { Metadata } from 'next';
import { MatchingView } from './MatchingView';

export const metadata: Metadata = { title: 'Matching' };

export default function MatchingPage() {
  return <MatchingView />;
}
