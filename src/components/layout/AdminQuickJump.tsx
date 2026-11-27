'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type RefObject,
} from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Command, Search } from 'lucide-react';
import { navigation, type NavItem } from '@/config/navigation';
import { cn } from '@/lib/utils';

const destinations = navigation.flatMap((section) =>
  section.items.map((item) => ({ ...item, section: section.title ?? 'Overview' })),
);
const initialSuggestions = ['/admin', '/admin/jobs', '/admin/users', '/admin/customers', '/admin/technicians'];

export function AdminQuickJump() {
  const pathname = usePathname();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const desktopInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMac, setIsMac] = useState(false);

  const currentPage = destinations
    .filter((item) =>
      item.href === '/admin' ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`),
    )
    .sort((a, b) => b.href.length - a.href.length)[0];

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    const matches = term
      ? destinations.filter(
          (item) =>
            item.label.toLowerCase().includes(term) ||
            item.section.toLowerCase().includes(term) ||
            item.href.toLowerCase().includes(term),
        )
      : initialSuggestions
          .map((href) => destinations.find((item) => item.href === href))
          .filter((item): item is NavItem & { section: string } => Boolean(item));
    return matches.slice(0, 6);
  }, [query]);

  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad|iPod/i.test(navigator.platform));
  }, []);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen(true);
        requestAnimationFrame(() => {
          (window.innerWidth < 640 ? mobileInputRef : desktopInputRef).current?.focus();
        });
      }
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handleShortcut);
    if (open) document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('keydown', handleShortcut);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [open]);

  const selectedIndex = Math.min(activeIndex, Math.max(results.length - 1, 0));

  function handleKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (results.length) setActiveIndex((index) => (index + 1) % results.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (results.length) setActiveIndex((index) => (index - 1 + results.length) % results.length);
    } else if (event.key === 'Enter' && results[selectedIndex]) {
      event.preventDefault();
      router.push(results[selectedIndex].href);
      setOpen(false);
      setQuery('');
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  }

  function renderInput(inputRef: RefObject<HTMLInputElement | null>, resultsId: string) {
    return (
      <div className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 transition focus-within:border-brand-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-100">
        <Search className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search admin pages..."
          aria-label="Search admin pages"
          aria-autocomplete="list"
          aria-controls={resultsId}
          aria-expanded={open}
          className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
        />
        <kbd className="hidden shrink-0 items-center gap-0.5 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400 md:inline-flex">
          {isMac ? <Command className="h-2.5 w-2.5" aria-hidden /> : <span>Ctrl</span>}
          <span aria-hidden> K</span>
        </kbd>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex min-w-0 flex-1 items-center gap-3">
      <div className="hidden min-w-0 shrink-0 items-center gap-2 lg:flex">
        {currentPage && (
          <span className="truncate text-sm font-semibold text-slate-800">{currentPage.label}</span>
        )}
      </div>

      <div className="relative mx-auto hidden w-full max-w-md sm:block">
        {renderInput(desktopInputRef, 'admin-quick-jump-results')}
        {open && (
          <div
            className="absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white py-2 shadow-xl"
          >
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              {query.trim() ? 'Pages' : 'Quick access'}
            </p>
            <div id="admin-quick-jump-results" role="listbox">
              {results.map((item, index) => {
                const Icon = item.icon;
                return (
                  <Link
                    role="option"
                    aria-selected={index === selectedIndex}
                    key={item.href}
                    href={item.href}
                    onClick={() => {
                      setOpen(false);
                      setQuery('');
                    }}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 text-sm',
                      index === selectedIndex ? 'bg-brand-50 text-brand-800' : 'text-slate-700 hover:bg-slate-50',
                    )}
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm ring-1 ring-slate-200">
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{item.label}</span>
                      <span className="block text-xs text-slate-400">{item.section}</span>
                    </span>
                    {pathname === item.href && <span className="text-[10px] font-medium text-brand-700">Current</span>}
                  </Link>
                );
              })}
            </div>
            {results.length === 0 && (
              <p className="px-3 py-4 text-center text-sm text-slate-500">No matching admin pages</p>
            )}
            <p className="mt-1 border-t border-slate-100 px-3 pt-2 text-[10px] text-slate-400">
              Navigate with ↑ ↓ and press Enter
            </p>
          </div>
        )}
      </div>

      <div className="relative ml-auto sm:hidden">
        <button
          type="button"
          onClick={() => {
            if (open) {
              setOpen(false);
            } else {
              setOpen(true);
              requestAnimationFrame(() => mobileInputRef.current?.focus());
            }
          }}
          aria-label="Search admin pages"
          className="rounded-full p-2 text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <Search className="h-5 w-5" aria-hidden />
        </button>
        {open && (
          <div className="absolute right-0 top-full z-40 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
            {renderInput(mobileInputRef, 'admin-quick-jump-results-mobile')}
            <div id="admin-quick-jump-results-mobile" role="listbox" className="mt-2 max-h-72 overflow-y-auto">
              {results.length > 0 ? (
                results.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      role="option"
                      aria-selected={index === selectedIndex}
                      href={item.href}
                      onClick={() => {
                        setOpen(false);
                        setQuery('');
                      }}
                      onMouseEnter={() => setActiveIndex(index)}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm',
                        index === selectedIndex ? 'bg-brand-50 text-brand-800' : 'text-slate-700 hover:bg-slate-50',
                      )}
                    >
                      <Icon className="h-4 w-4 text-slate-400" aria-hidden />
                      <span className="flex-1">{item.label}</span>
                      <span className="text-xs text-slate-400">{item.section}</span>
                    </Link>
                  );
                })
              ) : (
                <p className="py-4 text-center text-sm text-slate-500">No matching admin pages</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
