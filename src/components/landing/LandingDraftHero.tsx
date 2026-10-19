'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BadgeCheck } from 'lucide-react';
import { useState } from 'react';

export function LandingDraftHero() {
  const [backgroundAnimated, setBackgroundAnimated] = useState(true);

  return (
    <section id="home" className="relative isolate flex min-h-[min(760px,100svh)] items-center justify-center overflow-hidden bg-[#071426] text-white">
      <button
        type="button"
        className={`landing-draft-background absolute inset-0 z-0 cursor-pointer overflow-hidden ${backgroundAnimated ? 'is-animating' : ''}`}
        onClick={() => setBackgroundAnimated((isAnimated) => !isAnimated)}
        aria-label={backgroundAnimated ? 'Stop background animation' : 'Animate background image'}
        aria-pressed={backgroundAnimated}
      >
        <Image
          src="/images/technician.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="landing-draft-background-image object-cover object-[60%_center]"
        />
      </button>
      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-r from-[#071426]/65 via-[#071426]/20 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-48 bg-gradient-to-t from-[#071426]/70 to-transparent" />
      <div className="pointer-events-none relative z-10 mx-auto flex min-h-[min(760px,100svh)] w-full max-w-7xl items-end justify-center px-5 pb-12 pt-28 text-center sm:px-8 sm:pb-16 lg:px-12">
        <div className="w-full max-w-4xl">
          <h1 className="mx-auto mt-4 max-w-1xl text-[clamp(2rem,4.5vw,3.75rem)] font-extrabold leading-[1.04] tracking-tight">
            Tell us what is wrong, Fundi finds who can fix it.
            <br />
          </h1>
          <div className="pointer-events-auto mt-7 flex flex-wrap justify-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-black/20 transition-colors hover:bg-brand-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Find a technician <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>

        <span className="sr-only" aria-live="polite">
          {backgroundAnimated ? 'Background animation on' : 'Background animation off'}
        </span>
      </div>
    </section>
  );
}
