import { ChevronDown } from 'lucide-react';
import { SectionHeading } from './SectionHeading';
import { faqs } from './content';

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-16 bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="FAQ" title="Questions, answered" />
        <div className="mt-12 divide-y divide-slate-200 rounded-2xl border border-slate-200">
          {faqs.map(({ question, answer }) => (
            <details key={question} className="group px-6 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-left text-base font-semibold text-slate-900">
                {question}
                <ChevronDown
                  className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-open:rotate-180"
                  aria-hidden
                />
              </summary>
              <p className="pb-5 text-sm leading-6 text-slate-600">{answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
