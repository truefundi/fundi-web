'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

/**
 * Keeps list filters in the URL (?search=&status=&page=) so views are shareable
 * and survive refresh. Changing any filter other than `page` resets to page 1.
 */
export function useUrlFilters<K extends string>(keys: readonly K[]) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const values = Object.fromEntries(keys.map((k) => [k, searchParams.get(k) ?? undefined])) as Record<
    K,
    string | undefined
  >;
  const requestedPage = Number(searchParams.get('page'));
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0
    ? requestedPage
    : 1;

  const setParams = useCallback(
    (updates: Partial<Record<K | 'page', string | number | undefined>>) => {
      const next = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === '') next.delete(key);
        else next.set(key, String(value));
      });
      if (!('page' in updates)) next.delete('page');
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return { values, page, setParams };
}

/** Debounce edits, while letting URL navigation replace the input immediately. */
export function useDebouncedSearch(value: string, commit: (value: string) => void) {
  const [draft, setDraft] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const commitRef = useRef(commit);
  useEffect(() => {
    commitRef.current = commit;
  }, [commit]);
  useEffect(() => {
    clearTimeout(timer.current);
    setDraft(value);
    return () => clearTimeout(timer.current);
  }, [value]);
  const update = useCallback((next: string) => {
    setDraft(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => commitRef.current(next.trim()), 300);
  }, []);
  return [draft, update] as const;
}

export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}
