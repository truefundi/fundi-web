import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About us",
};

export default function AboutUsPage() {
  return (
    <section className="bg-slate-50 px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Who we are
          </h1>
          <p className="mt-2 max-w-2xl text-base leading-6 text-slate-600">
            Fundi is a technology platform that connects customers with skilled
            local technicians, making it easier to find reliable help for
            repairs and maintenance.
          </p>
        </div>

        <div className="mt-7 grid gap-5 md:grid-cols-2">
          <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Our vision</h2>
            <p className="mt-2 text-base leading-6 text-slate-600">
              To make trusted, quality services accessible in every community
              and create more opportunity for skilled technicians to thrive.
            </p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Our mission
            </h2>
            <p className="mt-2 text-base leading-6 text-slate-600">
              To bring customers and capable technicians together through a
              simple, transparent experience built on trust, clear
              communication, and dependable work.
            </p>
          </article>
        </div>

        <div className="mt-12">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            What we do
          </h2>
          <p className="mt-2 max-w-2xl text-base leading-6 text-slate-600">
            Fundi makes it straightforward to discover services, connect with a
            technician, and manage a job from request to completion.
          </p>
        </div>

        <div className="mt-7 grid gap-5 md:grid-cols-3">
          <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">
              For technicians
            </h3>
            <ul className="mt-3 space-y-2 text-base leading-6 text-slate-600">
              <li className="flex gap-3">
                <span className="text-brand-600" aria-hidden="true">
                  •
                </span>
                <span>Showcase your skills and experience.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-brand-600" aria-hidden="true">
                  •
                </span>
                <span>Connect with customers looking for your services.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-brand-600" aria-hidden="true">
                  •
                </span>
                <span>
                  Build trust with a professional profile and job history.
                </span>
              </li>
            </ul>
            <Link
              href="/signup"
              className="mt-4 inline-flex text-sm font-semibold text-brand-700 hover:text-brand-800"
            >
              Join Fundi
            </Link>
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">
              For customers
            </h3>
            <ul className="mt-3 space-y-2 text-base leading-6 text-slate-600">
              <li className="flex gap-3">
                <span className="text-brand-600" aria-hidden="true">
                  •
                </span>
                <span>Find technicians for repairs and maintenance.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-brand-600" aria-hidden="true">
                  •
                </span>
                <span>Review profiles, ratings, and service details.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-brand-600" aria-hidden="true">
                  •
                </span>
                <span>Keep job communication and updates in one place.</span>
              </li>
            </ul>
            <Link
              href="/services"
              className="mt-4 inline-flex text-sm font-semibold text-brand-700 hover:text-brand-800"
            >
              Explore services
            </Link>
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">
              For communities
            </h3>
            <ul className="mt-3 space-y-2 text-base leading-6 text-slate-600">
              <li className="flex gap-3">
                <span className="text-brand-600" aria-hidden="true">
                  •
                </span>
                <span>Support local skilled workers and businesses.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-brand-600" aria-hidden="true">
                  •
                </span>
                <span>Make dependable services easier to access.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-brand-600" aria-hidden="true">
                  •
                </span>
                <span>
                  Help build stronger, more connected local economies.
                </span>
              </li>
            </ul>
            <Link
              href="/contact"
              className="mt-4 inline-flex text-sm font-semibold text-brand-700 hover:text-brand-800"
            >
              Contact our team
            </Link>
          </article>
        </div>
      </div>
    </section>
  );
}
