'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Briefcase, ChevronRight, Plus } from 'lucide-react';
import { JobFormDialog } from '@/components/jobs/JobFormDialog';
import { JobStatusBadge, UrgencyBadge } from '@/components/jobs/JobStatusBadge';
import {
  Button,
  Card,
  ChipGroup,
  EmptyState,
  ErrorState,
  PageHeader,
  Pagination,
  SearchInput,
  SegmentedTabs,
  Select,
  Table,
  TableSkeleton,
  Td,
  Th,
  Tr,
} from '@/components/ui';
import { useJobs, useJobStats } from '@/hooks/useJobs';
import { useServices } from '@/hooks/useServices';
import { useDebouncedValue, useUrlFilters } from '@/hooks/useUrlFilters';
import { DEFAULT_PAGE_SIZE } from '@/lib/api/mock-utils';
import { cn, formatRelative } from '@/lib/utils';
import { JOB_GROUPS, JOB_GROUP_LABEL, URGENCIES, type JobGroup, type Urgency } from '@/types/job';

const FILTER_KEYS = ['search', 'group', 'service', 'urgency'] as const;
type Tab = 'all' | JobGroup;

export function JobsView() {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const { data: services } = useServices();
  const { values, page, setParams } = useUrlFilters(FILTER_KEYS);
  const [search, setSearch] = useState(values.search ?? '');
  const debouncedSearch = useDebouncedValue(search);

  useEffect(() => {
    if (debouncedSearch !== (values.search ?? '')) setParams({ search: debouncedSearch });
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
  const { data: stats } = useJobStats();

  const tabs: { value: Tab; label: string; count?: number }[] = [
    { value: 'all', label: 'All', count: stats?.total },
    ...JOB_GROUPS.map((g) => ({ value: g, label: JOB_GROUP_LABEL[g], count: stats?.byGroup[g] })),
  ];
  const hasFilters = Boolean(values.search || group || service || urgency);

  return (
    <>
      <PageHeader
        title="Jobs"
        description="Oversee every job from request to rating."
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden /> New job
          </Button>
        }
      />

      <div className="mb-4 space-y-3">
        <SegmentedTabs
          label="Job stage"
          tabs={tabs}
          value={group ?? 'all'}
          onChange={(tab) => setParams({ group: tab === 'all' ? undefined : tab })}
        />
        <div className="flex flex-col gap-3 md:flex-row">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by reference, problem, customer or technician"
            className="md:flex-1"
          />
          <Select
            value={service ?? ''}
            onChange={(e) => setParams({ service: e.target.value || undefined })}
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
        <ChipGroup label="Urgency" options={URGENCIES} value={urgency} onChange={(v) => setParams({ urgency: v })} />
      </div>

      <Card className={cn('overflow-hidden', isFetching && !isLoading && 'opacity-70 transition-opacity')}>
        {isError ? (
          <ErrorState message={error.message} onRetry={() => refetch()} />
        ) : !isLoading && data?.items.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No jobs found"
            description={hasFilters ? 'Try a different search or clear the filters.' : 'No jobs have been requested yet.'}
          />
        ) : (
          <>
            <Table>
              <thead>
                <tr>
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
                  <TableSkeleton columns={7} />
                ) : (
                  data.items.map((job) => (
                    <Tr key={job.id} onClick={() => router.push(`/admin/jobs/${job.id}`)} label={`Open job ${job.reference}`}>
                      <Td>
                        <p className="font-medium text-slate-900">{job.reference}</p>
                        <p className="max-w-[16rem] truncate text-xs text-slate-500">{job.problem}</p>
                      </Td>
                      <Td className="whitespace-nowrap text-slate-600">{job.service}</Td>
                      <Td className="whitespace-nowrap text-slate-600">{job.customer.name}</Td>
                      <Td className="whitespace-nowrap">
                        {job.technician ? (
                          <span className="text-slate-600">{job.technician.name}</span>
                        ) : (
                          <span className="text-slate-400">Not assigned</span>
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
                          <ChevronRight className="h-4 w-4 text-slate-400" aria-hidden />
                        </span>
                      </Td>
                    </Tr>
                  ))
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
