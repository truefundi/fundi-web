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
    <section className="relative flex min-h-[720px] items-center overflow-hidden bg-slate-950 text-white lg:min-h-[min(820px,100svh)]">
      <HeroPhoto />
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-16 pt-28 sm:px-6 lg:px-8">
        <div className="max-w-2xl text-center lg:text-left">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl xl:text-7xl">
            Tell us what is wrong.{' '}
            <span className="text-brand-400">Fundi finds who can fix it.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-200 sm:text-lg sm:leading-8 lg:mx-0">
            Stop calling around for an electrician, plumber or mechanic. Describe the problem once and Fundi connects
            you with a qualified technician nearby who is available now.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-orange-950/30 transition-colors hover:bg-brand-600"
            >
              Request a technician <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-xl border border-white/30 bg-white/10 px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-white/20"
            >
              Become a Fundi
            </Link>
          </div>

          <ul className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-6 lg:justify-start">
            {highlights.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2 text-sm font-medium text-slate-200">
                <Icon className="h-5 w-5 text-brand-400" aria-hidden />
                {label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
