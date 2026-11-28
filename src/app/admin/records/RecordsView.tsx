'use client';

import { useRouter } from 'next/navigation';
import { FileText } from 'lucide-react';
import { JobStatusBadge } from '@/components/jobs/JobStatusBadge';
import {
  Card,
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
} from '@/components/ui';
import { DEFAULT_PAGE_SIZE } from '@/config/pagination';
import { useJobs, usePrefetchJob } from '@/hooks/useJobs';
import { useServices } from '@/hooks/useServices';
import { useDebouncedSearch, useUrlFilters } from '@/hooks/useUrlFilters';
import { formatDate } from '@/lib/utils';
import type { JobGroup } from '@/types/job';

const FILTER_KEYS = ['search', 'serviceCategoryId'] as const;

export function RecordsView() {
  const router = useRouter();
  const prefetchJob = usePrefetchJob();
  const { data: services } = useServices();
  const { values, page, setParams } = useUrlFilters(FILTER_KEYS);
  const [search, setSearch] = useDebouncedSearch(values.search ?? '', (value) => setParams({ search: value }));

  const { data, isLoading, isError, error, refetch, isFetching } = useJobs({
    search: values.search,
    serviceCategoryId: values.serviceCategoryId,
    group: 'completed' satisfies JobGroup,
    page,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const hasFilters = Boolean(values.search || values.serviceCategoryId);

  const activePage = data?.page ?? page;
  const activePageSize = data?.pageSize ?? DEFAULT_PAGE_SIZE;

  return (
    <>
      <PageHeader
        title="Service Records"
        description="Completed jobs and their recorded service details."
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by reference, customer, or technician"
          className="sm:flex-1"
        />
        <Select
          value={values.serviceCategoryId ?? ''}
          onChange={(event) => setParams({ serviceCategoryId: event.target.value || undefined })}
          aria-label="Filter records by service"
          className="sm:w-60"
        >
          <option value="">All services</option>
          {(services ?? []).map((service) => (
            <option key={service.id} value={service.id}>
              {service.name}
            </option>
          ))}
        </Select>
      </div>

      <Card className={isFetching && !isLoading ? 'opacity-70 transition-opacity' : undefined}>
        {isError ? (
          <ErrorState message={error.message} onRetry={() => refetch()} />
        ) : !isLoading && data?.items.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No completed service records"
            description={
              hasFilters
                ? 'Try a different search or service filter.'
                : 'Completed jobs will appear here with their recorded details.'
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
                  <Th>Rating</Th>
                  <Th>Completed</Th>
                  <Th>Status</Th>
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
                        label={`Open service record ${job.reference}`}
                      >
                        <Td className="whitespace-nowrap text-xs font-medium text-slate-400">
                          {rowNumber}
                        </Td>
                        <Td>
                          <p className="font-medium text-slate-900">{job.reference}</p>
                          <p className="max-w-[16rem] truncate text-xs text-slate-500">{job.problem}</p>
                        </Td>
                        <Td className="whitespace-nowrap text-slate-600">{job.service}</Td>
                        <Td className="whitespace-nowrap text-slate-600">{job.customer.name}</Td>
                        <Td className="whitespace-nowrap text-slate-600">
                          {job.technician?.name ?? <span className="text-slate-400">Not assigned</span>}
                        </Td>
                        <Td className="whitespace-nowrap">
                          <span className="text-slate-500">View in job details</span>
                        </Td>
                        <Td className="whitespace-nowrap text-slate-600">
                          {formatDate(job.completedAt ?? job.updatedAt)}
                        </Td>
                        <Td>
                          <JobStatusBadge status={job.status} />
                        </Td>
                      </Tr>
                    );
                  })
                )}
              </tbody>
            </Table>
          </>
        )}
        {data && !isError && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} disabled={isFetching} onPageChange={(nextPage) => setParams({ page: nextPage })} />}
      </Card>
    </>
  );
}
