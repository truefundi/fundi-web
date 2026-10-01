'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, KeyRound, LogOut, UserRound } from 'lucide-react';
import { cn } from '@/lib/utils';

// Placeholder account until authentication is wired up.
const currentUser = { name: 'Admin', email: 'admin@fundi.app', initials: 'AD' };

const itemClass = 'flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50';

export function UserMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close when clicking outside the menu or pressing Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-slate-100"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600">
          {currentUser.initials}
        </span>
        <span className="hidden text-sm font-medium text-slate-700 sm:block">{currentUser.name}</span>
        <ChevronDown className={cn('h-4 w-4 text-slate-400 transition-transform', open && 'rotate-180')} aria-hidden />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
        >
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">{currentUser.name}</p>
            <p className="truncate text-xs text-slate-500">{currentUser.email}</p>
          </div>
          <Link href="/admin/profile" role="menuitem" onClick={close} className={itemClass}>
            <UserRound className="h-4 w-4 text-slate-400" aria-hidden /> Profile
          </Link>
          <Link href="/admin/profile#change-password" role="menuitem" onClick={close} className={itemClass}>
            <KeyRound className="h-4 w-4 text-slate-400" aria-hidden /> Change password
          </Link>
          <div className="my-1 border-t border-slate-100" />
          {/* UI only: returns to the login screen until real sign-out exists. */}
          <Link href="/login" role="menuitem" onClick={close} className={cn(itemClass, 'text-red-600 hover:bg-red-50')}>
            <LogOut className="h-4 w-4" aria-hidden /> Log out
          </Link>
        </div>
      )}
    </div>
  );
}
