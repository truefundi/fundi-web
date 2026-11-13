"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BadgeCheck,
  Banknote,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  MessageSquareText,
  PackageOpen,
  RefreshCw,
  ShieldAlert,
  Star,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import {
  useDashboardActivityStream,
  useDashboardAnalytics,
} from "@/hooks/useDashboard";
import { useServices } from "@/hooks/useServices";
import { formatRelative } from "@/lib/utils";
import type {
  DashboardOverview,
  DashboardPeriod,
  DashboardQuery,
  DashboardTrendSeries,
} from "@/types/dashboard";
import {
  Card,
  CardBody,
  CardHeader,
  ErrorState,
  StatCard,
} from "@/components/ui";
import { AttentionQueue } from "@/components/dashboard/AttentionQueue";
import { VerificationQueue } from "@/components/dashboard/VerificationQueue";

const TIMEZONE = "Africa/Kigali";
const SELECT_CLASS =
  "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100";

const PERIODS: Array<{ value: DashboardPeriod; label: string }> = [
  { value: "today", label: "Today" },
  { value: "last7days", label: "Last 7 days" },
  { value: "currentMonth", label: "Current month" },
  { value: "month", label: "Selected month" },
  { value: "currentYear", label: "Current year" },
  { value: "year", label: "Selected year" },
  { value: "custom", label: "Custom range" },
];

const FILTERS = {
  requestType: [
    ["NORMAL", "Normal"],
    ["SOS", "SOS"],
  ],
  jobStatus: [
    ["OPEN", "Open"],
    ["ASSIGNED", "Assigned"],
    ["PAUSED", "Paused"],
    ["COMPLETED", "Completed"],
    ["FAILED", "Failed"],
    ["CANCELLED", "Cancelled"],
  ],
  userRole: [
    ["CUSTOMER", "Customer"],
    ["TECHNICIAN", "Technician"],
    ["ADMIN", "Admin"],
  ],
  userStatus: [
    ["ACTIVE", "Active"],
    ["INACTIVE", "Inactive"],
    ["SUSPENDED", "Suspended"],
  ],
  technicianVerificationStatus: [
    ["PENDING", "Pending"],
    ["APPROVED", "Approved"],
    ["REJECTED", "Rejected"],
  ],
  technicianAvailability: [
    ["ONLINE", "Online"],
    ["OFFLINE", "Offline"],
  ],
  paymentStatus: [
    ["VALID", "Valid"],
    ["EXPIRED", "Expired"],
    ["PAUSED", "Paused"],
    ["RESUMED", "Resumed"],
    ["COMPLETED", "Completed"],
  ],
  chatMessageType: [
    ["TEXT", "Text"],
    ["VOICE_NOTE", "Voice note"],
    ["FILE", "File"],
    ["IMAGE", "Image"],
    ["VIDEO", "Video"],
    ["SYSTEM", "System"],
  ],
} as const;

const SECTIONS: Array<{
  id: DashboardSection;
  label: string;
  icon: LucideIcon;
}> = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "jobs", label: "Jobs & people", icon: BriefcaseBusiness },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "quality", label: "Quality & catalog", icon: Star },
  { id: "operations", label: "Operations", icon: Activity },
];

const CHART_COLORS = [
  "#f97316",
  "#0284c7",
  "#16a34a",
  "#9333ea",
  "#e11d48",
  "#0891b2",
];

type DashboardSection =
  "overview" | "jobs" | "payments" | "quality" | "operations";
type CountRow = { label: string; value: number };

function wrapChartLabel(label: string, maxLength: number) {
  const words = label.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    if (line && line.length + word.length + 1 > maxLength) {
      lines.push(line);
      line = "";
    }

    let remaining = word;
    while (remaining.length > maxLength) {
      if (line) {
        lines.push(line);
        line = "";
      }
      lines.push(remaining.slice(0, maxLength));
      remaining = remaining.slice(maxLength);
    }

    line = line ? `${line} ${remaining}` : remaining;
  }

  if (line) lines.push(line);
  return lines.length ? lines : [label];
}

