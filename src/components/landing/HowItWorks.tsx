import { SectionHeading } from './SectionHeading';
import { steps } from './content';

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-16 bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="How Fundi works"
          title="From problem to fixed in four steps"
          description="Fundi coordinates the whole job, so you always know what happens next."
        />

        <ol className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ icon: Icon, title, description }, i) => (
            <li key={title} className="relative rounded-2xl border border-slate-200 bg-white p-6">
              <span className="absolute -top-4 left-6 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                {i + 1}
              </span>
              <span className="mt-2 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <Icon className="h-6 w-6" aria-hidden />
              </span>
              <h3 className="mt-5 text-lg font-semibold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
