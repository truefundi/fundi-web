'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import { navigation } from '@/config/navigation';
import { useAuth } from '@/context/AuthContext';
import { hasPermission, type UserRole } from '@/types/user';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api'; // <-- Fixed to named import

function isActive(pathname: string, href: string): boolean {
  return href === '/admin' ? pathname === '/admin' : pathname === href || pathname.startsWith(`${href}/`);
}

const routeCountKeyMap: Record<string, string> = {
  '/admin/jobs': 'jobs',
  '/admin/chats': 'chats',
  '/admin/technicians': 'technicians',
  '/admin/customers': 'customers',
  '/admin/users': 'users',
  '/admin/staff': 'staff',
  '/admin/categories': 'categories',
  '/admin/charts': 'charts',
  '/admin/services': 'services',
};

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [counts, setCounts] = useState<Record<string, number>>({});

  const effectiveRole = ((user as { staffRole?: UserRole } | null)?.staffRole ?? user?.role) as UserRole | undefined;

  useEffect(() => {
    async function fetchCounts() {
      try {
        const [jobsRes, chatsRes, techsRes, customersRes, usersRes, staffRes, categoriesRes] =
          await Promise.allSettled([
            api.get('/jobs'),
            api.get('/chats'),
            api.get('/technicians'),
            api.get('/customers'),
            api.get('/users'),
            api.get('/staff'),
            api.get('/categories'),
          ]);

        const getLength = (res: PromiseSettledResult<any>) =>
          res.status === 'fulfilled'
            ? Array.isArray(res.value.data)
              ? res.value.data.length
              : res.value.data?.total ?? res.value.data?.data?.length ?? 0
            : 0;

        setCounts({
          jobs: getLength(jobsRes),
          chats: getLength(chatsRes),
          technicians: getLength(techsRes),
          customers: getLength(customersRes),
          users: getLength(usersRes),
          staff: getLength(staffRes),
          categories: getLength(categoriesRes),
        });
      } catch (err) {
        console.error('Failed to load sidebar counts:', err);
      }
    }
    fetchCounts();
  }, []);

  const filteredNavigation = navigation
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => !item.permission || hasPermission(effectiveRole, item.permission),
      ),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <>
      <div
        className={cn('fixed inset-0 z-30 bg-slate-900/40 lg:hidden', open ? 'block' : 'hidden')}
        onClick={onClose}
        aria-hidden
      />

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex h-full max-h-screen w-64 flex-col border-r border-slate-800 bg-slate-950 text-white shadow-xl transition-transform lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 px-4">
          <Link href="/admin" className="flex items-center" onClick={onClose}>
            <Image
              src="/images/logo11.png"
              alt="Fundi logo"
              width={120}
              height={40}
              className="h-8 w-auto"
            />
          </Link>
          <button
            className="rounded-md p-1 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-3 py-4">
          {filteredNavigation.map((section, i) => (
            <div key={section.title ?? i} className="space-y-1">
              {section.title && (
                <p className="px-3 py-0.5 text-[11px] font-semibold tracking-wide text-slate-400">
                  {section.title}
                </p>
              )}
              <ul className="space-y-0.5">
                {section.items.map(({ label, href, icon: Icon }) => {
                  const active = isActive(pathname, href);
                  const countKey = routeCountKeyMap[href];
                  const badgeCount = countKey ? counts[countKey] : undefined;

                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        onClick={onClose}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'flex items-center justify-between rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                          active
                            ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-950/25 font-semibold'
                            : 'text-slate-300 hover:bg-white/10 hover:text-white',
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon
                            className={cn('h-4 w-4 shrink-0', active ? 'text-slate-950' : 'text-slate-400')}
                            aria-hidden
                          />
                          <span>{label}</span>
                        </div>

                        {badgeCount !== undefined && badgeCount > 0 && (
                          <span
                            className={cn(
                              'ml-auto rounded-full px-2 py-0.5 text-xs font-semibold',
                              active
                                ? 'bg-slate-950/15 text-slate-950'
                                : 'bg-slate-800 text-slate-300',
                            )}
                          >
                            {badgeCount}
                          </span>
                        )}
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