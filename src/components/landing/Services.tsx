import { SERVICE_CATEGORIES, SERVICE_CATEGORY_STYLE } from '@/config/services';
import { cn } from '@/lib/utils';
import { SectionHeading } from './SectionHeading';
import { serviceDescriptions } from './content';
import { Smartphone } from 'lucide-react';

export function Services() {
  return (
    <>
<section className="bg-slate-900 py-14 sm:py-16">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="max-w-4xl text-4xl font-bold text-white sm:text-5xl">
            Hire smarter, get hired faster with 100% confidence.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-200 sm:text-lg">
            Connect with trusted fundis and manage your jobs from the Fundi app.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <span
              className="inline-flex min-h-14 items-center gap-3 rounded-lg bg-brand-500 px-6 py-3 font-semibold text-white"
              aria-label="Google Play, coming soon"
            >
              <Smartphone className="h-6 w-6 shrink-0" aria-hidden />
              Download on Google Play
            </span>
            <span
              className="inline-flex min-h-14 items-center gap-3 rounded-lg border border-slate-500 px-6 py-3 font-semibold text-white"
              aria-label="iOS, coming soon"
            >
              <Smartphone className="h-6 w-6 shrink-0" aria-hidden />
              Download on iOS
            </span>
          </div>
          <p className="mt-4 text-sm text-slate-300">
            Coming soon to iOS and Android
          </p>
        </div>
      </section>
    
    <section id="services" className="scroll-mt-16 bg-slate-50 py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title="One app for every repair"
          description="From a flickering light to a truck that will not start, Fundi covers the skilled trades you need most."
        />

        <ul className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICE_CATEGORIES.map((category) => {
            const { icon: Icon, className } = SERVICE_CATEGORY_STYLE[category];
            return (
              <li
                key={category}
                className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <span className={cn('flex h-12 w-12 items-center justify-center rounded-xl', className)}>
                  <Icon className="h-6 w-6" aria-hidden />
                </span>
                <h3 className="mt-5 text-base font-semibold text-slate-900">{category}</h3>
                <p className="mt-1.5 text-sm text-slate-600">{serviceDescriptions[category]}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
    </>
  );
}
