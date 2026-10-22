import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Heart, Users, Wrench, Shield, Clock, Star, ArrowRight, Target, Zap, CheckCircle } from "lucide-react";
import { Download } from "@/components/landing/Download";

export const metadata: Metadata = {
  title: "About Us - Fundi",
  description: "Learn about Fundi's mission to connect customers with skilled local technicians for reliable repairs and maintenance services.",
};

export default function AboutUsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
     {/* Hero Section */}
<section className="relative bg-slate-50 px-4 pt-2 pb-10 sm:px-6 sm:pt-4 sm:pb-14 lg:pb-16">
  <div className="mx-auto max-w-6xl">
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
      {/* Left Column: Text & CTAs */}
      <div className="flex flex-col justify-center">
        <div>
        </div>

        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl leading-tight">
          Your Trusted Partner for Home Repairs
        </h1>

        <p className="mt-3 text-base sm:text-lg leading-relaxed text-slate-600">
          Fundi connects you with verified, skilled technicians in your community. From plumbing to electrical work, we make finding reliable help simple and stress-free.
        </p>

        <div className="mt-6 flex flex-wrap gap-4">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-amber-500/25 transition-all hover:from-amber-600 hover:to-orange-700 hover:shadow-amber-500/35"
          >
            Join as Technician <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/services"
            className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-6 py-3.5 text-sm font-bold text-slate-700 transition-all hover:border-amber-500 hover:text-amber-700 hover:bg-slate-50"
          >
            Find Services
          </Link>
        </div>
      </div>

      {/* Right Column: Stats Cards */}
      <div className="flex items-center justify-center">
        <div className="w-full rounded-3xl border border-slate-200 bg-amber-50/60 p-5 sm:p-6 shadow-xl">
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="rounded-2xl bg-white p-4 sm:p-5 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-amber-100 mb-2">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
              </div>
              <p className="text-xl sm:text-2xl font-extrabold text-slate-900">1,000+</p>
              <p className="text-xs font-medium text-slate-500 mt-0.5">Verified Technicians</p>
            </div>

            <div className="rounded-2xl bg-white p-4 sm:p-5 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-emerald-100 mb-2">
                <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
              </div>
              <p className="text-xl sm:text-2xl font-extrabold text-slate-900">5,000+</p>
              <p className="text-xs font-medium text-slate-500 mt-0.5">Happy Customers</p>
            </div>

            <div className="rounded-2xl bg-white p-4 sm:p-5 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-sky-100 mb-2">
                <Wrench className="h-5 w-5 sm:h-6 sm:w-6 text-sky-600" />
              </div>
              <p className="text-xl sm:text-2xl font-extrabold text-slate-900">15,000+</p>
              <p className="text-xs font-medium text-slate-500 mt-0.5">Jobs Completed</p>
            </div>

            <div className="rounded-2xl bg-white p-4 sm:p-5 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-yellow-100 mb-2">
                <Star className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
              </div>
              <p className="text-xl sm:text-2xl font-extrabold text-slate-900">4.8</p>
              <p className="text-xs font-medium text-slate-500 mt-0.5">Average Rating</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

      {/* Our Story Section */}
      <section className="bg-white px-4 py-12 sm:px-6 sm:py-16 lg:px-8 border-y border-slate-200/80">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Our Story
          </h2>
          <p className="mt-4 text-base sm:text-lg leading-relaxed text-slate-600">
            Founded with a simple mission: to make finding reliable home services in Rwanda as easy as ordering food online. We noticed that too many people struggled to find trustworthy technicians, while skilled workers struggled to find customers. Fundi bridges that gap.
          </p>
          <p className="mt-4 text-base sm:text-lg leading-relaxed text-slate-600">
            Today, we&apos;re proud to serve thousands of customers across Rwanda, connecting them with verified professionals who take pride in their work. Every technician on our platform is vetted, reviewed, and committed to excellence.
          </p>
        </div>
      </section>

      {/* Vision & Mission Section */}
      <section className="px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-amber-200/80 bg-white p-8 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-full -z-0 pointer-events-none" />
              <div className="relative z-10">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md">
                  <Target className="h-7 w-7" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Our Vision</h3>
                <p className="mt-3 text-base sm:text-lg leading-relaxed text-slate-600">
                  To become Rwanda&apos;s most trusted platform for home services, where every community has access to quality, reliable help from skilled local professionals.
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-slate-100 rounded-bl-full -z-0 pointer-events-none" />
              <div className="relative z-10">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-md">
                  <Heart className="h-7 w-7" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Our Mission</h3>
                <p className="mt-3 text-base sm:text-lg leading-relaxed text-slate-600">
                  To empower local technicians with better opportunities while giving customers peace of mind through transparent pricing, verified professionals, and exceptional service.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="bg-slate-900 px-4 py-12 sm:px-6 sm:py-16 lg:px-8 text-white">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center mb-10">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Why Choose Fundi?
            </h2>
            <p className="mt-3 text-base sm:text-lg text-slate-300">
              We are committed to providing the best experience for both customers and technicians.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-800/60 p-6 backdrop-blur-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500 text-white shadow">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Verified Technicians</h3>
              <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                Every technician undergoes a thorough verification process, including background checks and skills assessment.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-800/60 p-6 backdrop-blur-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500 text-white shadow">
                <Star className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Transparent Reviews</h3>
              <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                Real reviews from real customers help you make informed decisions about who to hire for your job.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-800/60 p-6 backdrop-blur-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500 text-white shadow">
                <Clock className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Quick Response</h3>
              <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                Get matched with available technicians quickly and track your job progress in real-time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What We Do Section */}
      <section className="px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center mb-10">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              How We Help
            </h2>
            <p className="mt-3 text-base sm:text-lg text-slate-600">
              Whether you&apos;re a technician looking for work or a customer needing help, Fundi makes it simple.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <article className="group rounded-3xl bg-white p-8 shadow-xl ring-1 ring-slate-200 transition-all hover:shadow-2xl hover:ring-amber-400">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md">
                <Wrench className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">For Technicians</h3>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                <li className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
                  <span>Build your professional profile</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
                  <span>Connect with local customers</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
                  <span>Grow your business with us</span>
                </li>
              </ul>
              <Link
                href="/signup"
                className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-amber-600 transition-colors hover:text-amber-700"
              >
                Start Earning <ArrowRight className="h-4 w-4" />
              </Link>
            </article>

            <article className="group rounded-3xl bg-white p-8 shadow-xl ring-1 ring-slate-200 transition-all hover:shadow-2xl hover:ring-amber-400">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">For Customers</h3>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                <li className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
                  <span>Find trusted local experts</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
                  <span>Compare prices and reviews</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
                  <span>Book with confidence</span>
                </li>
              </ul>
              <Link
                href="/services"
                className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-amber-600 transition-colors hover:text-amber-700"
              >
                Find Help Now <ArrowRight className="h-4 w-4" />
              </Link>
            </article>

            <article className="group rounded-3xl bg-white p-8 shadow-xl ring-1 ring-slate-200 transition-all hover:shadow-2xl hover:ring-amber-400">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md">
                <Heart className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">For Communities</h3>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                <li className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
                  <span>Support local businesses</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
                  <span>Create job opportunities</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
                  <span>Strengthen local economy</span>
                </li>
              </ul>
              <Link
                href="/contact"
                className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-amber-600 transition-colors hover:text-amber-700"
              >
                Partner With Us <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          </div>
        </div>
      </section>

    </div>
  );
}

// Small helper component for the spark icon in the header badge
function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  );
}