"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, CheckCircle2, ChevronRight, Plus, ShieldAlert } from "lucide-react";
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
  StatCard,
  Table,
  TableSkeleton,
  Td,
  Th,
  Tr,
} from "@/components/ui";
import { DEFAULT_PAGE_SIZE } from "@/config/pagination";
import { useJobStats, useJobs, usePrefetchJob } from "@/hooks/useJobs";
import { useServices } from "@/hooks/useServices";
import { useDebouncedSearch, useUrlFilters } from "@/hooks/useUrlFilters";
import type { JobQuery } from "@/types/api";
import { cn, formatRelative } from "@/lib/utils";
import {
  JOB_GROUPS,
  JOB_GROUP_LABEL,
  URGENCIES,
  type JobGroup,
  type Urgency,
} from "@/types/job";

const FILTER_KEYS = ["search", "group", "serviceCategoryId", "priority", "sortBy", "sortOrder"] as const;

export function JobsView() {
  const router = useRouter();
  const prefetchJob = usePrefetchJob();
  const [formOpen, setFormOpen] = useState(false);
  const { data: services } = useServices();
  const { values, page, setParams } = useUrlFilters(FILTER_KEYS);
  const [search, setSearch] = useDebouncedSearch(values.search ?? "", (value) => setParams({ search: value }));

  const group = values.group as JobGroup | undefined;
  const service = values.serviceCategoryId;
  const urgency = values.priority as Urgency | undefined;

  const { data, isLoading, isError, error, refetch, isFetching } = useJobs({
    search: values.search,
    group,
    serviceCategoryId: service,
    priority: urgency,
    sortBy: values.sortBy as JobQuery['sortBy'],
    sortOrder: values.sortOrder as JobQuery['sortOrder'],
    page,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  const activePage = data?.page ?? page;
  const activePageSize = data?.pageSize ?? DEFAULT_PAGE_SIZE;

  const stats = useJobStats();

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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <StatCard label="Active jobs" value={stats.data?.active ?? '—'} icon={Briefcase} loading={stats.isLoading} hint="All open, assigned and paused jobs" />
        <StatCard label="Completed jobs" value={stats.data?.completed ?? '—'} icon={CheckCircle2} loading={stats.isLoading} hint="All completed jobs" />
        <StatCard label="Open disputes" value={stats.data?.openDisputes ?? '—'} icon={ShieldAlert} loading={stats.isLoading} hint="All unresolved disputes" />
      </div>
      {stats.isError && <ErrorState message={stats.error.message} onRetry={() => stats.refetch()} />}

      <div className="mb-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by reference, problem, customer or technician"
            className="sm:col-span-2 xl:col-span-4"
          />
          <Select
            value={service ?? ""}
            onChange={(e) =>
              setParams({ serviceCategoryId: e.target.value || undefined })
            }
            aria-label="Filter by service"
          >
            <option value="">All services</option>
            {(services ?? []).map(({ id, name }) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </Select>
          <Select value={group ?? ''} onChange={(e) => setParams({ group: e.target.value || undefined })} aria-label="Filter jobs by group">
            <option value="">All jobs</option>
            {JOB_GROUPS.map((key) => <option key={key} value={key}>{JOB_GROUP_LABEL[key]}</option>)}
          </Select>
          <Select value={values.sortBy ?? 'createdAt'} onChange={(e) => setParams({ sortBy: e.target.value })} aria-label="Sort jobs by">
            <option value="createdAt">Requested date</option>
            <option value="updatedAt">Last updated</option>
            <option value="priority">Priority</option>
            <option value="offeredAmount">Offered amount</option>
          </Select>
          <Select value={values.sortOrder ?? 'desc'} onChange={(e) => setParams({ sortOrder: e.target.value })} aria-label="Job sort direction">
            <option value="desc">Descending</option><option value="asc">Ascending</option>
          </Select>
        </div>
        <ChipGroup
          label="Urgency"
          options={URGENCIES}
          value={urgency}
          onChange={(v) => setParams({ priority: v })}
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
                        onMouseEnter={() => prefetchJob(job.id)}
                        onFocus={() => prefetchJob(job.id)}
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
          </>
        )}
        {data && !isError && (
          <Pagination page={data.page} pageSize={data.pageSize} total={data.total} disabled={isFetching} onPageChange={(p) => setParams({ page: p })} />
        )}
      </Card>

      <JobFormDialog open={formOpen} onClose={() => setFormOpen(false)} />
    </>
  );
}
