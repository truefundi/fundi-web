import React from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const fieldClass = (invalid?: boolean) =>
  cn(
    'w-full rounded-lg border bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400',
    'focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:bg-slate-50',
    invalid ? 'border-red-500 focus:border-red-500' : 'border-slate-300 focus:border-brand-500',
  );

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-xs font-medium text-red-600" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-slate-500">{hint}</p>
      )}
    </div>
  );
}

type Invalid = { invalid?: boolean };

export function Input({ className, invalid, ...props }: React.InputHTMLAttributes<HTMLInputElement> & Invalid) {
  return <input className={cn(fieldClass(invalid), 'h-10', className)} aria-invalid={invalid || undefined} {...props} />;
}

export function Textarea({
  className,
  invalid,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & Invalid) {
  return (
    <textarea
      className={cn(fieldClass(invalid), 'min-h-[96px] py-2', className)}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
}

export function Select({ className, invalid, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & Invalid) {
  return <select className={cn(fieldClass(invalid), 'h-10', className)} {...props} />;
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search',
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3',
        'focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/30',
        className,
      )}
    >
      <Search className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-full min-w-0 flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
