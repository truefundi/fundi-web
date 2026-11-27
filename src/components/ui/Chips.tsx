import { cn } from '@/lib/utils';

/** Pill chip from the mobile app's work settings: solid brand fill when selected. */
export function FilterChip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'inline-flex h-8 items-center whitespace-nowrap rounded-full border px-3 text-xs font-medium transition-colors',
        selected
          ? 'border-brand-500 bg-brand-500 text-white'
          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
      )}
    >
      {label}
    </button>
  );
}

/** Single-select chip row with an "All" option. */
export function ChipGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  getLabel = String,
}: {
  label: string;
  options: readonly T[];
  value: T | undefined;
  onChange: (value: T | undefined) => void;
  getLabel?: (value: T) => string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={label}>
      <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</span>
      <FilterChip label="All" selected={!value} onClick={() => onChange(undefined)} />
      {options.map((option) => (
        <FilterChip
          key={option}
          label={getLabel(option)}
          selected={value === option}
          onClick={() => onChange(value === option ? undefined : option)}
        />
      ))}
    </div>
  );
}

/** Segmented tabs (mobile activity screen): slate track, white selected pill. */
export function SegmentedTabs<T extends string>({
  tabs,
  value,
  onChange,
  label,
}: {
  tabs: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="inline-flex max-w-full gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1">
      {tabs.map((tab) => {
        const selected = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.value)}
            className={cn(
              'h-8 whitespace-nowrap rounded-md px-3 text-sm transition-colors',
              selected ? 'bg-white font-semibold text-slate-900 shadow-sm' : 'font-medium text-slate-500 hover:text-slate-900',
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={cn('ml-1.5 rounded-full px-1.5 text-xs', selected ? 'bg-brand-100 text-brand-700' : 'bg-slate-200')}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
