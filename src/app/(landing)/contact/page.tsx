"use client";

import type { FormEvent } from "react";
import { Mail, MapPin, Phone, Send } from "lucide-react";

export default function ContactPage() {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const subject = String(formData.get("subject") ?? "");
    const body = [
      `Name: ${formData.get("name") ?? ""}`,
      `Number: ${formData.get("number") ?? ""}`,
      "",
      String(formData.get("message") ?? ""),
    ].join("\n");

    window.location.href = `mailto:support@fundi.rw?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  return (
    <section className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-14 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-[408px]">
        <div className="mb-8 text-center">
          <p className="inline-flex items-center gap-2 text-xs font-medium text-slate-700">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
            Support &amp; Inquiries
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            Get in touch
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Have questions or need support with Fundi? Fill out the form below
            and our team will get back to you promptly.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-800">
              Full name <span className="text-brand-600">*</span>
              <input
                name="name"
                type="text"
                autoComplete="name"
                required
                placeholder="Your full name"
                className="mt-1 block h-10 w-full rounded-md border border-slate-200 px-3 text-xs font-normal normal-case tracking-normal text-slate-900 outline-none placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </label>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-800">
              Phone number <span className="text-brand-600">*</span>
              <input
                name="number"
                type="text"
                autoComplete="number"
                required
                placeholder="07**********"
                className="mt-1 block h-10 w-full rounded-md border border-slate-200 px-3 text-xs font-normal normal-case tracking-normal text-slate-900 outline-none placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </label>
          </div>

          <label className="mt-4 block text-[11px] font-semibold uppercase tracking-wide text-slate-800">
            Subject <span className="text-brand-600">*</span>
            <input
              name="subject"
              type="text"
              required
              placeholder="How can we help you?"
              className="mt-1 block h-10 w-full rounded-md border border-slate-200 px-3 text-xs font-normal normal-case tracking-normal text-slate-900 outline-none placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </label>

          <label className="mt-4 block text-[11px] font-semibold uppercase tracking-wide text-slate-800">
            Message <span className="text-brand-600">*</span>
            <textarea
              name="message"
              required
              rows={5}
              placeholder="Provide details about your question, project, or service inquiry..."
              className="mt-1 block w-full resize-y rounded-md border border-slate-200 px-3 py-3 text-xs font-normal normal-case tracking-normal text-slate-900 outline-none placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </label>

          <button
            type="submit"
            className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-brand-600 px-4 text-xs font-semibold text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          >
            Send message <Send aria-hidden="true" className="h-3.5 w-3.5" />
          </button>
        </form>

        <div className="mt-5 grid gap-6 border-t border-slate-200 pt-6 text-xs sm:grid-cols-3">
          <a
            href="mailto:support@fundi.rw"
            className="flex items-center gap-3 text-slate-500 hover:text-brand-700"
          >
            <Mail
              aria-hidden="true"
              className="h-4 w-4 shrink-0 text-brand-600"
            />
            <span>
              <span className="block">Email us</span>
              <span className="font-medium text-slate-900">
                support@fundi.rw
              </span>
            </span>
          </a>
          <a
            href="tel:+250788123456"
            className="flex items-center gap-3 text-slate-500 hover:text-brand-700"
          >
            <Phone
              aria-hidden="true"
              className="h-4 w-4 shrink-0 text-brand-600"
            />
            <span>
              <span className="block">Call direct</span>
              <span className="whitespace-nowrap font-medium text-slate-900">
                +250 788 123 456
              </span>
            </span>
          </a>
          <div className="flex items-center gap-3 text-slate-500">
            <MapPin
              aria-hidden="true"
              className="h-4 w-4 shrink-0 text-brand-600"
            />
            <span>
              <span className="block">HQ location</span>
              <span className="font-medium text-slate-900">Kigali, Rwanda</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
