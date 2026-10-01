import Link from 'next/link';
import { ArrowRight, BadgeCheck, Receipt, ShieldCheck } from 'lucide-react';
import { HeroPhoto } from './HeroPhoto';

const highlights = [
  { icon: BadgeCheck, label: 'Verified technicians' },
  { icon: Receipt, label: 'Visit fee shown upfront' },
  { icon: ShieldCheck, label: 'You approve every charge' },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-brand-50 to-white" />
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-20 pt-12 sm:px-6 sm:pt-16 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:pb-28 lg:pt-20">
        <div className="text-center lg:text-left">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Tell us what is wrong. <span className="text-brand-500">Fundi finds who can fix it.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-slate-600 lg:mx-0">
            Stop calling around for an electrician, plumber or mechanic. Describe the problem once and Fundi connects
            you with a qualified technician nearby who is available now.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-6 py-3.5 text-base font-semibold text-white shadow-sm hover:bg-brand-600"
            >
              Request a technician <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-6 py-3.5 text-base font-semibold text-slate-700 hover:bg-slate-50"
            >
              Become a Fundi
            </Link>
          </div>

          <ul className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-6 lg:justify-start">
            {highlights.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2 text-sm font-medium text-slate-600">
                <Icon className="h-5 w-5 text-brand-500" aria-hidden />
                {label}
              </li>
            ))}
          </ul>
        </div>

        <HeroPhoto />
      </div>
    </section>
  );
}
