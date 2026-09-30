import type { Metadata } from 'next';
import { Suspense } from 'react';
import { TechniciansView } from './TechniciansView';

export const metadata: Metadata = { title: 'Technicians' };

export default function TechniciansPage() {
  return (
    <Suspense>
      <TechniciansView />
    </Suspense>
  );
}
