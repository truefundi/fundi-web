/** Joins class names, skipping falsy values. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('');
}

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

export function formatDate(iso?: string): string {
  return iso ? dateFormatter.format(new Date(iso)) : '—';
}

export function formatRelative(iso?: string): string {
  if (!iso) return '—';
  const diffMs = Date.now() - Date.parse(iso);
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(iso);
}

/** +250788123456 → +250 788 123 456 */
export function formatPhone(phone: string): string {
  const match = phone.match(/^\+250(\d{3})(\d{3})(\d{3})$/);
  return match ? `+250 ${match[1]} ${match[2]} ${match[3]}` : phone;
}
