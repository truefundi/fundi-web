'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardBody, CardHeader, ErrorState } from '@/components/ui';
import { dashboardKeys } from '@/hooks/useDashboard';
import { customersApi, techniciansApi } from '@/lib/api';
import type { Account } from '@/types/customer';
import type { PaginatedResponse } from '@/types/api';

const MONTH_COUNT = 6;
const PAGE_SIZE = 100;
const CHART = { left: 52, right: 744, top: 20, bottom: 220 };

type MonthPoint = {
  key: string;
  label: string;
  title: string;
  customers: number;
  technicians: number;
};

async function fetchRecentSignupDates<T extends Account>(
  loadPage: (page: number) => Promise<PaginatedResponse<T>>,
  startDate: Date,
): Promise<string[]> {
  const signupDates: string[] = [];
  let page = 1;

  while (true) {
    const result = await loadPage(page);
    if (result.items.length === 0) break;

    let reachedStartDate = false;
    for (const account of result.items) {
      const createdAt = Date.parse(account.createdAt);
      if (!Number.isFinite(createdAt)) continue;
      if (createdAt < startDate.getTime()) {
        reachedStartDate = true;
        break;
      }
      signupDates.push(account.createdAt);
    }

    if (reachedStartDate || result.items.length < result.pageSize || page * result.pageSize >= result.total) break;
    page += 1;
  }

  return signupDates;
}

function getMonthlySignups(): Promise<MonthPoint[]> {
  const now = new Date();
  const startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - MONTH_COUNT + 1, 1));
  const months = Array.from({ length: MONTH_COUNT }, (_, index) => {
    const date = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth() + index, 1));
    return {
      key: `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`,
      label: new Intl.DateTimeFormat('en', { month: 'short', timeZone: 'UTC' }).format(date),
      title: new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date),
      customers: 0,
      technicians: 0,
    };
  });
  const monthByKey = new Map(months.map((month) => [month.key, month]));

  return Promise.all([
    fetchRecentSignupDates(
      (page) => customersApi.list({ page, pageSize: PAGE_SIZE, sort: 'newest' }),
      startDate,
    ),
    fetchRecentSignupDates(
      (page) => techniciansApi.list({ page, pageSize: PAGE_SIZE, sort: 'newest' }),
      startDate,
    ),
  ]).then(([customerDates, technicianDates]) => {
    for (const createdAt of customerDates) {
      const date = new Date(createdAt);
      const month = monthByKey.get(
        `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`,
      );
      if (month) month.customers += 1;
    }
    for (const createdAt of technicianDates) {
      const date = new Date(createdAt);
      const month = monthByKey.get(
        `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`,
      );
      if (month) month.technicians += 1;
    }
    return months;
  });
}

function getPoints(values: number[], maxValue: number) {
  const width = CHART.right - CHART.left;
  const height = CHART.bottom - CHART.top;
  return values.map((value, index) => ({
    x: CHART.left + (width * index) / (values.length - 1),
    y: CHART.bottom - (height * value) / maxValue,
    value,
  }));
}

function getCurvePath(points: ReturnType<typeof getPoints>) {
  if (points.length === 0) return '';

  return points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;

    const previous = points[index - 1];
    const beforePrevious = points[index - 2] ?? previous;
    const next = points[index + 1] ?? point;
    const firstControlX = previous.x + (point.x - beforePrevious.x) / 6;
    const firstControlY = previous.y + (point.y - beforePrevious.y) / 6;
    const secondControlX = point.x - (next.x - previous.x) / 6;
    const secondControlY = point.y - (next.y - previous.y) / 6;

    return `${path} C ${firstControlX} ${firstControlY}, ${secondControlX} ${secondControlY}, ${point.x} ${point.y}`;
  }, '');
}

