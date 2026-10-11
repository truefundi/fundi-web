import type { Metadata } from 'next';
import { TechnicianBenefits } from '@/components/landing/Benefits';

export const metadata: Metadata = {
  title: 'For technicians',
};

export default function ForTechniciansPage() {
  return <TechnicianBenefits />;
}
