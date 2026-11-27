import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { FeatureGrid } from './FeatureGrid';
import { SectionHeading } from './SectionHeading';
import { customerBenefits, technicianBenefits } from './content';

export function CustomerBenefits() {
  return (
    <section id="customers" className="scroll-mt-16 bg-white py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title="Repairs without the guesswork"
          description="Fundi makes getting skilled help simple, transparent and on your terms."
        />
        <div className="mt-8 sm:mt-10">
          <FeatureGrid features={customerBenefits} />
        </div>
      </div>
    </section>
  );
}

export function TechnicianBenefits() {
  return (
    <section id="technicians" className="scroll-mt-16 bg-white py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title="More jobs. Your schedule."
          description="Electricians, plumbers, mechanics and other skilled workers: Fundi brings customers who need you right now."
        />
        <div className="mt-8 sm:mt-10">
          <FeatureGrid features={technicianBenefits} />
        </div>
        <div className="mt-8 sm:mt-10 text-center">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-6 py-3.5 text-base font-semibold text-white hover:bg-brand-600"
          >
            Apply as a Fundi <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