export function PeopleGrowthChart() {
  const [activeMonthIndex, setActiveMonthIndex] = useState<number | null>(null);
  const [visibleSeries, setVisibleSeries] = useState({ customers: true, technicians: true });
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: dashboardKeys.peopleGrowth,
    queryFn: getMonthlySignups,
    refetchInterval: 60_000,
  });
  const chartData = data ?? [];
  const maxCount = Math.max(...chartData.flatMap((month) => [month.customers, month.technicians]), 1);
  const tickSize = Math.max(1, Math.ceil(maxCount / 4));
  const scaleMax = tickSize * 4;
  const series = [
    {
      name: 'Customers',
      color: '#f97316',
      points: getPoints(chartData.map((month) => month.customers), scaleMax),
      key: 'customers' as const,
      visible: visibleSeries.customers,
    },
    {
      name: 'Technicians',
      color: '#0284c7',
      points: getPoints(chartData.map((month) => month.technicians), scaleMax),
      key: 'technicians' as const,
      visible: visibleSeries.technicians,
    },
  ];
  const activeMonth = activeMonthIndex === null ? undefined : chartData[activeMonthIndex];
  const activeX =
    activeMonthIndex === null ? CHART.left : CHART.left + ((CHART.right - CHART.left) * activeMonthIndex) / (chartData.length - 1);
  const tooltipX = Math.max(CHART.left, Math.min(activeX - 70, CHART.right - 140));

  return (
    <Card className="mt-6">
      <CardHeader title="Customer & technician growth" description="New account registrations per month · last 6 months" />
      {isError ? (
        <ErrorState
          title="Could not load registration trends"
          message={error.message}
          onRetry={() => refetch()}
        />
      ) : isPending || !data ? (
        <CardBody>
          <div className="h-[280px] animate-pulse rounded-lg bg-slate-100" aria-label="Loading registration trends" />
        </CardBody>
      ) : (
        <CardBody>
          <div className="mb-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <button
              type="button"
              aria-pressed={visibleSeries.customers}
              onClick={() => setVisibleSeries((current) => ({ ...current, customers: !current.customers }))}
              className={`inline-flex items-center gap-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${visibleSeries.customers ? 'text-slate-600' : 'text-slate-400 line-through'}`}
            >
              <span className={`h-2.5 w-2.5 rounded-full ${visibleSeries.customers ? 'bg-brand-500' : 'bg-slate-300'}`} aria-hidden />
              Customers
            </button>
            <button
              type="button"
              aria-pressed={visibleSeries.technicians}
              onClick={() => setVisibleSeries((current) => ({ ...current, technicians: !current.technicians }))}
              className={`inline-flex items-center gap-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${visibleSeries.technicians ? 'text-slate-600' : 'text-slate-400 line-through'}`}
            >
              <span className={`h-2.5 w-2.5 rounded-full ${visibleSeries.technicians ? 'bg-sky-600' : 'bg-slate-300'}`} aria-hidden />
              Technicians
            </button>
          </div>
          <div className="w-full">
            <svg
              viewBox="0 0 760 270"
              className="h-auto w-full"
              role="group"
              aria-label="Interactive monthly customer and technician registration chart"
              onMouseLeave={() => setActiveMonthIndex(null)}
            >
              <title>New customer and technician registrations by month</title>
              {Array.from({ length: 5 }, (_, index) => {
                const tick = tickSize * (4 - index);
                const y = CHART.top + ((CHART.bottom - CHART.top) * index) / 4;
                return (
                  <g key={tick}>
                    <line x1={CHART.left} x2={CHART.right} y1={y} y2={y} stroke="#e2e8f0" strokeDasharray="4 4" />
                    <text x={CHART.left - 12} y={y + 4} textAnchor="end" className="fill-slate-500 text-[11px]">
                      {tick}
                    </text>
                  </g>
                );
              })}
              <line x1={CHART.left} x2={CHART.right} y1={CHART.bottom} y2={CHART.bottom} stroke="#cbd5e1" />
              {chartData.map((month, index) => {
                const x = CHART.left + ((CHART.right - CHART.left) * index) / (chartData.length - 1);
                return (
                  <text
                    key={month.key}
                    x={x}
                    y={CHART.bottom + 27}
                    textAnchor="middle"
                    className="fill-slate-500 text-[11px]"
                  >
                    {month.label}
                  </text>
                );
              })}
              {activeMonth && (
                <line
                  x1={activeX}
                  x2={activeX}
                  y1={CHART.top}
                  y2={CHART.bottom}
                  stroke="#94a3b8"
                  strokeDasharray="4 4"
                  pointerEvents="none"
                />
              )}
              {series.filter(({ visible }) => visible).map(({ name, color, points, key }) => (
                <g key={name}>
                  <path
                    d={getCurvePath(points)}
                    fill="none"
                    stroke={color}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {points.map(({ x, y, value }, index) => (
                    <circle
                      key={chartData[index].key}
                      cx={x}
                      cy={y}
                      r={activeMonthIndex === index ? 6 : 4}
                      fill={color}
                      stroke="white"
                      strokeWidth="2"
                      className="cursor-pointer focus-visible:stroke-slate-900 focus-visible:stroke-[3]"
                      role="button"
                      tabIndex={0}
                      aria-label={`${chartData[index].title}: ${value} ${name.toLowerCase()}`}
                      onMouseEnter={() => setActiveMonthIndex(index)}
                      onFocus={() => setActiveMonthIndex(index)}
                      onBlur={() => setActiveMonthIndex(null)}
                      onClick={() => setActiveMonthIndex(index)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setActiveMonthIndex(index);
                        }
                      }}
                    >
                      <title>{`${chartData[index].title}: ${value} ${name.toLowerCase()}`}</title>
                    </circle>
                  ))}
                  <desc>{`${name}: ${chartData.map((month) => month[key]).join(', ')}`}</desc>
                </g>
              ))}
              {activeMonth && (
                <g pointerEvents="none">
                  <rect x={tooltipX} y={CHART.top + 6} width="140" height="58" rx="8" fill="#0f172a" opacity="0.95" />
                  <text x={tooltipX + 10} y={CHART.top + 22} fill="white" className="text-[10px] font-semibold">
                    {activeMonth.title}
                  </text>
                  {series.filter(({ visible }) => visible).map(({ name, color, key }, index) => (
                    <text
                      key={name}
                      x={tooltipX + 10}
                      y={CHART.top + 40 + index * 15}
                      fill={color}
                      className="text-[10px]"
                    >
                      {`${name}: ${activeMonth[key]}`}
                    </text>
                  ))}
                </g>
              )}
            </svg>
          </div>
          <p className="sr-only" aria-live="polite">
            {activeMonth
              ? `${activeMonth.label}: ${visibleSeries.customers ? `${activeMonth.customers} customers` : ''}${visibleSeries.customers && visibleSeries.technicians ? ', ' : ''}${visibleSeries.technicians ? `${activeMonth.technicians} technicians` : ''}`
              : ''}
          </p>
        </CardBody>
      )}
    </Card>
  );
}
