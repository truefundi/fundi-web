'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import { navigation } from '@/config/navigation';
import { cn } from '@/lib/utils';

function isActive(pathname: string, href: string): boolean {
  return href === '/admin' ? pathname === '/admin' : pathname === href || pathname.startsWith(`${href}/`);
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
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-800 bg-slate-950 text-white shadow-xl transition-transform lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-white/10 px-4">
          <Link href="/admin" className="flex items-center" onClick={onClose}>
            <Image
              src="/images/logo11.png"
              alt="Fundi logo"
              width={120}
              height={40}
              className="h-8 w-auto"
            />
          </Link>
          <button className="rounded-md p-1 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden" onClick={onClose} aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-3 py-4 lg:overflow-y-hidden">
          {navigation.map((section, i) => (
            <div key={section.title ?? i} className="space-y-1">
              {section.title && (
                <p className="px-3 py-0.5 text-[11px] font-semibold tracking-wide text-slate-400">
                  {section.title}
                </p>
              )}
              <ul className="space-y-0.5">
                {section.items.map(({ label, href, icon: Icon }) => {
                  const active = isActive(pathname, href);
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        onClick={onClose}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                          active
                            ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-950/20'
                            : 'text-slate-300 hover:bg-white/10 hover:text-white',
                        )}
                      >
                        <Icon
                          className={cn('h-4 w-4 shrink-0', active ? 'text-slate-950' : 'text-slate-400')}
                          aria-hidden
                        />
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