function localDateTime(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function datePart(date: Date, part: "year" | "month", timeZone: string) {
  return new Intl.DateTimeFormat("en", {
    timeZone,
    [part]: part === "year" ? "numeric" : "2-digit",
  }).format(date);
}

function monthKey(date: Date, timeZone: string) {
  return `${datePart(date, "year", timeZone)}-${datePart(date, "month", timeZone)}`;
}

function number(value: number) {
  return new Intl.NumberFormat("en-RW", { maximumFractionDigits: 0 }).format(
    value,
  );
}

function money(value: number) {
  return `RWF ${number(value)}`;
}

function displayEnum(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function sumCounts(rows: Array<{ count: number }>, active?: boolean) {
  return rows.reduce(
    (total, row) =>
      active === undefined ||
      (row as { isActive?: boolean }).isActive === active
        ? total + row.count
        : total,
    0,
  );
}

function groupBy<T extends { count: number }>(
  rows: T[],
  getKey: (row: T) => string,
): CountRow[] {
  const values = new Map<string, number>();
  for (const row of rows)
    values.set(getKey(row), (values.get(getKey(row)) ?? 0) + row.count);
  return [...values].map(([label, value]) => ({ label, value }));
}

function compareHint(overview: DashboardOverview | undefined, metric: string) {
  const result = overview?.comparison?.metrics[metric];
  if (!result || result.changePercent === null) return undefined;
  const positive = result.changePercent >= 0;
  return (
    <span
      className={`inline-flex items-center gap-1 ${positive ? "text-emerald-700" : "text-red-600"}`}
    >
      {positive ? (
        <ArrowUpRight className="h-3.5 w-3.5" />
      ) : (
        <ArrowDownRight className="h-3.5 w-3.5" />
      )}
      {Math.abs(result.changePercent)}% vs previous period
    </span>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: ReadonlyArray<readonly [string, string]>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-xs font-medium text-slate-600">
        {label}
      </span>
      <select
        className={SELECT_CLASS}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">All</option>
        {options.map(([key, text]) => (
          <option key={key} value={key}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
}

function DonutChart({
  title,
  description,
  rows,
  loading = false,
}: {
  title: string;
  description: string;
  rows: CountRow[];
  loading?: boolean;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const visibleRows = rows.filter((row) => row.value > 0);
  const total = visibleRows.reduce((sum, row) => sum + row.value, 0);
  const circumference = 2 * Math.PI * 48;
  let accumulated = 0;
  const segments = visibleRows.map((row, index) => {
    const length = total ? (row.value / total) * circumference : 0;
    const segment = { row, index, length, offset: accumulated };
    accumulated += length;
    return segment;
  });
  const hovered =
    hoveredIndex === null ? undefined : segments[hoveredIndex]?.row;

  return (
    <Card>
      <CardHeader title={title} description={description} />
      <CardBody>
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          <div className="relative h-40 w-40 shrink-0">
            <svg
              viewBox="0 0 120 120"
              className="h-full w-full overflow-visible"
              role="group"
              aria-label={`${title}: ${visibleRows.map((row) => `${row.label} ${row.value}`).join(", ") || "no data"}`}
            >
              <circle
                cx="60"
                cy="60"
                r="48"
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="16"
              />
              {segments.map(({ row, index, length, offset }) => (
                <circle
                  key={row.label}
                  cx="60"
                  cy="60"
                  r="48"
                  fill="none"
                  stroke={CHART_COLORS[index % CHART_COLORS.length]}
                  strokeWidth={hoveredIndex === index ? 20 : 16}
                  strokeDasharray={`${length} ${circumference - length}`}
                  strokeDashoffset={-offset}
                  transform="rotate(-90 60 60)"
                  className="cursor-pointer transition-[stroke-width] focus:outline-none"
                  tabIndex={0}
                  role="img"
                  aria-label={`${row.label}: ${number(row.value)} (${Math.round((row.value / total) * 100)}%)`}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onFocus={() => setHoveredIndex(index)}
                  onBlur={() => setHoveredIndex(null)}
                >
                  <title>{`${row.label}: ${number(row.value)} (${Math.round((row.value / total) * 100)}%)`}</title>
                </circle>
              ))}
            </svg>
            <div className="pointer-events-none absolute inset-5 flex flex-col items-center justify-center rounded-full bg-white">
              <span className="text-3xl font-bold tracking-tight text-slate-900">
                {number(total)}
              </span>
              <span className="text-xs text-slate-500">total</span>
            </div>
          </div>
          <ul className="w-full space-y-3">
            {visibleRows.length ? (
              visibleRows.map((row, index) => (
                <li
                  key={row.label}
                  className={`flex items-center justify-between gap-3 rounded px-1 text-sm ${hoveredIndex === index ? "bg-slate-50" : ""}`}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <span className="flex min-w-0 items-center gap-2 text-slate-600">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{
                        backgroundColor:
                          CHART_COLORS[index % CHART_COLORS.length],
                      }}
                    />
                    <span className="truncate">{row.label}</span>
                  </span>
                  <span className="font-semibold text-slate-900">
                    {number(row.value)}
                    <span className="ml-1 font-normal text-slate-400">
                      {`${Math.round((row.value / total) * 100)}%`}
                    </span>
                  </span>
                </li>
              ))
            ) : (
              <li className="py-8 text-center text-sm text-slate-500">
                {loading ? "Loading chart data…" : "No data in this period."}
              </li>
            )}
          </ul>
        </div>
        {hovered && (
          <p
            className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700"
            aria-live="polite"
          >
            <span className="font-semibold">{hovered.label}</span>
            <span className="ml-2">{number(hovered.value)} records</span>
            <span className="ml-2 text-slate-500">
              {Math.round((hovered.value / total) * 100)}% of total
            </span>
          </p>
        )}
      </CardBody>
    </Card>
  );
}

function BarChart({
  title,
  description,
  rows,
  loading = false,
}: {
  title: string;
  description: string;
  rows: CountRow[];
  loading?: boolean;
}) {
  const [orientation, setOrientation] = useState<"vertical" | "horizontal">(
    "vertical",
  );
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const chartRows = rows.slice(0, 7);
  const max = Math.max(1, ...chartRows.map((row) => row.value));
  const left = 38;
  const right = 740;
  const top = 24;
  const bottom = 205;
  const slot = chartRows.length
    ? (right - left) / chartRows.length
    : right - left;
  const barWidth = Math.min(42, slot * 0.56);
  const labelLines = chartRows.map((row) =>
    wrapChartLabel(row.label, Math.max(10, Math.floor((slot - 12) / 5.5))),
  );
  const chartHeight = Math.max(
    250,
    bottom + 18 + Math.max(1, ...labelLines.map((lines) => lines.length)) * 12 + 8,
  );
  const hovered = hoveredIndex === null ? undefined : chartRows[hoveredIndex];

  return (
    <Card>
      <CardHeader
        title={title}
        description={description}
        action={
          <div className="flex rounded-lg border border-slate-200 p-0.5">
            {(["vertical", "horizontal"] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={orientation === value}
                onClick={() => setOrientation(value)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize ${
                  orientation === value
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        }
      />
      <CardBody>
        {loading ? (
          <div className="h-64 animate-pulse rounded-lg bg-slate-100" />
        ) : chartRows.length ? (
          orientation === "horizontal" ? (
            <ul className="space-y-4">
              {chartRows.map((row, index) => (
                <li
                  key={row.label}
                  className={`rounded-lg px-2 py-1 ${hoveredIndex === index ? "bg-slate-50" : ""}`}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                    <span className="truncate font-medium text-slate-700">
                      {row.label}
                    </span>
                    <span className="shrink-0 font-semibold text-slate-900">
                      {number(row.value)}
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full transition-[width]"
                      style={{
                        width: `${row.value === 0 ? 0 : Math.max(2, (row.value / max) * 100)}%`,
                        backgroundColor:
                          CHART_COLORS[index % CHART_COLORS.length],
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="overflow-x-auto">
              <svg
                className="min-w-[560px] w-full"
                style={{ height: `${Math.max(256, chartHeight)}px` }}
                viewBox={`0 0 780 ${chartHeight}`}
                role="img"
                aria-label={`${title} bar chart`}
              >
                {[0, 1, 2, 3].map((tick) => {
                  const y = top + (tick * (bottom - top)) / 3;
                  return (
                    <g key={tick}>
                      <line
                        x1={left}
                        x2={right}
                        y1={y}
                        y2={y}
                        stroke="#e2e8f0"
                        strokeDasharray={tick === 3 ? undefined : "3 4"}
                      />
                      <text
                        x={left - 8}
                        y={y + 4}
                        textAnchor="end"
                        className="fill-slate-400"
                        fontSize="10"
                      >
                        {Math.round(max * (1 - tick / 3))}
                      </text>
                    </g>
                  );
                })}
                {chartRows.map((row, index) => {
                  const height = (row.value / max) * (bottom - top);
                  const x = left + slot * index + (slot - barWidth) / 2;
                  const y = bottom - height;
                  return (
                    <g key={row.label}>
                      <rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={Math.max(2, height)}
                        rx="6"
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                        opacity="0.88"
                        tabIndex={0}
                        onMouseEnter={() => setHoveredIndex(index)}
                        onMouseLeave={() => setHoveredIndex(null)}
                        onFocus={() => setHoveredIndex(index)}
                        onBlur={() => setHoveredIndex(null)}
                      >
                        <title>{`${row.label}: ${number(row.value)}`}</title>
                      </rect>
                      <text
                        x={x + barWidth / 2}
                        y={Math.max(top - 5, y - 7)}
                        textAnchor="middle"
                        className="fill-slate-700"
                        fontSize="10"
                        fontWeight="600"
                      >
                        {number(row.value)}
                      </text>
                      <text
                        x={x + barWidth / 2}
                        y={bottom + 20}
                        textAnchor="middle"
                        className="fill-slate-500"
                        fontSize="10"
                      >
                        <title>{row.label}</title>
                        {labelLines[index].map((line, lineIndex) => (
                          <tspan
                            key={`${line}-${lineIndex}`}
                            x={x + barWidth / 2}
                            dy={lineIndex === 0 ? 0 : 12}
                          >
                            {line}
                          </tspan>
                        ))}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          )
        ) : (
          <p className="py-12 text-center text-sm text-slate-500">
            No data in this period.
          </p>
        )}
        {hovered && !loading && (
          <p
            className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700"
            aria-live="polite"
          >
            <span className="font-semibold">{hovered.label}</span>
            <span className="ml-2">{number(hovered.value)} records</span>
          </p>
        )}
      </CardBody>
    </Card>
  );
}

function ParetoChart({
  title,
  description,
  rows,
  loading = false,
}: {
  title: string;
  description: string;
  rows: CountRow[];
  loading?: boolean;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const chartRows = rows
    .filter((row) => row.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 7);
  const total = chartRows.reduce((sum, row) => sum + row.value, 0);
  const max = Math.max(1, ...chartRows.map((row) => row.value));
  const left = 44;
  const right = 724;
  const top = 24;
  const bottom = 205;
  const slot = chartRows.length
    ? (right - left) / chartRows.length
    : right - left;
  const barWidth = Math.min(42, slot * 0.56);
  let cumulative = 0;
  const cumulativePoints = chartRows.map((row, index) => {
    cumulative += row.value;
    return {
      x: left + slot * index + slot / 2,
      y: bottom - (cumulative / Math.max(1, total)) * (bottom - top),
      percent: (cumulative / Math.max(1, total)) * 100,
    };
  });
  const hovered = hoveredIndex === null ? undefined : chartRows[hoveredIndex];

  return (
    <Card>
      <CardHeader
        title={title}
        description={description}
        action={
          <span className="text-xs font-medium text-slate-500">
            Bars: jobs · Line: cumulative %
          </span>
        }
      />
      <CardBody>
        {loading ? (
          <div className="h-64 animate-pulse rounded-lg bg-slate-100" />
        ) : chartRows.length ? (
          <div className="overflow-x-auto">
            <svg
              className="h-64 min-w-[560px] w-full"
              viewBox="0 0 760 250"
              role="img"
              aria-label={`${title} Pareto chart`}
            >
              {[0, 1, 2, 3].map((tick) => {
                const y = top + (tick * (bottom - top)) / 3;
                return (
                  <g key={tick}>
                    <line
                      x1={left}
                      x2={right}
                      y1={y}
                      y2={y}
                      stroke="#e2e8f0"
                      strokeDasharray={tick === 3 ? undefined : "3 4"}
                    />
                    <text
                      x={left - 8}
                      y={y + 4}
                      textAnchor="end"
                      className="fill-slate-400"
                      fontSize="10"
                    >
                      {Math.round(max * (1 - tick / 3))}
                    </text>
                    <text
                      x={right + 8}
                      y={y + 4}
                      className="fill-slate-400"
                      fontSize="10"
                    >
                      {`${100 - (tick * 100) / 3}%`}
                    </text>
                  </g>
                );
              })}
              {chartRows.map((row, index) => {
                const height = (row.value / max) * (bottom - top);
                const x = left + slot * index + (slot - barWidth) / 2;
                const y = bottom - height;
                const label =
                  row.label.length > 12
                    ? `${row.label.slice(0, 11)}…`
                    : row.label;
                return (
                  <g key={row.label}>
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={Math.max(2, height)}
                      rx="5"
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                      opacity={hoveredIndex === index ? 1 : 0.82}
                      className="cursor-pointer"
                      tabIndex={0}
                      onMouseEnter={() => setHoveredIndex(index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      onFocus={() => setHoveredIndex(index)}
                      onBlur={() => setHoveredIndex(null)}
                    >
                      <title>{`${row.label}: ${number(row.value)} jobs`}</title>
                    </rect>
                    <text
                      x={x + barWidth / 2}
                      y={Math.max(top - 5, y - 7)}
                      textAnchor="middle"
                      className="fill-slate-700"
                      fontSize="10"
                    >
                      {number(row.value)}
                    </text>
                    <text
                      x={x + barWidth / 2}
                      y={bottom + 20}
                      textAnchor="middle"
                      className="fill-slate-500"
                      fontSize="10"
                    >
                      {label}
                    </text>
                  </g>
                );
              })}
              <polyline
                points={cumulativePoints
                  .map((point) => `${point.x},${point.y}`)
                  .join(" ")}
                fill="none"
                stroke="#0f172a"
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {cumulativePoints.map((point, index) => (
                <circle
                  key={chartRows[index].label}
                  cx={point.x}
                  cy={point.y}
                  r={hoveredIndex === index ? 5 : 3.5}
                  fill="white"
                  stroke="#0f172a"
                  strokeWidth="2"
                  className="cursor-crosshair"
                  tabIndex={0}
                  aria-label={`${chartRows[index].label}: ${number(chartRows[index].value)} jobs, ${point.percent.toFixed(1)}% cumulative`}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onFocus={() => setHoveredIndex(index)}
                  onBlur={() => setHoveredIndex(null)}
                >
                  <title>{`${chartRows[index].label}: ${point.percent.toFixed(1)}% cumulative`}</title>
                </circle>
              ))}
            </svg>
          </div>
        ) : (
          <p className="py-12 text-center text-sm text-slate-500">
            No data in this period.
          </p>
        )}
        {hovered && hoveredIndex !== null && !loading && (
          <p
            className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700"
            aria-live="polite"
          >
            <span className="font-semibold">{hovered.label}</span>
            <span className="ml-2">{number(hovered.value)} jobs</span>
            <span className="ml-2 text-slate-500">
              {cumulativePoints[hoveredIndex]?.percent.toFixed(1)}% cumulative
            </span>
          </p>
        )}
      </CardBody>
    </Card>
  );
}

function TrendChart({
  title,
  description,
  series,
  interval,
  loading,
  area = false,
  valueFormatter = number,
}: {
  title: string;
  description: string;
  series: DashboardTrendSeries[];
  interval: string;
  loading: boolean;
  area?: boolean;
  valueFormatter?: (value: number) => string;
}) {
  const [hoveredPoint, setHoveredPoint] = useState<{
    seriesIndex: number;
    bucketIndex: number;
  } | null>(null);
  const buckets = [
    ...new Set(
      series.flatMap((item) => item.data.map((point) => point.bucket)),
    ),
  ].sort();
  const values = series.flatMap((item) =>
    item.data.map((point) => point.value ?? 0),
  );
  const max = Math.max(1, ...values);
  const left = 56;
  const right = 760;
  const top = 18;
  const bottom = 205;
  const x = (index: number) =>
    left +
    (buckets.length === 1
      ? (right - left) / 2
      : (index * (right - left)) / (buckets.length - 1));
  const y = (value: number) => bottom - (value / max) * (bottom - top);

  return (
    <Card>
      <CardHeader title={title} description={description} />
      <CardBody>
        {loading ? (
          <div className="h-64 animate-pulse rounded-lg bg-slate-100" />
        ) : buckets.length ? (
          <>
            <div className="mb-3 flex flex-wrap gap-x-5 gap-y-2">
              {series.map((item, index) => (
                <span
                  key={`${item.domain}.${item.metric}`}
                  className="inline-flex items-center gap-2 text-xs text-slate-600"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{
                      backgroundColor:
                        CHART_COLORS[index % CHART_COLORS.length],
                    }}
                  />
                  {trendLabel(item)}
                </span>
              ))}
            </div>
            <div className="overflow-x-auto">
              <svg
                className="h-64 min-w-[560px] w-full"
                viewBox="0 0 800 250"
                role="img"
                aria-label={`${title} line chart`}
              >
                {[0, 1, 2, 3, 4].map((tick) => {
                  const value = (max * (4 - tick)) / 4;
                  const yPosition = top + (tick * (bottom - top)) / 4;
                  return (
                    <g key={tick}>
                      <line
                        x1={left}
                        x2={right}
                        y1={yPosition}
                        y2={yPosition}
                        stroke="#e2e8f0"
                        strokeDasharray={tick === 4 ? undefined : "3 4"}
                      />
                      <text
                        x={left - 8}
                        y={yPosition + 4}
                        textAnchor="end"
                        className="fill-slate-400"
                        fontSize="10"
                      >
                        {valueFormatter(value)}
                      </text>
                    </g>
                  );
                })}
                {series.map((item, seriesIndex) => {
                  const pointsByBucket = new Map(
                    item.data.map((point) => [point.bucket, point.value ?? 0]),
                  );
                  const points = buckets.map(
                    (bucket, index) =>
                      [x(index), y(pointsByBucket.get(bucket) ?? 0)] as const,
                  );
                  const line = points
                    .map(([pointX, pointY]) => `${pointX},${pointY}`)
                    .join(" ");
                  const color = CHART_COLORS[seriesIndex % CHART_COLORS.length];
                  const areaPoints = [
                    `${points[0]?.[0] ?? left},${bottom}`,
                    ...points.map(([pointX, pointY]) => `${pointX},${pointY}`),
                    `${points[points.length - 1]?.[0] ?? right},${bottom}`,
                  ].join(" ");
                  return (
                    <g key={`${item.domain}.${item.metric}`}>
                      {area && (
                        <polygon
                          points={areaPoints}
                          fill={color}
                          opacity="0.12"
                        />
                      )}
                      <polyline
                        points={line}
                        fill="none"
                        stroke={color}
                        strokeWidth="2.5"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                      />
                      {points.map(([pointX, pointY], index) => (
                        <circle
                          key={buckets[index]}
                          cx={pointX}
                          cy={pointY}
                          r={
                            hoveredPoint?.seriesIndex === seriesIndex &&
                            hoveredPoint.bucketIndex === index
                              ? 5
                              : 3
                          }
                          fill="white"
                          stroke={color}
                          strokeWidth="2"
                          className="cursor-crosshair"
                          tabIndex={0}
                          aria-label={`${trendLabel(item)} at ${buckets[index]}: ${valueFormatter(pointsByBucket.get(buckets[index]) ?? 0)}`}
                          onMouseEnter={() =>
                            setHoveredPoint({
                              seriesIndex,
                              bucketIndex: index,
                            })
                          }
                          onMouseLeave={() => setHoveredPoint(null)}
                          onFocus={() =>
                            setHoveredPoint({
                              seriesIndex,
                              bucketIndex: index,
                            })
                          }
                          onBlur={() => setHoveredPoint(null)}
                        >
                          <title>{`${buckets[index]}: ${valueFormatter(pointsByBucket.get(buckets[index]) ?? 0)}`}</title>
                        </circle>
                      ))}
                    </g>
                  );
                })}
                {buckets.map((bucket, index) => (
                  <text
                    key={bucket}
                    x={x(index)}
                    y={bottom + 22}
                    textAnchor="middle"
                    className="fill-slate-400"
                    fontSize="10"
                  >
                    {interval === "hour"
                      ? bucket.slice(11, 16)
                      : bucket.slice(5, 10)}
                  </text>
                ))}
              </svg>
            </div>
            {hoveredPoint && (
              <p
                className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700"
                aria-live="polite"
              >
                <span className="font-semibold">
                  {trendLabel(series[hoveredPoint.seriesIndex])}
                </span>
                <span className="ml-2">
                  {buckets[hoveredPoint.bucketIndex]}
                </span>
                <span className="ml-2 font-semibold">
                  {valueFormatter(
                    series[hoveredPoint.seriesIndex]?.data.find(
                      (point) =>
                        point.bucket === buckets[hoveredPoint.bucketIndex],
                    )?.value ?? 0,
                  )}
                </span>
              </p>
            )}
          </>
        ) : (
          <p className="py-12 text-center text-sm text-slate-500">
            No data in this period.
          </p>
        )}
      </CardBody>
    </Card>
  );
}

function trendLabel(series: DashboardTrendSeries) {
  const labels: Record<string, string> = {
    "users.new": "New accounts",
    "jobs.created": "Jobs created",
    "jobs.completed": "Jobs completed",
    "payments.count": "Payments",
    "payments.bookingAmount": "Booking amount",
    "disputes.opened": "Disputes",
    "chat.messages": "Messages",
    "ratings.submitted": "Ratings",
    "ratings.averageScore": "Average score",
    "catalog.categoriesCreated": "Categories",
    "catalog.servicesCreated": "Services",
  };
  return labels[`${series.domain}.${series.metric}`] ?? series.metric;
}

function DataTable({
  title,
  description,
  headers,
  rows,
  emptyText = "No data in this period.",
}: {
  title: string;
  description: string;
  headers: string[];
  rows: Array<Array<string | number>>;
  emptyText?: string;
}) {
  return (
    <Card>
      <CardHeader title={title} description={description} />
      <div className="overflow-x-auto">
        {rows.length ? (
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                {headers.map((header) => (
                  <th key={header} className="px-5 py-3 font-semibold">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row, rowIndex) => (
                <tr key={`${rowIndex}-${row[0]}`} className="text-slate-700">
                  {row.map((cell, cellIndex) => (
                    <td
                      key={`${rowIndex}-${cellIndex}`}
                      className="whitespace-nowrap px-5 py-3"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="px-5 py-10 text-center text-sm text-slate-500">
            {emptyText}
          </p>
        )}
      </div>
    </Card>
  );
}

export function DashboardWorkspace() {
  const today = new Date();
  const [section, setSection] = useState<DashboardSection>("overview");
  const [period, setPeriod] = useState<DashboardPeriod>("currentMonth");
  const [month, setMonth] = useState(() => monthKey(today, TIMEZONE));
  const [year, setYear] = useState(() => datePart(today, "year", TIMEZONE));
  const [from, setFrom] = useState(() =>
    localDateTime(
      new Date(today.getFullYear(), today.getMonth(), today.getDate()),
    ),
  );
  const [to, setTo] = useState(() =>
    localDateTime(
      new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
    ),
  );
  const [compare, setCompare] = useState(false);
  const [serviceCategoryId, setServiceCategoryId] = useState("");
  const [filters, setFilters] = useState({
    requestType: "",
    jobStatus: "",
    userRole: "",
    userStatus: "",
    technicianVerificationStatus: "",
    technicianAvailability: "",
    paymentStatus: "",
    chatMessageType: "",
  });

  const queryState = useMemo(() => {
    const result: DashboardQuery = { period, timezone: TIMEZONE, compare };
    let ready = true;
    if (period === "month") {
      result.month = month;
      ready = /^\d{4}-(0[1-9]|1[0-2])$/.test(month);
    }
    if (period === "year") {
      result.year = Number(year);
      ready =
        /^\d{4}$/.test(year) && Number(year) >= 2000 && Number(year) <= 9999;
    }
    if (period === "custom") {
      const start = new Date(from);
      const end = new Date(to);
      ready = Boolean(
        from &&
        to &&
        Number.isFinite(start.getTime()) &&
        Number.isFinite(end.getTime()) &&
        start < end,
      );
      if (ready) {
        result.from = start.toISOString();
        result.to = end.toISOString();
      }
    }
    if (serviceCategoryId) result.serviceCategoryId = serviceCategoryId;
    for (const [key, value] of Object.entries(filters)) {
      if (value) result[key as keyof typeof filters] = value;
    }
    return { query: result, ready };
  }, [compare, filters, from, month, period, serviceCategoryId, to, year]);

  const query = queryState.query;
  const analytics = useDashboardAnalytics(query, queryState.ready, section);
  const activityConnected = useDashboardActivityStream(query);
  const services = useServices();
  const overview = analytics.overview.data;
  const breakdowns = analytics.breakdowns.data;
  const trends = analytics.trends.data;
  const topTechnicians = analytics.topTechnicians.data?.data ?? [];
  const setFilter = (key: keyof typeof filters, value: string) =>
    setFilters((current) => ({ ...current, [key]: value }));

  if (analytics.overview.isError) {
    return (
      <Card>
        <ErrorState
          title="Could not load dashboard analytics"
          message={analytics.overview.error.message}
          onRetry={() => analytics.overview.refetch()}
        />
      </Card>
    );
  }

  const queryError = [
    analytics.trends,
    analytics.breakdowns,
    ...(section === "quality" ? [analytics.topTechnicians] : []),
    ...(section === "operations" ? [analytics.activity] : []),
  ].find((result) => result.isError);

  const jobStatusRows = groupBy(
    breakdowns?.jobs.statusRequestTypePriority ?? [],
    (row) =>
      row.status
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/^\w/, (letter) => letter.toUpperCase()),
  );
  const paymentStatusRows = groupBy(breakdowns?.payments ?? [], (row) =>
    row.status.replaceAll("_", " "),
  );
  const categoryJobRows = (breakdowns?.jobs.serviceCategories ?? [])
    .filter((row) => row.serviceCategory)
    .map((row) => ({
      label: row.serviceCategory!.name ?? "Unnamed service",
      value: row.count,
    }))
    .sort((a, b) => b.value - a.value);
  const ratingRows = (breakdowns?.ratingsByItem ?? [])
    .map((row) => ({
      label: row.item,
      value: row.averageScore ?? 0,
    }))
    .sort((a, b) => b.value - a.value);
  const jobCounts = (status: string) =>
    jobStatusRows.find((row) => row.label.toUpperCase() === status)?.value ?? 0;

  const metricSets: Record<
    DashboardSection,
    Array<{
      label: string;
      value: string | number;
      icon: LucideIcon;
      hint?: ReactNode;
      href: string;
    }>
  > = {
    overview: [
      {
        label: "New accounts",
        value: overview?.users.newAccounts ?? "—",
        icon: Users,
        hint: compareHint(overview, "newAccounts"),
        href: "/admin/users",
      },
      {
        label: "Jobs created",
        value: overview?.jobs.created ?? "—",
        icon: BriefcaseBusiness,
        hint: compareHint(overview, "jobsCreated"),
        href: "/admin/jobs",
      },
      {
        label: "Jobs completed",
        value: overview?.jobs.completedInPeriod ?? "—",
        icon: BadgeCheck,
        hint: compareHint(overview, "jobsCompleted"),
        href: "/admin/jobs?group=completed",
      },
      {
        label: "Booking volume",
        value: overview ? money(overview.payments.bookingAmount) : "—",
        icon: Banknote,
        hint: compareHint(overview, "bookingAmount"),
        href: "/admin/payments",
      },
    ],
    jobs: [
      {
        label: "Jobs created",
        value: overview?.jobs.created ?? "—",
        icon: BriefcaseBusiness,
        href: "/admin/jobs",
      },
      {
        label: "Completed",
        value: overview?.jobs.completedInPeriod ?? "—",
        icon: BadgeCheck,
        href: "/admin/jobs?group=completed",
      },
      {
        label: "Open",
        value: jobCounts("OPEN"),
        icon: Activity,
        href: "/admin/jobs?group=matching",
      },
      {
        label: "Cancelled",
        value: jobCounts("CANCELLED"),
        icon: ShieldAlert,
        href: "/admin/jobs?group=cancelled",
      },
    ],
    payments: [
      {
        label: "Booking volume",
        value: overview ? money(overview.payments.bookingAmount) : "—",
        icon: Banknote,
        hint: compareHint(overview, "bookingAmount"),
        href: "/admin/payments",
      },
      {
        label: "Payments",
        value: overview?.payments.count ?? "—",
        icon: CreditCard,
        href: "/admin/payments",
      },
      {
        label: "Valid payments",
        value:
          paymentStatusRows.find((row) => row.label === "VALID")?.value ?? 0,
        icon: BadgeCheck,
        href: "/admin/payments",
      },
      {
        label: "Expired payments",
        value:
          paymentStatusRows.find((row) => row.label === "EXPIRED")?.value ?? 0,
        icon: ClipboardList,
        href: "/admin/payments",
      },
    ],
    quality: [
      {
        label: "Average rating",
        value: overview?.ratings.averageScore ?? "—",
        icon: Star,
        href: "/admin/ratings",
      },
      {
        label: "Ratings submitted",
        value: overview?.ratings.count ?? "—",
        icon: BadgeCheck,
        href: "/admin/ratings",
      },
      {
        label: "New technicians",
        value: overview?.technicians.newProfiles ?? "—",
        icon: Wrench,
        href: "/admin/technicians",
      },
      {
        label: "Active services",
        value: overview
          ? sumCounts(overview.catalog.currentServices, true)
          : "—",
        icon: PackageOpen,
        href: "/admin/categories",
      },
    ],
    operations: [
      {
        label: "Chat messages",
        value: overview?.chat.messages ?? "—",
        icon: MessageSquareText,
        href: "/admin/chats",
      },
      {
        label: "Unresolved disputes",
        value: overview?.disputes.currentlyUnresolved ?? "—",
        icon: ShieldAlert,
        href: "/admin/disputes",
      },
      {
        label: "Cancellation requests",
        value: overview ? sumCounts(overview.cancellationRequests) : "—",
        icon: ClipboardList,
        href: "/admin/jobs?group=cancelled",
      },
      {
        label: "Job offers",
        value: overview ? sumCounts(overview.jobOffers) : "—",
        icon: Activity,
        href: "/admin/matching",
      },
    ],
  };

  const trendSeries = trends?.series ?? [];
  const filteredTrend = (keys: string[]) =>
    trendSeries.filter((item) =>
      keys.includes(`${item.domain}.${item.metric}`),
    );
  const trendLoading = analytics.trends.isPending;
  const breakdownLoading = analytics.breakdowns.isPending;

  return (
    <div className="space-y-6">
      <Card>
        <CardBody>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Reporting controls
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Choose a period and service to update every dashboard view.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <span
                  className={`h-2 w-2 rounded-full ${activityConnected ? "bg-emerald-500" : "bg-slate-300"}`}
                />
                {activityConnected ? "Live activity" : "Activity polling"}
              </span>
              {overview && (
                <span>Updated {formatRelative(overview.generatedAt)}</span>
              )}
              <button
                type="button"
                className="inline-flex items-center gap-1 font-medium text-brand-600 hover:text-brand-700"
                onClick={() =>
                  void Promise.all(
                    Object.values(analytics).map((queryResult) =>
                      queryResult.refetch(),
                    ),
                  )
                }
              >
                <RefreshCw className="h-3.5 w-3.5" /> Refresh
              </button>
            </div>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <label>
              <span className="mb-1.5 block text-xs font-medium text-slate-600">
                Reporting period
              </span>
              <select
                className={SELECT_CLASS}
                value={period}
                onChange={(event) =>
                  setPeriod(event.target.value as DashboardPeriod)
                }
              >
                {PERIODS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            {period === "month" && (
              <label>
                <span className="mb-1.5 block text-xs font-medium text-slate-600">
                  Month
                </span>
                <input
                  className={SELECT_CLASS}
                  type="month"
                  value={month}
                  onChange={(event) => setMonth(event.target.value)}
                />
              </label>
            )}
            {period === "year" && (
              <label>
                <span className="mb-1.5 block text-xs font-medium text-slate-600">
                  Year
                </span>
                <input
                  className={SELECT_CLASS}
                  type="number"
                  min="2000"
                  max="9999"
                  value={year}
                  onChange={(event) => setYear(event.target.value)}
                />
              </label>
            )}
            {period === "custom" && (
              <>
                <label>
                  <span className="mb-1.5 block text-xs font-medium text-slate-600">
                    From (local time)
                  </span>
                  <input
                    className={SELECT_CLASS}
                    type="datetime-local"
                    value={from}
                    onChange={(event) => setFrom(event.target.value)}
                  />
                </label>
                <label>
                  <span className="mb-1.5 block text-xs font-medium text-slate-600">
                    To (exclusive, local time)
                  </span>
                  <input
                    className={SELECT_CLASS}
                    type="datetime-local"
                    value={to}
                    onChange={(event) => setTo(event.target.value)}
                  />
                </label>
              </>
            )}
            <label>
              <span className="mb-1.5 block text-xs font-medium text-slate-600">
                Service category
              </span>
              <select
                className={SELECT_CLASS}
                value={serviceCategoryId}
                onChange={(event) => setServiceCategoryId(event.target.value)}
              >
                <option value="">All service categories</option>
                {(services.data ?? []).map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <details className="mt-4 border-t border-slate-100 pt-4">
            <summary className="cursor-pointer text-sm font-medium text-brand-700 marker:text-brand-500">
              Advanced filters
            </summary>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <FilterSelect
                label="Request type"
                value={filters.requestType}
                options={FILTERS.requestType}
                onChange={(value) => setFilter("requestType", value)}
              />
              <FilterSelect
                label="Job status"
                value={filters.jobStatus}
                options={FILTERS.jobStatus}
                onChange={(value) => setFilter("jobStatus", value)}
              />
              <FilterSelect
                label="User role"
                value={filters.userRole}
                options={FILTERS.userRole}
                onChange={(value) => setFilter("userRole", value)}
              />
              <FilterSelect
                label="User status"
                value={filters.userStatus}
                options={FILTERS.userStatus}
                onChange={(value) => setFilter("userStatus", value)}
              />
              <FilterSelect
                label="Technician verification"
                value={filters.technicianVerificationStatus}
                options={FILTERS.technicianVerificationStatus}
                onChange={(value) =>
                  setFilter("technicianVerificationStatus", value)
                }
              />
              <FilterSelect
                label="Technician availability"
                value={filters.technicianAvailability}
                options={FILTERS.technicianAvailability}
                onChange={(value) => setFilter("technicianAvailability", value)}
              />
              <FilterSelect
                label="Payment status"
                value={filters.paymentStatus}
                options={FILTERS.paymentStatus}
                onChange={(value) => setFilter("paymentStatus", value)}
              />
              <FilterSelect
                label="Chat message type"
                value={filters.chatMessageType}
                options={FILTERS.chatMessageType}
                onChange={(value) => setFilter("chatMessageType", value)}
              />
            </div>
          </details>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <label className="inline-flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={compare}
                onChange={(event) => setCompare(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              Compare with the previous period
            </label>
            <span className="text-xs text-slate-500">
              Timezone: {TIMEZONE}
              {services.isError && " · Service category filter unavailable"}
            </span>
          </div>
        </CardBody>
      </Card>

      {!queryState.ready && (
        <p
          role="alert"
          className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
        >
          Enter a valid reporting year or a start date earlier than the
          exclusive end date.
        </p>
      )}

      <nav
        className="flex gap-2 overflow-x-auto rounded-xl border border-slate-200 bg-white p-2 shadow-sm"
        role="tablist"
        aria-label="Dashboard sections"
      >
        {SECTIONS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            id={`dashboard-tab-${id}`}
            type="button"
            role="tab"
            aria-selected={section === id}
            aria-controls={`dashboard-panel-${id}`}
            onClick={() => setSection(id)}
            className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
              section === id
                ? "bg-brand-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {label}
          </button>
        ))}
      </nav>

      {queryError && (
        <Card>
          <ErrorState
            title="Some dashboard data could not be loaded"
            message={queryError.error.message}
            onRetry={() => void queryError.refetch()}
          />
        </Card>
      )}

      <section
        id={`dashboard-panel-${section}`}
        role="tabpanel"
        aria-labelledby={`dashboard-tab-${section}`}
        className="space-y-6"
      >
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {SECTIONS.find((item) => item.id === section)?.label}
            </h2>
            {overview && (
              <p className="mt-1 text-xs text-slate-500">
                {new Date(overview.range.from).toLocaleDateString("en", {
                  timeZone: overview.range.timezone,
                  dateStyle: "medium",
                })}{" "}
                –{" "}
                {new Date(overview.range.to).toLocaleDateString("en", {
                  timeZone: overview.range.timezone,
                  dateStyle: "medium",
                })}{" "}
                · End date exclusive
              </p>
            )}
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
            <ChartNoAxesCombined className="h-3.5 w-3.5" />
            Auto-refreshes every minute
          </span>
        </div>

        <section
          aria-label={`${section} summary`}
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          {metricSets[section].map((metric) => (
            <StatCard
              key={metric.label}
              label={metric.label}
              value={metric.value}
              hint={metric.hint}
              icon={metric.icon}
              loading={analytics.overview.isPending}
              href={metric.href}
            />
          ))}
        </section>

        {section === "overview" && (
          <div className="grid gap-6 xl:grid-cols-2">
            <TrendChart
              title="Platform activity"
              description="Accounts and job activity over the selected period"
              series={filteredTrend([
                "users.new",
                "jobs.created",
                "jobs.completed",
              ])}
              interval={trends?.interval ?? "day"}
              loading={trendLoading}
            />
            <DonutChart
              title="Jobs by status"
              description="Distribution of job lifecycle states"
              rows={breakdownLoading ? [] : jobStatusRows}
              loading={breakdownLoading}
            />
            <BarChart
              title="Most requested services"
              description="Job demand by service category"
              rows={categoryJobRows}
              loading={breakdownLoading}
            />
            <DonutChart
              title="Technician verification"
              description="Current technician profiles by verification status"
              rows={(breakdowns?.technicians.verificationStatus ?? []).map(
                (row) => ({
                  label: displayEnum(
                    String(row.verificationStatus ?? "Unknown"),
                  ),
                  value: row.count,
                }),
              )}
              loading={breakdownLoading}
            />
          </div>
        )}

        {section === "jobs" && (
          <div className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-2">
              <TrendChart
                title="Job volume over time"
                description="Created and completed jobs per time bucket"
                series={filteredTrend(["jobs.created", "jobs.completed"])}
                interval={trends?.interval ?? "day"}
                loading={trendLoading}
              />
              <DonutChart
                title="Job status mix"
                description="Job counts broken down by lifecycle status"
                rows={breakdownLoading ? [] : jobStatusRows}
                loading={breakdownLoading}
              />
            </div>
            <div className="grid gap-6 xl:grid-cols-2">
              <BarChart
                title="Service demand"
                description="Most requested categories in the selected period"
                rows={categoryJobRows}
                loading={breakdownLoading}
              />
              <ParetoChart
                title="Service demand Pareto"
                description="Ranked job volume and cumulative share for the top service categories"
                rows={categoryJobRows}
                loading={breakdownLoading}
              />
              <DataTable
                title="Job status details"
                description="Status and request-type counts"
                headers={["Status", "Request type", "Jobs"]}
                rows={(overview?.jobs.createdByStatusAndRequestType ?? []).map(
                  (row) => [
                    row.status.replaceAll("_", " "),
                    row.requestType,
                    row.count,
                  ],
                )}
              />
            </div>
          </div>
        )}

        {section === "payments" && (
          <div className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-2">
              <TrendChart
                title="Booking value over time"
                description="Payment volume by time bucket (RWF)"
                series={filteredTrend(["payments.bookingAmount"])}
                interval={trends?.interval ?? "day"}
                loading={trendLoading}
                area
                valueFormatter={(value) =>
                  value >= 1000
                    ? `${(value / 1000).toFixed(0)}k`
                    : number(value)
                }
              />
              <DonutChart
                title="Payments by status"
                description="Booking payments grouped by current payment status"
                rows={breakdownLoading ? [] : paymentStatusRows}
                loading={breakdownLoading}
              />
            </div>
            <DataTable
              title="Payment status details"
              description="Payment counts and total booking amount by status"
              headers={["Status", "Request type", "Payments", "Amount"]}
              rows={(breakdowns?.payments ?? []).map((row) => [
                row.status.replaceAll("_", " "),
                row.requestType,
                row.count,
                money(row.amount),
              ])}
              emptyText="No payments were recorded in this period."
            />
          </div>
        )}

        {section === "quality" && (
          <div className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-2">
              <TrendChart
                title="Service and rating trends"
                description="Service catalog growth and submitted ratings"
                series={filteredTrend([
                  "catalog.servicesCreated",
                  "ratings.submitted",
                ])}
                interval={trends?.interval ?? "day"}
                loading={trendLoading}
              />
              <BarChart
                title="Rating criteria"
                description="Average customer score by rating item (1–5)"
                rows={ratingRows}
                loading={breakdownLoading}
              />
            </div>
            <div className="grid gap-6 xl:grid-cols-2">
              <DonutChart
                title="Technician verification"
                description="Current technician profiles by verification state"
                rows={(breakdowns?.technicians.verificationStatus ?? []).map(
                  (row) => ({
                    label: displayEnum(
                      String(row.verificationStatus ?? "Unknown"),
                    ),
                    value: row.count,
                  }),
                )}
                loading={breakdownLoading}
              />
              <DataTable
                title="Top technicians"
                description="Ranked by completed jobs and average rating"
                headers={["Rank", "Technician", "Completed jobs", "Rating"]}
                rows={topTechnicians.map((technician) => [
                  technician.rank,
                  technician.fullName,
                  technician.completedJobs,
                  technician.averageRating?.toFixed(2) ?? "—",
                ])}
                emptyText={
                  analytics.topTechnicians.isPending
                    ? "Loading technician rankings…"
                    : "No completed jobs in this period."
                }
              />
            </div>
            <DataTable
              title="Service catalog"
              description="New services by parent category"
              headers={["Category", "New services"]}
              rows={groupBy(
                breakdowns?.catalog.servicesByCategoryAndStatus ?? [],
                (row) => row.category.name ?? "Uncategorized",
              ).map((row) => [row.label, row.value])}
            />
          </div>
        )}

        {section === "operations" && (
          <div className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-2">
              <TrendChart
                title="Support activity"
                description="Chat messages and newly opened disputes"
                series={filteredTrend(["chat.messages", "disputes.opened"])}
                interval={trends?.interval ?? "day"}
                loading={trendLoading}
              />
              <DonutChart
                title="Cancellation requests"
                description="Requests grouped by review state"
                rows={groupBy(overview?.cancellationRequests ?? [], (row) =>
                  row.status.replaceAll("_", " "),
                )}
                loading={analytics.overview.isPending}
              />
            </div>
            <Card>
              <CardHeader
                title="Recent activity"
                description="Latest recorded admin and platform events"
                action={
                  <Link
                    href="/admin/records"
                    className="text-sm font-medium text-brand-600 hover:text-brand-700"
                  >
                    View records
                  </Link>
                }
              />
              <div className="divide-y divide-slate-100">
                {(analytics.activity.data?.data ?? []).length ? (
                  analytics.activity.data!.data.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-start gap-3 px-6 py-3"
                    >
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                        <Activity className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-800">
                          {event.action.replaceAll("_", " ")} ·{" "}
                          {event.entityType}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          {event.actor?.fullName ?? "System"} ·{" "}
                          {formatRelative(event.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="px-6 py-10 text-center text-sm text-slate-500">
                    {analytics.activity.isPending
                      ? "Loading recent activity…"
                      : "No activity in this period."}
                  </p>
                )}
              </div>
            </Card>
            <DataTable
              title="Operational activity"
              description="Broadcasts, notifications, and audit events for this period"
              headers={["Activity", "Count"]}
              rows={[
                ["Broadcasts sent", overview?.broadcasts.sent ?? 0],
                ["Notifications created", overview?.notificationsCreated ?? 0],
                ["Audit events", overview?.auditEvents ?? 0],
                ["Conversations", sumCounts(overview?.conversations ?? [])],
                [
                  "Technician documents",
                  sumCounts(overview?.technicianDocuments ?? []),
                ],
              ]}
            />
            <div className="grid gap-6 xl:grid-cols-2">
              <VerificationQueue />
              <AttentionQueue />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
