import { Smartphone } from 'lucide-react';
import { SectionHeading } from './SectionHeading';

// Placeholder until the app is published: replace with official store badges and links.
const stores = [
  { name: 'App Store', caption: 'Download on the' },
  { name: 'Google Play', caption: 'Get it on' },
];

export function Download() {
  return (
    <section id="download" className="scroll-mt-16 bg-gradient-to-b from-white to-brand-50 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Download"
          title="Get the Fundi app"
          description="One app for customers and technicians. Request a repair in minutes, or sign up to receive jobs near you."
        />

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          {stores.map((store) => (
            <span
              key={store.name}
              className="flex w-56 items-center gap-3 rounded-xl bg-slate-900 px-5 py-3 text-white"
              aria-label={`${store.name}: coming soon`}
            >
              <Smartphone className="h-7 w-7 shrink-0" aria-hidden />
              <span className="text-left">
                <span className="block text-xs text-slate-300">{store.caption}</span>
                <span className="block text-lg font-semibold leading-tight">{store.name}</span>
              </span>
            </span>
          ))}
        </div>
        <p className="mt-4 text-center text-sm font-medium text-slate-500">Coming soon to iOS and Android</p>
      </div>
    </section>
  );
}
