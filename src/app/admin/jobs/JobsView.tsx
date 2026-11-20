"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, CheckCircle2, ChevronRight, Clock, Plus, AlertCircle, XCircle, ShieldAlert } from "lucide-react";
import { JobFormDialog } from "@/components/jobs/JobFormDialog";
import { JobStatusBadge, UrgencyBadge } from "@/components/jobs/JobStatusBadge";
import {
  Button,
  Card,
  ChipGroup,
  EmptyState,
  ErrorState,
  PageHeader,
  Pagination,
  SearchInput,
  Select,
  Table,
  TableSkeleton,
  Td,
  Th,
  Tr,
} from "@/components/ui";
import { DEFAULT_PAGE_SIZE } from "@/config/pagination";
import { useJobs, useJobStats } from "@/hooks/useJobs";
import { useServices } from "@/hooks/useServices";
import { useDebouncedValue, useUrlFilters } from "@/hooks/useUrlFilters";
import { cn, formatRelative } from "@/lib/utils";
import {
  URGENCIES,
  type JobGroup,
  type Urgency,
} from "@/types/job";

const FILTER_KEYS = ["search", "group", "service", "urgency"] as const;

export function JobsView() {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const { data: services } = useServices();
  const { data: stats } = useJobStats();
  const { values, page, setParams } = useUrlFilters(FILTER_KEYS);
  const [search, setSearch] = useState(values.search ?? "");
  const debouncedSearch = useDebouncedValue(search);

  useEffect(() => {
    if (debouncedSearch !== (values.search ?? ""))
      setParams({ search: debouncedSearch });
  }, [debouncedSearch, values.search, setParams]);

  const group = values.group as JobGroup | undefined;
  const service = values.service;
  const urgency = values.urgency as Urgency | undefined;

  const { data, isLoading, isError, error, refetch, isFetching } = useJobs({
    search: values.search,
    group,
    service,
    urgency,
    page,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  const activePage = data?.page ?? page;
  const activePageSize = data?.pageSize ?? DEFAULT_PAGE_SIZE;

  const statsAny = stats as Record<string, number> | undefined;

  const totalCount = statsAny?.total ?? data?.total ?? 0;

  const matchingCount = statsAny?.matching ?? statsAny?.pending ?? statsAny?.open ??
    data?.items?.filter(j => ['matching', 'pending', 'open', 'assigned'].includes(j.status?.toLowerCase()) || !j.technician).length ?? 0;

  const inProgressCount = statsAny?.in_progress ?? statsAny?.inProgress ??
    data?.items?.filter(j => ['in_progress', 'ongoing'].includes(j.status?.toLowerCase())).length ?? 0;

  const completedCount = statsAny?.completed ??
    data?.items?.filter(j => j.status?.toLowerCase() === 'completed').length ?? 0;

  const cancelledCount = statsAny?.cancelled ?? statsAny?.failed ??
    data?.items?.filter(j => ['cancelled', 'failed'].includes(j.status?.toLowerCase())).length ?? 0;

  const disputedCount = statsAny?.disputed ??
    data?.items?.filter(j => j.status?.toLowerCase() === 'disputed').length ?? 0;

  const summaryCards = [
    { key: undefined, label: "All", count: totalCount, icon: Briefcase, color: "text-slate-900", bg: "bg-slate-50" },
    { key: "matching", label: "Matching", count: matchingCount, icon: Clock, color: "text-amber-500", bg: "bg-amber-50" },
    { key: "in_progress", label: "In progress", count: inProgressCount, icon: AlertCircle, color: "text-blue-600", bg: "bg-blue-50" },
    { key: "completed", label: "Completed", count: completedCount, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
    { key: "cancelled", label: "Cancelled", count: cancelledCount, icon: XCircle, color: "text-rose-600", bg: "bg-rose-50" },
    { key: "disputed", label: "Disputed", count: disputedCount, icon: ShieldAlert, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  const hasFilters = Boolean(values.search || group || service || urgency);

  return (
    <>
      <PageHeader
        title="Jobs"
        description="Oversee every job from request to rating."
        actions={
          <Button onClick={() => setFormOpen(true)} className="bg-orange-500 hover:bg-orange-600 text-white font-medium">
            <Plus className="h-4 w-4" aria-hidden /> New job
          </Button>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {summaryCards.map((card) => {
          const isActive = group === card.key || (card.key === undefined && !group);
          const Icon = card.icon;

          return (
            <Card
              key={card.label}
              onClick={() => setParams({ group: card.key })}
              className={cn(
                "p-4 flex flex-col justify-between border rounded-2xl shadow-sm cursor-pointer transition-all",
                isActive
                  ? "border-amber-400 bg-amber-50/30 ring-2 ring-amber-400/20"
                  : "border-slate-200/80 bg-white hover:border-slate-300"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  {card.label}
                </span>
                <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center", card.bg, card.color)}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <p className={cn("text-2xl font-bold", card.color)}>
                {card.count}
              </p>
            </Card>
          );
        })}
      </div>

      <div className="mb-4 space-y-3">
        <div className="flex flex-col gap-3 md:flex-row">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by reference, problem, customer or technician"
            className="md:flex-1"
          />
          <Select
            value={service ?? ""}
            onChange={(e) =>
              setParams({ service: e.target.value || undefined })
            }
            aria-label="Filter by service"
            className="md:w-56"
          >
            <option value="">All services</option>
            {(services ?? []).map(({ name: c }) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>
        <ChipGroup
          label="Urgency"
          options={URGENCIES}
          value={urgency}
          onChange={(v) => setParams({ urgency: v })}
        />
      </div>

      <Card
        className={cn(
          "overflow-hidden",
          isFetching && !isLoading && "opacity-70 transition-opacity",
        )}
      >
        {isError ? (
          <ErrorState message={error.message} onRetry={() => refetch()} />
        ) : !isLoading && data?.items.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No jobs found"
            description={
              hasFilters
                ? "Try a different search or clear the filters."
                : "No jobs have been requested yet."
            }
          />
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th className="w-12">#</Th>
                  <Th>Job</Th>
                  <Th>Service</Th>
                  <Th>Customer</Th>
                  <Th>Technician</Th>
                  <Th>Status</Th>
                  <Th>Urgency</Th>
                  <Th>Requested</Th>
                </tr>
              </thead>
              <tbody>
                {isLoading || !data ? (
                  <TableSkeleton columns={8} />
                ) : (
                  data.items.map((job, index) => {
                    const rowNumber = (activePage - 1) * activePageSize + index + 1;

                    return (
                      <Tr
                        key={job.id}
                        onClick={() => router.push(`/admin/jobs/${job.id}`)}
                        label={`Open job ${job.reference}`}
                      >
                        <Td className="whitespace-nowrap text-xs font-medium text-slate-400">
                          {rowNumber}
                        </Td>
                        <Td>
                          <p className="max-w-[24rem] truncate font-medium text-slate-900">
                            {job.problem || job.service}
                          </p>
                          <p className="text-xs text-slate-500 flex items-center gap-2">
                            <span className="font-semibold text-slate-700">{job.reference}</span>
                            <span>·</span>
                            <span>{job.customer.name}</span>
                          </p>
                        </Td>
                        <Td className="whitespace-nowrap text-slate-600">
                          {job.service}
                        </Td>
                        <Td className="whitespace-nowrap text-slate-600">
                          {job.customer.name}
                        </Td>
                        <Td className="whitespace-nowrap">
                          {job.technician ? (
                            <span className="text-slate-600">
                              {job.technician.name}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                              Not assigned
                            </span>
                          )}
                        </Td>
                        <Td>
                          <JobStatusBadge status={job.status} />
                        </Td>
                        <Td>
                          <UrgencyBadge urgency={job.urgency} />
                        </Td>
                        <Td className="whitespace-nowrap text-slate-600">
                          <span className="inline-flex items-center gap-2">
                            {formatRelative(job.createdAt)}
                            <ChevronRight
                              className="h-4 w-4 text-slate-400"
                              aria-hidden
                            />
                          </span>
                        </Td>
                      </Tr>
                    );
                  })
                )}
              </tbody>
            </Table>
            {data && (
              <Pagination
                page={data.page}
                pageSize={data.pageSize}
                total={data.total}
                onPageChange={(p) => setParams({ page: p })}
              />
            )}
          </>
        )}
      </Card>

      <JobFormDialog open={formOpen} onClose={() => setFormOpen(false)} />
    </>
  );
}