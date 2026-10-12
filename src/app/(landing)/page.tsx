import type { Metadata } from 'next';
import { CustomerBenefits } from '@/components/landing/Benefits';
import { CtaBanner } from '@/components/landing/CtaBanner';
import { Download } from '@/components/landing/Download';
import { Hero } from '@/components/landing/Hero';

export const metadata: Metadata = {
  title: 'Home',
};

export default function LandingPage() {
  return (
    <>
      <Hero />
      <CustomerBenefits />
      <CtaBanner />
      <Download />
    </>
  );
}
