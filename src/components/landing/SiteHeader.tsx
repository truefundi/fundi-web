'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, Menu, X } from 'lucide-react';
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
  const [supportOpen, setSupportOpen] = useState(false);
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
  const visibleNavLinks = isDraft
    ? draftNavLinks
    : [
        ...navLinks.filter((link) => ['/', '/services', '/how-it-works'].includes(link.href)),
        { label: 'About', href: '/about-us' },
      ];
  const supportIsActive = pathname === '/faq' || pathname === '/contact';
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
                      'rounded-none border-b-2 border-transparent px-3 py-1.5 text-sm font-medium transition-colors',
                      isDraft
                        ? isActive
                          ? 'border-brand-400 text-brand-400 underline decoration-brand-400 decoration-2 underline-offset-8'
                          : 'text-slate-200 hover:text-brand-300'
                        : isHome
                          ? isActive
                            ? 'border-brand-400 text-brand-400 underline decoration-brand-400 decoration-2 underline-offset-8'
                            : 'text-slate-200 hover:text-brand-300'
                          : isActive
                            ? 'border-brand-500 text-brand-600 underline decoration-brand-500 decoration-2 underline-offset-8'
                            : 'text-slate-600 hover:text-brand-600',
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })()
            ))}
          </nav>

          {!isDraft && (
            <>
              <div className="relative">
                <button
                  type="button"
                  aria-expanded={supportOpen}
                  aria-haspopup="true"
                  onClick={() => setSupportOpen((isOpen) => !isOpen)}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-none border-b-2 border-transparent px-3 py-1.5 text-sm font-medium transition-colors',
                    supportIsActive
                      ? 'border-brand-400 text-brand-400 underline decoration-brand-400 decoration-2 underline-offset-8'
                      : 'text-slate-200 hover:text-brand-300',
                  )}
                >
                  Support
                  <ChevronDown className={cn('h-4 w-4 transition-transform', supportOpen && 'rotate-180')} aria-hidden />
                </button>
                {supportOpen && (
                  <div className="absolute left-0 top-full z-20 mt-2 min-w-40 rounded-xl border border-white/10 bg-[#071426] p-2 shadow-xl">
                    {[
                      { label: 'FAQ', href: '/faq' },
                      { label: 'Contact us', href: '/contact' },
                    ].map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setSupportOpen(false)}
                        aria-current={pathname === link.href ? 'page' : undefined}
                        className={cn(
                          'block rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                          pathname === link.href
                            ? 'text-brand-400 underline decoration-brand-400 decoration-2 underline-offset-4'
                            : 'text-slate-200 hover:bg-white/10 hover:text-brand-300',
                        )}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              <Link
                href="/for-technicians"
                aria-current={pathname === '/for-technicians' ? 'page' : undefined}
                className={cn(
                  'rounded-lg border px-3 py-2 text-sm font-semibold transition-colors',
                  pathname === '/for-technicians'
                    ? 'border-brand-400 bg-brand-500/10 text-brand-300'
                    : 'border-white/30 text-white hover:border-brand-400 hover:text-brand-300',
                )}
              >
                For technicians
              </Link>
            </>
          )}
          <Link
            href={isDraft ? '#get-app' : '/#download'}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-600"
          >
            Get App
          </Link>
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
                            ? 'border-b-2 border-transparent text-brand-400'
                            : 'border-b-2 border-transparent text-slate-200 hover:text-brand-300'
                          : isHome
                            ? isActive
                              ? 'border-b-2 border-transparent text-brand-400'
                              : 'border-b-2 border-transparent text-slate-200 hover:text-brand-300'
                            : isActive
                              ? 'border-b-2 border-transparent text-brand-600'
                              : 'border-b-2 border-transparent text-slate-700 hover:text-brand-600',
                      )}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })()
            ))}
          </ul>
          {!isDraft && (
            <div className="mt-2 space-y-1">
              <button
                type="button"
                aria-expanded={supportOpen}
                onClick={() => setSupportOpen((isOpen) => !isOpen)}
                className={cn(
                  'flex w-full items-center justify-between border-b-2 px-3 py-3 text-base font-medium',
                  supportIsActive
                    ? 'border-transparent text-brand-400'
                    : 'border-transparent text-slate-200',
                )}
              >
                Support
                <ChevronDown className={cn('h-4 w-4 transition-transform', supportOpen && 'rotate-180')} aria-hidden />
              </button>
              {supportOpen && (
                <div className="space-y-1 pl-4">
                  {[
                    { label: 'FAQ', href: '/faq' },
                    { label: 'Contact us', href: '/contact' },
                  ].map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => {
                        setOpen(false);
                        setSupportOpen(false);
                      }}
                      aria-current={pathname === link.href ? 'page' : undefined}
                      className={cn(
                        'block border-b-2 px-3 py-3 text-base font-medium',
                        pathname === link.href
                          ? 'border-transparent text-brand-400'
                          : 'border-transparent text-slate-200',
                      )}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
              <Link
                href="/for-technicians"
                onClick={() => setOpen(false)}
                aria-current={pathname === '/for-technicians' ? 'page' : undefined}
                className={cn(
                  'mt-2 block rounded-lg border px-3 py-3 text-center text-base font-semibold transition-colors',
                  pathname === '/for-technicians'
                    ? 'border-brand-400 bg-brand-500/10 text-brand-300'
                    : 'border-white/30 text-white hover:border-brand-400 hover:text-brand-300',
                )}
              >
                For technicians
              </Link>
            </div>
          )}
          <Link
            href={isDraft ? '#get-app' : '/#download'}
            onClick={() => setOpen(false)}
            className="mt-4 block rounded-lg bg-brand-500 px-4 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-brand-600"
          >
            Get App
          </Link>
        </nav>
      )}
    </header>
  );
}
