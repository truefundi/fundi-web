import { Logo } from './Logo';
import { navLinks } from './content';

// Company and legal pages do not exist yet: placeholders until they are written.
const companyLinks = ['About us', 'Contact', 'Careers'];
const legalLinks = ['Terms of service', 'Privacy policy'];

export function SiteFooter() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Logo dark />
            <p className="mt-4 max-w-xs text-sm">Tell us what is wrong. Fundi finds who can fix it.</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">Explore</h3>
            <ul className="mt-4 space-y-3 text-sm">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="hover:text-white">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">Company</h3>
            <ul className="mt-4 space-y-3 text-sm">
              {companyLinks.map((label) => (
                <li key={label}>
                  <span className="text-slate-400">{label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">Legal</h3>
            <ul className="mt-4 space-y-3 text-sm">
              {legalLinks.map((label) => (
                <li key={label}>
                  <span className="text-slate-400">{label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-slate-800 pt-6 text-center text-sm text-slate-400">
          © {new Date().getFullYear()} Fundi. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
