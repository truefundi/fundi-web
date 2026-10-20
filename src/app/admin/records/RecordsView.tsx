'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Star } from 'lucide-react';
import { JobStatusBadge } from '@/components/jobs/JobStatusBadge';
import {
  Badge,
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
import { useJobs } from '@/hooks/useJobs';
import { useServices } from '@/hooks/useServices';
import { useDebouncedValue, useUrlFilters } from '@/hooks/useUrlFilters';
import { DEFAULT_PAGE_SIZE } from '@/lib/api/mock-utils';
import { formatDate } from '@/lib/utils';
import type { JobGroup } from '@/types/job';

const FILTER_KEYS = ['search', 'service'] as const;

export function RecordsView() {
  const router = useRouter();
  const { data: services } = useServices();
  const { values, page, setParams } = useUrlFilters(FILTER_KEYS);
  const [search, setSearch] = useState(values.search ?? '');
  const debouncedSearch = useDebouncedValue(search);

  useEffect(() => {
    if (debouncedSearch !== (values.search ?? '')) setParams({ search: debouncedSearch });
  }, [debouncedSearch, values.search, setParams]);

  const { data, isLoading, isError, error, refetch, isFetching } = useJobs({
    search: values.search,
    service: values.service,
    group: 'completed' satisfies JobGroup,
    page,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const hasFilters = Boolean(values.search || values.service);

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
          value={values.service ?? ''}
          onChange={(event) => setParams({ service: event.target.value || undefined })}
          aria-label="Filter records by service"
          className="sm:w-60"
        >
          <option value="">All services</option>
          {(services ?? []).map((service) => (
            <option key={service.id} value={service.name}>
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
                  <TableSkeleton columns={7} />
                ) : (
                  data.items.map((job) => (
                    <Tr
                      key={job.id}
                      onClick={() => router.push(`/admin/jobs/${job.id}`)}
                      label={`Open service record ${job.reference}`}
                    >
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
                        {job.rating ? (
                          <Badge tone="warning">
                            <span className="inline-flex items-center gap-1">
                              <Star className="h-3.5 w-3.5 fill-current" aria-hidden />
                              {job.rating.overall}/5
                            </span>
                          </Badge>
                        ) : (
                          <span className="text-slate-400">Not rated</span>
                        )}
                      </Td>
                      <Td className="whitespace-nowrap text-slate-600">
                        {formatDate(job.completedAt ?? job.updatedAt)}
                      </Td>
                      <Td>
                        <JobStatusBadge status={job.status} />
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
                onPageChange={(nextPage) => setParams({ page: nextPage })}
              />
            )}
          </>
        )}
      </Card>
    </>
  );
}
