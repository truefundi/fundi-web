'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from './Logo';
import { navLinks } from './content';

const draftNavLinks = [
  { label: 'Home', href: '/landing-draft' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'About us', href: '#about-us' },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeDraftSection, setActiveDraftSection] = useState('home');
  const pathname = usePathname();
  const isDraft = pathname === '/landing-draft';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!isDraft) return;

    const sectionIds = ['home', 'how-it-works', 'about-us', 'get-app'];
    const updateActiveSection = () => {
      const atPageEnd = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4;
      if (atPageEnd) {
        setActiveDraftSection('get-app');
        return;
      }

      const marker = window.innerHeight * 0.4;
      const activeSection = sectionIds.find((id) => {
        const section = document.getElementById(id);
        if (!section) return false;
        const { top, bottom } = section.getBoundingClientRect();
        return top <= marker && bottom > marker;
      });

      if (activeSection) setActiveDraftSection(activeSection);
    };

    updateActiveSection();
    window.addEventListener('scroll', updateActiveSection, { passive: true });
    window.addEventListener('resize', updateActiveSection);
    window.addEventListener('hashchange', updateActiveSection);
    return () => {
      window.removeEventListener('scroll', updateActiveSection);
      window.removeEventListener('resize', updateActiveSection);
      window.removeEventListener('hashchange', updateActiveSection);
    };
  }, [isDraft]);

  const isHome = true; // dark navbar style on every page
  const overlapsHero = pathname === '/' || isDraft; // only the home pages sit under the hero
  const visibleNavLinks = isDraft ? draftNavLinks : navLinks;
  const getDraftSection = (href: string) => (href.includes('#') ? href.split('#')[1] : 'home');

  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b transition-colors',
        overlapsHero && '-mb-16',
        isHome
          ? 'border-white/10 bg-[#071426]'
          : scrolled || open
            ? 'border-slate-200 bg-white/95 backdrop-blur'
            : 'border-transparent bg-transparent',
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo dark={isHome} href={isDraft ? '/landing-draft' : '/'} />

        <div className="hidden items-center gap-6 lg:flex">
          <nav className="flex items-center gap-1" aria-label="Main">
            {visibleNavLinks.map((link) => (
              (() => {
                const isActive = isDraft
                  ? activeDraftSection === getDraftSection(link.href)
                  : pathname === link.href;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => {
                      if (isDraft) setActiveDraftSection(getDraftSection(link.href));
                    }}
                    aria-current={isActive ? (isDraft && link.href.includes('#') ? 'location' : 'page') : undefined}
                    className={cn(
                      'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                      isDraft
                        ? isActive
                          ? 'bg-brand-500 text-white shadow-sm'
                          : 'text-slate-200 hover:bg-white/10 hover:text-brand-300'
                        : isHome
                          ? isActive
                            ? 'bg-amber-500 text-white'
                            : 'text-slate-200 hover:bg-white/10 hover:text-white'
                          : isActive
                            ? 'bg-amber-500 text-white'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })()
            ))}
          </nav>

          {isDraft ? (
            <Link
              href="#get-app"
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-600"
            >
              Get app
            </Link>
          ) : (
            <div className="flex items-center gap-1">
              <Link
                href="/about-us"
                className={cn(
                  'rounded-lg px-3 py-2 text-sm font-medium',
                  pathname === '/about-us'
                    ? 'bg-amber-500 text-white'
                    : isHome
                      ? 'text-slate-200 hover:bg-white/10 hover:text-white'
                      : 'text-slate-700 hover:bg-slate-100',
                )}
              >
                About us
              </Link>
              <Link
                href="/contact"
                className={cn(
                  'rounded-lg px-4 py-2 text-sm font-semibold',
                  pathname === '/contact'
                    ? 'bg-amber-500 text-white'
                    : isHome
                      ? 'text-slate-200 hover:bg-white/10 hover:text-white'
                      : 'text-slate-700 hover:bg-slate-100',
                )}
              >
                Contact us
              </Link>
            </div>
          )}
        </div>

        <button
          className={cn(
            'rounded-md p-2 lg:hidden',
            isHome ? 'text-white hover:bg-white/10' : 'text-slate-700 hover:bg-slate-100',
          )}
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="mobile-menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <nav
          id="mobile-menu"
          className={cn(
            'border-t px-4 pb-6 pt-2 lg:hidden',
            isHome ? 'border-white/10 bg-slate-950' : 'border-slate-200 bg-white',
          )}
          aria-label="Mobile"
        >
          <ul className="space-y-1">
            {visibleNavLinks.map((link) => (
              (() => {
                const isActive = isDraft
                  ? activeDraftSection === getDraftSection(link.href)
                  : pathname === link.href;

                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => {
                        setOpen(false);
                        if (isDraft) setActiveDraftSection(getDraftSection(link.href));
                      }}
                      aria-current={isActive ? (isDraft && link.href.includes('#') ? 'location' : 'page') : undefined}
                      className={cn(
                        'block rounded-lg px-3 py-3 text-base font-medium',
                        isDraft
                          ? isActive
                            ? 'bg-brand-500/20 text-brand-300'
                            : 'text-slate-200 hover:bg-white/10 hover:text-brand-300'
                          : isHome
                            ? isActive
                              ? 'bg-amber-500 text-white'
                              : 'text-slate-200 hover:bg-white/10'
                            : isActive
                              ? 'bg-amber-500 text-white'
                              : 'text-slate-700 hover:bg-slate-50',
                      )}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })()
            ))}
          </ul>
          {isDraft ? (
            <Link
              href="#get-app"
              onClick={() => setOpen(false)}
              className="mt-4 block rounded-lg bg-brand-500 px-4 py-3 text-center text-sm font-semibold text-white"
            >
              Get app
            </Link>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Link
                href="/about-us"
                className={cn(
                  'rounded-lg border px-4 py-3 text-center text-sm font-medium',
                  pathname === '/about-us'
                    ? 'border-amber-500 bg-amber-500 text-white'
                    : isHome
                      ? 'border-white/25 text-white'
                      : 'border-slate-300 text-slate-700',
                )}
              >
                About us
              </Link>
              <Link
                href="/contact"
                onClick={() => setOpen(false)}
                className={cn(
                  'rounded-lg border px-4 py-3 text-center text-sm font-medium',
                  pathname === '/contact'
                    ? 'border-amber-500 bg-amber-500 text-white'
                    : isHome
                      ? 'border-white/25 text-white'
                      : 'border-slate-300 text-slate-700',
                )}
              >
                Contact us
              </Link>
            </div>
          )}
        </nav>
      )}
    </header>
  );
}
