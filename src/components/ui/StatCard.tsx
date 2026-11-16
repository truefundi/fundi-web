import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Card } from "./Card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  loading = false,
  href,
}: {
  label: string;
  value: string | number;
  hint?: ReactNode;
  icon: LucideIcon;
  /** Shows a placeholder bar instead of the value while data loads. */
  loading?: boolean;
  href?: string;
}) {
  const card = (
    <Card
      className={cn(
        "p-5",
        href &&
          "transition-all duration-150 group-hover:-translate-y-0.5 group-hover:border-brand-300 group-hover:shadow-md",
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-700">{label}</p>
        <span className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
          <Icon
            className={cn(
              "h-5 w-5",
              href && "transition-opacity group-hover:opacity-0",
            )}
            aria-hidden
          />
          {href && (
            <ArrowUpRight
              className="absolute h-5 w-5 opacity-0 transition-opacity group-hover:opacity-100"
              aria-hidden
            />
          )}
        </span>
      </div>
      {loading ? (
        <span
          className="mt-3 block h-8 w-16 animate-pulse rounded bg-slate-200"
          aria-label="Loading"
        />
      ) : (
        <p className="mt-3 text-2xl font-bold text-slate-900">{value}</p>
      )}
      {hint && (
        <p className="mt-2 text-sm text-slate-600 leading-relaxed">{hint}</p>
      )}
      {href && (
        <span className="mt-3 inline-block text-xs font-semibold text-brand-700">
          View details
        </span>
      )}
    </Card>
  );

  return href ? (
    <Link
      href={href}
      className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
    >
      {card}
    </Link>
  ) : (
    card
  );
}
