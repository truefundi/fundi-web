import { SERVICE_CATEGORIES, SERVICE_CATEGORY_STYLE } from '@/config/services';
import { cn } from '@/lib/utils';
import { SectionHeading } from './SectionHeading';
import { serviceDescriptions } from './content';

export function Services() {
  return (
    <section id="services" className="scroll-mt-16 bg-slate-50 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Services"
          title="One app for every repair"
          description="From a flickering light to a truck that will not start, Fundi covers the skilled trades you need most."
        />

        <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
  );
}
