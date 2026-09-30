import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-left text-sm">{children}</table>
    </div>
  );
}

export function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th
      scope="col"
      className={cn(
        'border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500',
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={cn('border-b border-slate-100 px-4 py-3 align-middle', className)}>{children}</td>;
}

/** Row that navigates on click and via Enter/Space. */
export function Tr({ children, onClick, label }: { children: React.ReactNode; onClick?: () => void; label?: string }) {
  return (
    <tr
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      tabIndex={onClick ? 0 : undefined}
      aria-label={label}
      className={cn(
        '[&:last-child>td]:border-b-0',
        onClick && 'cursor-pointer transition-colors hover:bg-slate-50 focus:bg-slate-50 focus:outline-none',
      )}
    >
      {children}
    </tr>
  );
}

export function TableSkeleton({ rows = 6, columns }: { rows?: number; columns: number }) {
  return (
    <>
      {Array.from({ length: rows }, (_, r) => (
        <tr key={r}>
          {Array.from({ length: columns }, (_, c) => (
            <Td key={c}>
              <span className={cn('block h-4 animate-pulse rounded bg-slate-100', c === 0 ? 'w-40' : 'w-16')} />
            </Td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  if (total === 0) return null;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <nav className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3" aria-label="Pagination">
      <p className="text-xs text-slate-500">
        Showing <span className="font-semibold text-slate-900">{from}–{to}</span> of{' '}
        <span className="font-semibold text-slate-900">{total}</span>
      </p>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Prev
        </Button>
        <span className="text-xs font-medium text-slate-500">
          {page} / {pageCount}
        </span>
        <Button variant="secondary" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= pageCount}>
          Next
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </nav>
  );
}
