import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function CtaBanner() {
  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-6 rounded-3xl bg-brand-500 px-6 py-12 text-center sm:px-12 lg:flex-row lg:justify-between lg:text-left">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Something broken? Get it fixed today.</h2>
            <p className="mt-2 text-base text-brand-50">Tell us what is wrong and we will find someone who can fix it.</p>
          </div>
          <Link
            href="/signup"
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-white px-6 py-3.5 text-base font-semibold text-brand-700 shadow-sm hover:bg-brand-50"
          >
            Get started <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
