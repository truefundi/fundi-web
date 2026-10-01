'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from './Logo';
import { navLinks } from './content';

/** Tracks which landing section is in the middle of the screen, so its menu link can be highlighted. */
function useActiveSection(): [string | null, (href: string) => void] {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const sections = navLinks
      .map((link) => document.querySelector<HTMLElement>(link.href))
      .filter((el): el is HTMLElement => el !== null);

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(`#${entry.target.id}`);
        }
      },
      // A section counts as active while it crosses the middle of the viewport.
      { rootMargin: '-50% 0px -50% 0px' },
    );
    sections.forEach((section) => observer.observe(section));

    // Above the first section (the hero), no link is active.
    const onScroll = () => {
      if (sections[0] && window.scrollY + window.innerHeight / 2 < sections[0].offsetTop) setActive(null);
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return [active, setActive];
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useActiveSection();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b transition-colors',
        scrolled || open ? 'border-slate-200 bg-white/95 backdrop-blur' : 'border-transparent bg-transparent',
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />

        <div className="hidden items-center gap-6 lg:flex">
          <nav className="flex items-center gap-1" aria-label="Main">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setActive(link.href)}
                aria-current={active === link.href ? 'true' : undefined}
                className={cn(
                  'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                  active === link.href
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                )}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <Link href="/login" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-600"
            >
              Get started
            </Link>
          </div>
        </div>

        <button
          className="rounded-md p-2 text-slate-700 hover:bg-slate-100 lg:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="mobile-menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <nav id="mobile-menu" className="border-t border-slate-200 bg-white px-4 pb-6 pt-2 lg:hidden" aria-label="Mobile">
          <ul className="space-y-1">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => {
                    setActive(link.href);
                    setOpen(false);
                  }}
                  aria-current={active === link.href ? 'true' : undefined}
                  className={cn(
                    'block rounded-lg px-3 py-3 text-base font-medium',
                    active === link.href ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-50',
                  )}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Link
              href="/login"
              className="rounded-lg border border-slate-300 px-4 py-3 text-center text-sm font-medium text-slate-700"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-brand-500 px-4 py-3 text-center text-sm font-semibold text-white"
            >
              Get started
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
