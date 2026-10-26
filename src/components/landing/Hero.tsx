'use client';

import type { FormEvent } from 'react';
import {
  BadgeCheck,
  Receipt,
  SendHorizontal,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { HeroPhoto } from "./HeroPhoto";

const highlights = [
  { icon: BadgeCheck, label: "Verified technicians" },
  { icon: Receipt, label: "Visit fee shown upfront" },
  { icon: ShieldCheck, label: "You approve every charge" },
];

export function Hero() {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const request = new FormData(form).get('request');
    if (typeof request !== 'string' || !request.trim()) return;

    window.dispatchEvent(
      new CustomEvent('fundi-ai-request', { detail: request.trim() }),
    );
    form.reset();
  }

  return (
    <section className="relative flex min-h-[720px] items-center overflow-hidden bg-slate-950 text-white lg:min-h-[min(820px,100svh)]">
      <HeroPhoto />
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-16 pt-28 sm:px-6 lg:px-8">
        <div className="max-w-2xl text-center lg:text-left">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl xl:text-7xl">
            Tell <span className="text-brand-400">Fundi AI</span> what needs
            fixing.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-200 sm:text-lg sm:leading-8 lg:mx-0">
            Describe the problem in your own words and Fundi AI will help you
            find the right technician.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mx-auto mt-8 max-w-xl lg:mx-0"
          >
            <label htmlFor="fundi-ai-request" className="sr-only">
              Describe what needs fixing
            </label>
            <div className="flex items-center gap-3 rounded-full bg-white p-2.5 pl-5 shadow-xl shadow-slate-950/20 focus-within:ring-2 focus-within:ring-brand-400">
              <Sparkles
                className="h-5 w-5 shrink-0 text-brand-500"
                aria-hidden
              />
              <input
                id="fundi-ai-request"
                name="request"
                type="text"
                required
                maxLength={500}
                placeholder="Try: My kitchen tap is leaking in Kigali"
                className="min-w-0 flex-1 bg-transparent py-4 text-sm text-slate-900 outline-none placeholder:text-slate-500 sm:text-base"
              />
              <button
                type="submit"
                aria-label="Continue with your request"
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white shadow-md shadow-brand-500/30 transition-colors hover:bg-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
              >
                <SendHorizontal className="h-5 w-5" aria-hidden />
              </button>
            </div>
          </form>

          <ul className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-6 lg:justify-start">
            {highlights.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-2 text-sm font-medium text-slate-200"
              >
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
