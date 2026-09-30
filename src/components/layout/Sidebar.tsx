'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import { navigation } from '@/config/navigation';
import { cn } from '@/lib/utils';

function isActive(pathname: string, href: string): boolean {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {/* Backdrop on small screens */}
      <div
        className={cn('fixed inset-0 z-30 bg-slate-900/40 lg:hidden', open ? 'block' : 'hidden')}
        onClick={onClose}
        aria-hidden
      />

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
          <Link href="/" className="flex items-center gap-2.5" onClick={onClose}>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-lg font-bold text-white">
              F
            </span>
            <span className="text-lg font-bold tracking-tight text-slate-900">Fundi</span>
          </Link>
          <button className="rounded-md p-1 text-slate-500 hover:bg-slate-100 lg:hidden" onClick={onClose} aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
          {navigation.map((section, i) => (
            <div key={section.title ?? i}>
              {section.title && (
                <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">{section.title}</p>
              )}
              <ul className="space-y-1">
                {section.items.map(({ label, href, icon: Icon }) => {
                  const active = isActive(pathname, href);
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        onClick={onClose}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                          active ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                        )}
                      >
                        <Icon className="h-5 w-5 shrink-0" aria-hidden />
                        {label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
