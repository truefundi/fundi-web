import { Smartphone } from "lucide-react";
import { SectionHeading } from "./SectionHeading";
import { steps } from "./content";

export function HowItWorks() {
  return (
    <>


      <section
        id="how-it-works"
        className="scroll-mt-16 bg-white py-12 sm:py-16"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="From problem to fixed in four steps"
            description="Fundi coordinates the whole job, so you always know what happens next."
          />

          <ol className="mt-8 grid gap-6 sm:mt-10 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map(({ icon: Icon, title, description }, i) => (
              <li
                key={title}
                className="relative rounded-2xl border border-slate-200 bg-white p-6"
              >
                <span className="absolute -top-4 left-6 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                  {i + 1}
                </span>
                <span className="mt-2 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon className="h-6 w-6" aria-hidden />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-slate-900">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <section className="bg-slate-900 py-14 sm:py-16">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="max-w-4xl text-4xl font-bold text-white sm:text-5xl">
            Get started with Fundi
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
          </p>
        </div>
      </section>
    </>
  );
}
