import type { Metadata } from 'next';
import { Services } from '@/components/landing/Services';

export const metadata: Metadata = {
  title: 'Services',
};

export default function ServicesPage() {
  return <Services />;
}
