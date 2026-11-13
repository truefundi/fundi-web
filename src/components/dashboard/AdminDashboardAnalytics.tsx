"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BadgeCheck,
  Banknote,
  BarChart3,
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
} from "lucide-react";
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

const TIMEZONE = "Africa/Kigali";
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

const SELECT_CLASS =
  "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100";
const SERIES_COLORS = ["#f97316", "#0284c7", "#16a34a", "#9333ea"];

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

function number(value: number) {
  return new Intl.NumberFormat("en-RW", { maximumFractionDigits: 0 }).format(
    value,
  );
}

function money(value: number) {
  return `RWF ${number(value)}`;
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

function SelectFilter({
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

function TrendChart({
  title,
  description,
  series,
  interval,
  area = false,
  loading = false,
  valueFormatter = number,
}: {
  title: string;
  description: string;
  series: DashboardTrendSeries[];
  interval: string;
  area?: boolean;
  loading?: boolean;
  valueFormatter?: (value: number) => string;
}) {
  const buckets = [
    ...new Set(
      series.flatMap((item) => item.data.map((point) => point.bucket)),
    ),
  ].sort();
  if (loading || !buckets.length) {
    return (
      <Card>
        <CardHeader title={title} description={description} />
        <CardBody>
          {loading ? (
            <div
              className="h-64 animate-pulse rounded-lg bg-slate-100"
              aria-label="Loading chart"
            />
          ) : (
            <p className="py-12 text-center text-sm text-slate-500">
              No data in this period.
            </p>
          )}
        </CardBody>
      </Card>
    );
  }

  const values = series.flatMap((item) =>
    item.data.map((point) => point.value ?? 0),
  );
  const max = Math.max(1, ...values);
  const left = 58;
  const right = 760;
  const top = 18;
  const bottom = 205;
  const x = (index: number) =>
    left +
    (buckets.length === 1
      ? (right - left) / 2
      : (index * (right - left)) / (buckets.length - 1));
  const y = (value: number) => bottom - (value / max) * (bottom - top);
  const label = (bucket: string) =>
    interval === "hour" ? bucket.slice(11, 16) : bucket.slice(5, 10);

  return (
    <Card>
      <CardHeader title={title} description={description} />
      <CardBody>
        <div className="mb-3 flex flex-wrap gap-x-5 gap-y-2">
          {series.map((item, index) => (
            <span
              key={`${item.domain}.${item.metric}`}
              className="inline-flex items-center gap-2 text-xs text-slate-600"
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{
                  backgroundColor: SERIES_COLORS[index % SERIES_COLORS.length],
                }}
              />
              {metricLabel(item)}
            </span>
          ))}
        </div>
        <div className="overflow-x-auto">
          <svg
            className="h-64 min-w-[560px] w-full"
            viewBox="0 0 800 250"
            role="img"
            aria-label={`${title} chart`}
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
              const fill = `${left},${bottom} ${line} ${right},${bottom}`;
              const color = SERIES_COLORS[seriesIndex % SERIES_COLORS.length];
              return (
                <g key={`${item.domain}.${item.metric}`}>
                  {area && series.length === 1 && (
                    <polygon points={fill} fill={color} opacity="0.12" />
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
                      r="3"
                      fill="white"
                      stroke={color}
                      strokeWidth="2"
                    >
                      <title>{`${label(buckets[index])}: ${valueFormatter(pointsByBucket.get(buckets[index]) ?? 0)}`}</title>
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
                {label(bucket)}
              </text>
            ))}
          </svg>
        </div>
      </CardBody>
    </Card>
  );
}

function metricLabel(series: DashboardTrendSeries) {
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

function BreakdownBars({
  title,
  description,
  rows,
  valueFormatter = number,
}: {
  title: string;
  description: string;
  rows: Array<{ label: string; value: number; href?: string }>;
  valueFormatter?: (value: number) => string;
}) {
  const max = Math.max(1, ...rows.map((row) => row.value));
  return (
    <Card>
      <CardHeader title={title} description={description} />
      <CardBody>
        {rows.length ? (
          <ul className="space-y-4">
            {rows.map((row) => (
              <li key={row.label}>
                <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                  {row.href ? (
                    <Link
                      href={row.href}
                      className="truncate font-medium text-slate-700 hover:text-brand-600"
                    >
                      {row.label}
                    </Link>
                  ) : (
                    <span className="truncate font-medium text-slate-700">
                      {row.label}
                    </span>
                  )}
                  <span className="shrink-0 font-semibold text-slate-900">
                    {valueFormatter(row.value)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-brand-500"
                    style={{
                      width: `${Math.max(3, (row.value / max) * 100)}%`,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-8 text-center text-sm text-slate-500">
            No data in this period.
          </p>
        )}
      </CardBody>
    </Card>
  );
}

function groupBy<T extends { count: number }>(
  rows: T[],
  getKey: (row: T) => string,
) {
  const values = new Map<string, number>();
  for (const row of rows)
    values.set(getKey(row), (values.get(getKey(row)) ?? 0) + row.count);
  return [...values].map(([label, value]) => ({ label, value }));
}

const CHART_COLORS = [
  "#f97316",
  "#0284c7",
  "#16a34a",
  "#9333ea",
  "#e11d48",
  "#0891b2",
];

function StatusDonut({
  title,
  description,
  rows,
}: {
  title: string;
  description: string;
  rows: Array<{ label: string; value: number }>;
}) {
  const visibleRows = rows.filter((row) => row.value > 0);
  const total = visibleRows.reduce((sum, row) => sum + row.value, 0);
  let accumulated = 0;
  const gradient = total
    ? visibleRows
        .map((row, index) => {
          const start = (accumulated / total) * 100;
          accumulated += row.value;
          const end = (accumulated / total) * 100;
          return `${CHART_COLORS[index % CHART_COLORS.length]} ${start}% ${end}%`;
        })
        .join(", ")
    : "#e2e8f0 0% 100%";

  return (
    <Card>
      <CardHeader title={title} description={description} />
      <CardBody>
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          <div
            className="relative h-40 w-40 shrink-0 rounded-full"
            style={{ background: `conic-gradient(${gradient})` }}
            role="img"
            aria-label={`${title}: ${visibleRows.map((row) => `${row.label} ${row.value}`).join(", ") || "no data"}`}
          >
            <div className="absolute inset-5 flex flex-col items-center justify-center rounded-full bg-white">
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
                  className="flex items-center justify-between gap-3 text-sm"
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
                      {total ? `${Math.round((row.value / total) * 100)}%` : ""}
                    </span>
                  </span>
                </li>
              ))
            ) : (
              <li className="py-8 text-center text-sm text-slate-500">
                No data in this period.
              </li>
            )}
          </ul>
        </div>
      </CardBody>
    </Card>
  );
}

function VerticalBarChart({
  title,
  description,
  rows,
}: {
  title: string;
  description: string;
  rows: Array<{ label: string; value: number }>;
}) {
  const chartRows = rows.slice(0, 7);
  const max = Math.max(1, ...chartRows.map((row) => row.value));
  const left = 38;
  const right = 740;
  const top = 24;
  const bottom = 205;
  const slot = chartRows.length ? (right - left) / chartRows.length : right - left;
  const barWidth = Math.min(42, slot * 0.56);

  return (
    <Card>
      <CardHeader title={title} description={description} />
      <CardBody>
        {chartRows.length ? (
          <div className="overflow-x-auto">
            <svg
              className="h-64 min-w-[560px] w-full"
              viewBox="0 0 780 250"
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
                      rx="6"
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                      opacity="0.88"
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
                      {label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        ) : (
          <p className="py-12 text-center text-sm text-slate-500">
            No data in this period.
          </p>
        )}
      </CardBody>
    </Card>
  );
}

type DashboardSection =
  | "overview"
  | "jobs"
  | "payments"
  | "quality"
  | "operations";

export function AdminDashboardAnalytics() {
  const today = new Date();
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
  const analytics = useDashboardAnalytics(query, queryState.ready);
  const activityConnected = useDashboardActivityStream(query);
  const services = useServices();
  const overview = analytics.overview.data;
  const breakdowns = analytics.breakdowns.data;
  const trends = analytics.trends.data;
  const topTechnicians = analytics.topTechnicians.data?.data ?? [];
  const setFilter = (key: keyof typeof filters, value: string) =>
    setFilters((current) => ({ ...current, [key]: value }));

  const metricCards = [
    {
      label: "New accounts",
      value: overview?.users.newAccounts,
      icon: Users,
      hint: compareHint(overview, "newAccounts"),
    },
    {
      label: "New technicians",
      value: overview?.technicians.newProfiles,
      icon: Wrench,
      hint: "Profiles added in period",
    },
    {
      label: "Jobs created",
      value: overview?.jobs.created,
      icon: BriefcaseBusiness,
      hint: compareHint(overview, "jobsCreated"),
    },
    {
      label: "Jobs completed",
      value: overview?.jobs.completedInPeriod,
      icon: BadgeCheck,
      hint: compareHint(overview, "jobsCompleted"),
    },
    {
      label: "Booking amount",
      value: overview ? money(overview.payments.bookingAmount) : undefined,
      icon: Banknote,
      hint: compareHint(overview, "bookingAmount"),
    },
    {
      label: "Payments",
      value: overview?.payments.count,
      icon: ClipboardList,
      hint: "Payments in selected period",
    },
    {
      label: "Open disputes",
      value: overview?.disputes.currentlyUnresolved,
      icon: ShieldAlert,
      hint: `${number(overview?.disputes.opened ?? 0)} opened in period`,
    },
    {
      label: "Average rating",
      value: overview?.ratings.averageScore ?? "—",
      icon: Star,
      hint: `${number(overview?.ratings.count ?? 0)} ratings submitted`,
    },
    {
      label: "Chat messages",
      value: overview?.chat.messages,
      icon: MessageSquareText,
      hint: "Messages created in period",
    },
    {
      label: "Active categories",
      value: overview
        ? sumCounts(overview.catalog.currentCategories, true)
        : undefined,
      icon: PackageOpen,
      hint: `${number(sumCounts(overview?.catalog.newCategories ?? []))} added in period`,
    },
    {
      label: "Active services",
      value: overview
        ? sumCounts(overview.catalog.currentServices, true)
        : undefined,
      icon: Wrench,
      hint: `${number(sumCounts(overview?.catalog.newServices ?? []))} added in period`,
    },
    {
      label: "Job offers",
      value: overview ? sumCounts(overview.jobOffers) : undefined,
      icon: Activity,
      hint: "Offers sent in period",
    },
    {
      label: "Conversations",
      value: overview ? sumCounts(overview.conversations) : undefined,
      icon: MessageSquareText,
      hint: "Negotiations started in period",
    },
    {
      label: "Technician documents",
      value: overview ? sumCounts(overview.technicianDocuments) : undefined,
      icon: ClipboardList,
      hint: "Documents submitted in period",
    },
    {
      label: "Cancellation requests",
      value: overview ? sumCounts(overview.cancellationRequests) : undefined,
      icon: ShieldAlert,
      hint: "Requests submitted in period",
    },
    {
      label: "Broadcasts sent",
      value: overview?.broadcasts.sent,
      icon: MessageSquareText,
      hint: `${number(overview?.broadcasts.recipients ?? 0)} recipients`,
    },
    {
      label: "Notifications",
      value: overview?.notificationsCreated,
      icon: Activity,
      hint: "Created in period",
    },
    {
      label: "Ad click-through",
      value:
        overview?.advertisements.clickThroughRate === null ||
        overview?.advertisements.clickThroughRate === undefined
          ? "—"
          : `${overview.advertisements.clickThroughRate}%`,
      icon: ChartNoAxesCombined,
      hint: `${number(overview?.advertisements.lifetimeImpressions ?? 0)} lifetime impressions`,
    },
    {
      label: "Audit events",
      value: overview?.auditEvents,
      icon: ClipboardList,
      hint: "Recorded in period",
    },
  ];

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
      href: `/admin/categories?serviceCategoryId=${row.serviceCategory!.id}`,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
  const categoryServiceRows = groupBy(
    breakdowns?.catalog.servicesByCategoryAndStatus ?? [],
    (row) => row.category.name ?? "Uncategorized",
  )
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
  const ratingRows = (breakdowns?.ratingsByItem ?? [])
    .map((row) => ({ label: row.item, value: row.averageScore ?? 0 }))
    .sort((a, b) => b.value - a.value);

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
    analytics.topTechnicians,
    analytics.activity,
  ].find((result) => result.isError);

  return (
    <div className="space-y-6">
      <Card>
        <CardBody>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SelectFilter
              label="Request type"
              value={filters.requestType}
              options={FILTERS.requestType}
              onChange={(value) => setFilter("requestType", value)}
            />
            <SelectFilter
              label="Job status"
              value={filters.jobStatus}
              options={FILTERS.jobStatus}
              onChange={(value) => setFilter("jobStatus", value)}
            />
            <SelectFilter
              label="User role"
              value={filters.userRole}
              options={FILTERS.userRole}
              onChange={(value) => setFilter("userRole", value)}
            />
            <SelectFilter
              label="User status"
              value={filters.userStatus}
              options={FILTERS.userStatus}
              onChange={(value) => setFilter("userStatus", value)}
            />
            <SelectFilter
              label="Technician verification"
              value={filters.technicianVerificationStatus}
              options={FILTERS.technicianVerificationStatus}
              onChange={(value) =>
                setFilter("technicianVerificationStatus", value)
              }
            />
            <SelectFilter
              label="Technician availability"
              value={filters.technicianAvailability}
              options={FILTERS.technicianAvailability}
              onChange={(value) => setFilter("technicianAvailability", value)}
            />
            <SelectFilter
              label="Payment status"
              value={filters.paymentStatus}
              options={FILTERS.paymentStatus}
              onChange={(value) => setFilter("paymentStatus", value)}
            />
            <SelectFilter
              label="Chat message type"
              value={filters.chatMessageType}
              options={FILTERS.chatMessageType}
              onChange={(value) => setFilter("chatMessageType", value)}
            />
          </div>
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
            <div className="flex items-center gap-3 text-xs text-slate-500">
              {services.isError && (
                <span>Service category filter unavailable.</span>
              )}
              <span>Timezone: {TIMEZONE}</span>
              {overview && (
                <span>Updated {formatRelative(overview.generatedAt)}</span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <span
                  className={`h-2 w-2 rounded-full ${activityConnected ? "bg-emerald-500" : "bg-slate-300"}`}
                />
                {activityConnected ? "Live activity" : "Activity polling"}
              </span>
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
        </CardBody>
      </Card>

      {queryError && (
        <Card>
          <ErrorState
            title="Some dashboard data could not be loaded"
            message={queryError.error.message}
            onRetry={() => void queryError.refetch()}
          />
        </Card>
      )}
      {!queryState.ready && (
        <p
          role="alert"
          className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
        >
          Enter a valid reporting year or a start date earlier than the
          exclusive end date.
        </p>
      )}

      <section
        aria-label="Dashboard summary metrics"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {metricCards.map((metric) => (
          <StatCard
            key={metric.label}
            label={metric.label}
            value={metric.value ?? "—"}
            hint={metric.hint}
            icon={metric.icon}
            loading={analytics.overview.isPending}
          />
        ))}
      </section>

      {overview && (
        <p className="-mt-3 text-xs text-slate-500">
          {new Date(overview.range.from).toLocaleString("en", {
            timeZone: overview.range.timezone,
          })}{" "}
          –{" "}
          {new Date(overview.range.to).toLocaleString("en", {
            timeZone: overview.range.timezone,
          })}{" "}
          ({overview.range.timezone}, end exclusive)
        </p>
      )}

      <section aria-label="Trends" className="grid gap-6 xl:grid-cols-2">
        <TrendChart
          title="People and job activity"
          description="New accounts and job creation/completion over time"
          series={(trends?.series ?? []).filter((item) =>
            ["users.new", "jobs.created", "jobs.completed"].includes(
              `${item.domain}.${item.metric}`,
            ),
          )}
          interval={trends?.interval ?? "day"}
          loading={analytics.trends.isPending}
        />
        <TrendChart
          title="Booking value"
          description="Total payment amount by time bucket (RWF)"
          series={(trends?.series ?? []).filter((item) =>
            ["payments.bookingAmount"].includes(
              `${item.domain}.${item.metric}`,
            ),
          )}
          interval={trends?.interval ?? "day"}
          area
          loading={analytics.trends.isPending}
          valueFormatter={(value) =>
            value >= 1000 ? `${(value / 1000).toFixed(0)}k` : number(value)
          }
        />
        <TrendChart
          title="Catalog growth"
          description="New service categories and services over time"
          series={(trends?.series ?? []).filter((item) =>
            ["catalog.categoriesCreated", "catalog.servicesCreated"].includes(
              `${item.domain}.${item.metric}`,
            ),
          )}
          interval={trends?.interval ?? "day"}
          loading={analytics.trends.isPending}
        />
      </section>

      {breakdowns && (
        <section
          aria-label="Dashboard breakdowns"
          className="grid gap-6 xl:grid-cols-2"
        >
          <BreakdownBars
            title="Jobs by status"
            description="Job volume by lifecycle state in the selected period"
            rows={jobStatusRows.map((row) => ({ ...row, href: "/admin/jobs" }))}
          />
          <BreakdownBars
            title="Payments by status"
            description="Payment counts grouped by current payment status"
            rows={paymentStatusRows}
          />
          <BreakdownBars
            title="Most requested services"
            description="Jobs grouped by service category"
            rows={categoryJobRows}
          />
          <BreakdownBars
            title="Services by catalog category"
            description="New services in the selected period, grouped by parent category"
            rows={categoryServiceRows}
          />
          <BreakdownBars
            title="Rating criteria"
            description="Average score for each rating item (1–5)"
            rows={ratingRows.map((row) => ({
              ...row,
              value: row.value,
            }))}
            valueFormatter={(value) => value.toFixed(2)}
          />
          <BreakdownBars
            title="Technician verification"
            description="Current technician profiles grouped by verification state"
            rows={(breakdowns.technicians.verificationStatus ?? []).map(
              (row) => ({
                label: String(row.verificationStatus ?? "Unknown"),
                value: row.count,
                href: "/admin/technicians",
              }),
            )}
          />
        </section>
      )}

      <section
        aria-label="Technicians and recent activity"
        className="grid gap-6 xl:grid-cols-2"
      >
        <Card>
          <CardHeader
            title="Top technicians"
            description="Ranked by completed jobs, then average rating"
            action={
              <Link
                href="/admin/technicians"
                className="text-sm font-medium text-brand-600 hover:text-brand-700"
              >
                View all
              </Link>
            }
          />
          <div className="divide-y divide-slate-100">
            {topTechnicians.length ? (
              topTechnicians.map((technician) => (
                <Link
                  key={technician.technicianId}
                  href={`/admin/technicians/${technician.technicianId}`}
                  className="flex items-center gap-3 px-6 py-3 hover:bg-slate-50"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700">
                    {technician.rank}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">
                    {technician.fullName}
                  </span>
                  <span className="text-right text-xs text-slate-500">
                    {number(technician.completedJobs)} jobs ·{" "}
                    {technician.averageRating?.toFixed(2) ?? "—"} ★
                  </span>
                </Link>
              ))
            ) : (
              <p className="px-6 py-10 text-center text-sm text-slate-500">
                {analytics.topTechnicians.isPending
                  ? "Loading technician rankings…"
                  : "No completed jobs in this period."}
              </p>
            )}
          </div>
        </Card>

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
                    <ChartNoAxesCombined className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {event.action.replaceAll("_", " ")} · {event.entityType}
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
      </section>
    </div>
  );
}
