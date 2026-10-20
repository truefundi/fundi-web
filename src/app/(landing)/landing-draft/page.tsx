'use client';



import Image from 'next/image';

import Link from 'next/link';

import { useEffect, useState } from 'react';

import {

  ArrowRight,

  BadgeCheck,

  CarFront,

  Check,

  ClipboardList,

  House,

  ShieldCheck,

  Zap,

  Apple,

  Smartphone,

} from 'lucide-react';

import { LandingDraftHero } from '@/components/landing/LandingDraftHero';



const steps = [

  { icon: ClipboardList, title: "Tell us what's wrong", text: 'Share a few details about the repair and where you are.' },

  { icon: BadgeCheck, title: 'Find a technician', text: 'Connect with a local pro who can take on the job.' },

  { icon: ShieldCheck, title: 'Approve the quote', text: 'Review the price first. Work starts when you say yes.' },

];



const services = [

  { icon: House, title: 'Home repairs', text: 'Help with everyday fixes around the house.' },

  { icon: Zap, title: 'Electrical & plumbing', text: 'Get help with common electrical and plumbing issues.' },

  { icon: CarFront, title: 'Vehicle service', text: 'Find support for vehicle maintenance and repairs.' },

];



export default function LandingDraftPage() {

  const [activeSection, setActiveSection] = useState('home');



  useEffect(() => {

    const handleScroll = () => {

      const sections = ['home', 'how-it-works', 'about-us', 'get-app'];

      const scrollPosition = window.scrollY + 150;



      for (const section of sections) {

        const element = document.getElementById(section);

        if (element) {

          const { offsetTop } = element;

          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + 500) {

            setActiveSection(section);

            break;

          }

        }

      }

    };



    window.addEventListener('scroll', handleScroll);

    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);

  }, []);



  const navLinkClass = (section: string) =>

    `text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${

      activeSection === section

        ? 'bg-brand-500 text-white'

        : 'text-slate-700 hover:text-brand-600 hover:bg-slate-100'

    }`;

  return (

    <div className="bg-[#f6f7f8] text-[#101c2b] scroll-smooth">

      <nav className="sticky top-0 z-50 bg-[#071426] px-5 py-4 sm:px-8 lg:px-12">

        <div className="mx-auto flex max-w-7xl items-center justify-between">

          <Link href="/" className="flex items-center">

            <Image

              src="/images/logo11.png"

              alt="Fundi"

              width={120}

              height={40}

              className="h-10 w-auto"

            />

          </Link>



          <div className="hidden md:flex items-center gap-8">

            <Link href="#home" className={navLinkClass('home')}>

              Home

            </Link>

            <Link href="#how-it-works" className={navLinkClass('how-it-works')}>

              How it works

            </Link>

            <Link href="#about-us" className={navLinkClass('about-us')}>

              About us

            </Link>

          </div>



          <Link

            href="#get-app"

            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"

          >

            Get app

          </Link>

        </div>

      </nav>

      <div id="home">

        <LandingDraftHero />

      </div>



      <section id="how-it-works" className="scroll-mt-20 bg-white px-5 py-6 sm:px-8 sm:py-8 lg:px-12">

        <div className="mx-auto max-w-6xl">

          <div className="mx-auto max-w-2xl text-center">

            <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#10233a] sm:text-4xl">

              How Fundi works

            </h2>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">

              From the first details to an approved repair, you know what happens next.

            </p>

          </div>

          <ol className="mt-8 grid divide-y divide-slate-200 md:grid-cols-3 md:divide-x md:divide-y-0">

            {steps.map(({ icon: Icon, title, text }, index) => (

              <li key={title} className="flex flex-col items-center px-5 py-6 text-center first:pt-2 last:pb-2 md:px-8 md:py-2">

                <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-700">

                  Step 0{index + 1}

                </span>

                <span className="mt-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#10233a] text-brand-300 shadow-sm ring-4 ring-orange-50">

                    <Icon className="h-5 w-5" aria-hidden />

                </span>

                <h3 className="mt-5 text-lg font-bold tracking-tight text-[#10233a]">{title}</h3>

                <p className="mt-2 max-w-xs text-sm leading-6 text-slate-600">{text}</p>

              </li>

            ))}

          </ol>

        </div>

      </section>



      <section className="bg-white px-5 py-8 sm:px-8 sm:py-10 lg:px-12" aria-labelledby="services-title">

        <div className="mx-auto max-w-6xl">

          <div className="mx-auto max-w-2xl text-center">

            <h2 id="services-title" className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">

              Find help for the job at hand.

            </h2>

          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">

            {services.map(({ icon: Icon, title, text }) => (

              <Link

                key={title}

                href="/services"

                className="group rounded-2xl border border-slate-200 bg-[#f8f9fa] p-6 transition-colors hover:border-brand-300 hover:bg-orange-50/60"

              >

                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-brand-700 shadow-sm">

                  <Icon className="h-5 w-5" aria-hidden />

                </span>

                <h3 className="mt-5 text-lg font-bold tracking-tight group-hover:text-brand-800">{title}</h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>

                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-700">

                  Explore services <ArrowRight className="h-4 w-4" aria-hidden />

                </span>

              </Link>

            ))}

          </div>

        </div>

      </section>



      <section id="about-us" className="scroll-mt-20 bg-[#0b1a2b] px-5 py-8 text-white sm:px-8 sm:py-10 lg:px-12">

        <div className="mx-auto max-w-6xl">

          <div className="mx-auto max-w-3xl text-center">

            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">

              About Fundi

            </h2>

            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">

              Tell us what is wrong. Fundi finds who can fix it.

            </p>

          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">

            <div className="rounded-2xl bg-[#10233a] p-5">

              <h3 className="text-base font-bold tracking-tight">Our Mission</h3>

              <p className="mt-2 text-sm leading-6 text-slate-300">

                Connect customers with qualified technicians for faster, transparent repairs.

              </p>

            </div>

            <div className="rounded-2xl bg-[#10233a] p-5">

              <h3 className="text-base font-bold tracking-tight">How We Work</h3>

              <p className="mt-2 text-sm leading-6 text-slate-300">

                Real-time marketplace matching your needs with available technicians instantly.

              </p>

            </div>

            <div className="rounded-2xl bg-[#10233a] p-5">

              <h3 className="text-base font-bold tracking-tight">Transparent Pricing</h3>

              <p className="mt-2 text-sm leading-6 text-slate-300">

                See visit fees and repair quotes before you approve any work.

              </p>

            </div>

            <div className="rounded-2xl bg-[#10233a] p-5">

              <h3 className="text-base font-bold tracking-tight">Digital Records</h3>

              <p className="mt-2 text-sm leading-6 text-slate-300">

                Complete service history tracked from request to completion.

              </p>

            </div>

          </div>

        </div>

      </section>



      <section id="get-app" className="scroll-mt-20 bg-[#f6f7f8] px-5 py-16 sm:px-8 sm:py-20 lg:px-12">

        <div className="mx-auto max-w-6xl">

          <div className="flex flex-col items-center justify-center gap-4">

            <h2 className="text-center text-3xl font-bold text-[#101c2b]">Get the Fundi app</h2>

            <p className="text-center max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">

              One app for customers and technicians. Request a repair in minutes, or sign up to receive jobs near you.

            </p>

          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-4">

            <Link

              href="#"

              className="flex items-center gap-3 rounded-lg bg-[#071426] px-6 py-3 text-white transition-colors hover:bg-[#071426]/90"

            >

              <Apple className="h-6 w-6" />

              <div>

                <p className="text-xs">Download on the</p>

                <p className="text-sm font-medium">App Store</p>

              </div>

            </Link>

            <Link

              href="#"

              className="flex items-center gap-3 rounded-lg bg-[#071426] px-6 py-3 text-white transition-colors hover:bg-[#071426]/90"

            >

              <Smartphone className="h-6 w-6" />

              <div>

                <p className="text-xs">Get it on</p>

                <p className="text-sm font-medium">Google Play</p>

              </div>

            </Link>

          </div>

        </div>

      </section>



      <footer className="bg-[#071426] px-5 py-4 sm:px-8 lg:px-12">

        <div className="mx-auto max-w-6xl text-center text-sm text-white/90">

          © {new Date().getFullYear()} Fundi. All rights reserved.

        </div>

      </footer>

    </div>

  );

}

