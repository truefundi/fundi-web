import { cn, initials } from '@/lib/utils';

const sizes = {
  sm: 'h-9 w-9 text-xs',
  lg: 'h-14 w-14 text-lg',
};

/** Initials circle, as on the mobile TechnicianCard. `inverse` is for use on the orange hero. */
export function Avatar({
  name,
  size = 'sm',
  inverse = false,
  className,
}: {
  name: string;
  size?: keyof typeof sizes;
  inverse?: boolean;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold',
        inverse ? 'bg-white text-brand-600' : 'bg-brand-50 text-brand-700',
        sizes[size],
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
