import type { Metadata } from 'next';
import { CustomerBenefits } from '@/components/landing/Benefits';
import { CtaBanner } from '@/components/landing/CtaBanner';
import { Hero } from '@/components/landing/Hero';
import { ProductAds } from '@/components/landing/ProductAds';

export const metadata: Metadata = {
  title: 'Home',
};

export default function LandingPage() {
  return (
    <>
      <Hero />
      <CustomerBenefits />
      <ProductAds />
      <CtaBanner />

    </>
  );
}
