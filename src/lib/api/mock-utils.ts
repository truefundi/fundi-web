import type { ListQuery, PaginatedResponse, SortOrder } from '@/types/api';
import type { Account } from '@/types/customer';

export const DEFAULT_PAGE_SIZE = 10;

/** Case-insensitive match on name and email, plus digits-only match on phone. */
export function matchesSearch(account: Account, search?: string): boolean {
  const term = search?.trim().toLowerCase();
  if (!term) return true;
  const digits = term.replace(/\D/g, '');
  return (
    account.name.toLowerCase().includes(term) ||
    (account.email?.toLowerCase().includes(term) ?? false) ||
    (digits.length > 0 && account.phone.replace(/\D/g, '').includes(digits))
  );
}

function sortAccounts<T extends Account>(items: T[], sort: SortOrder = 'newest'): T[] {
  const copy = [...items];
  if (sort === 'name') return copy.sort((a, b) => a.name.localeCompare(b.name));
  const dir = sort === 'oldest' ? 1 : -1;
  return copy.sort((a, b) => dir * (Date.parse(a.createdAt) - Date.parse(b.createdAt)));
}

/** Search + status filter + extra predicate, then sort and paginate — what the backend list endpoints do. */
export function queryAccounts<T extends Account>(
  items: T[],
  query: ListQuery,
  predicate: (item: T) => boolean = () => true,
): PaginatedResponse<T> {
  const { page = 1, pageSize = DEFAULT_PAGE_SIZE } = query;
  const filtered = items.filter(
    (item) => matchesSearch(item, query.search) && (!query.status || item.status === query.status) && predicate(item),
  );
  const sorted = sortAccounts(filtered, query.sort);
  const start = (page - 1) * pageSize;
  return { items: sorted.slice(start, start + pageSize), total: sorted.length, page, pageSize };
}
