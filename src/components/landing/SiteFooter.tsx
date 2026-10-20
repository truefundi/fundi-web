'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from './Logo';
import { navLinks } from './content';

// Company and legal pages do not exist yet: placeholders until they are written.
const companyLinks = ['About us', 'Contact', 'Careers'];
const legalLinks = ['Terms of service', 'Privacy policy'];

export function SiteFooter() {
  const pathname = usePathname();

  if (pathname === '/landing-draft') return null;

  return (
    <footer className="relative bg-[#040b16] text-slate-300">
      {/* orange glow line to separate the footer from the section above */}
      <div
        aria-hidden
        className="h-px w-full bg-gradient-to-r from-transparent via-brand-500 to-transparent"
      />

      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Logo dark />
            <p className="mt-4 max-w-xs text-sm leading-6 text-slate-400">
              Tell us what is wrong. Fundi finds who can fix it.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white">Explore</h3>
            <ul className="mt-4 space-y-3 text-sm">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-slate-400 transition-colors hover:text-brand-300">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white">Company</h3>
            <ul className="mt-4 space-y-3 text-sm">
              {companyLinks.map((label) => (
                <li key={label}>
                  <span className="text-slate-500">{label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white">Legal</h3>
            <ul className="mt-4 space-y-3 text-sm">
              {legalLinks.map((label) => (
                <li key={label}>
                  <span className="text-slate-500">{label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-2 border-t border-white/10 pt-6 text-sm text-slate-500 sm:flex-row">
          <p>© {new Date().getFullYear()} Fundi. All rights reserved.</p>
          <p>Skilled help, on demand.</p>
        </div>
      </div>
    </footer>
  );
}