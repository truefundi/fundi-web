import { CustomerBenefits, TechnicianBenefits } from '@/components/landing/Benefits';
import { CtaBanner } from '@/components/landing/CtaBanner';
import { Download } from '@/components/landing/Download';
import { Faq } from '@/components/landing/Faq';
import { Hero } from '@/components/landing/Hero';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { Services } from '@/components/landing/Services';
import { SiteFooter } from '@/components/landing/SiteFooter';
import { SiteHeader } from '@/components/landing/SiteHeader';

export default function LandingPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <HowItWorks />
        <Services />
        <CustomerBenefits />
        <CtaBanner />
        <TechnicianBenefits />
        <Download />
        <Faq />
      </main>
      <SiteFooter />
    </>
  );
}
