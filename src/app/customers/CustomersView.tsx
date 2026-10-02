'use client';

import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { AccountStatusAction, AccountStatusBadge } from '@/components/accounts/AccountStatus';
import {
  Avatar,
  Card,
  ChipGroup,
  EmptyState,
  ErrorState,
  PageHeader,
  Pagination,
  SearchInput,
  Table,
  TableSkeleton,
  Td,
  Th,
  Tr,
} from '@/components/ui';
import { useCustomers, useUpdateCustomerStatus } from '@/hooks/useCustomers';
import { useDebouncedValue, useUrlFilters } from '@/hooks/useUrlFilters';
import { DEFAULT_PAGE_SIZE } from '@/lib/api/mock-utils';
import { cn, formatDate, formatPhone } from '@/lib/utils';
import { ACCOUNT_STATUSES, ACCOUNT_STATUS_LABEL, type AccountStatus } from '@/types/customer';

const FILTER_KEYS = ['search', 'status'] as const;

export function CustomersView() {
  const { values, page, setParams } = useUrlFilters(FILTER_KEYS);
  const [search, setSearch] = useState(values.search ?? '');
  const debouncedSearch = useDebouncedValue(search);

  useEffect(() => {
    if (debouncedSearch !== (values.search ?? '')) setParams({ search: debouncedSearch });
  }, [debouncedSearch, values.search, setParams]);

  const status = values.status as AccountStatus | undefined;
  const { data, isLoading, isError, error, refetch, isFetching } = useCustomers({
    search: values.search,
    status,
    page,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const updateStatus = useUpdateCustomerStatus();

  return (
    <>
      <PageHeader title="Customers" description="Manage customer accounts." />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by name, phone or email"
          className="lg:w-96"
        />
        <ChipGroup
          label="Status"
          options={ACCOUNT_STATUSES}
          value={status}
          onChange={(v) => setParams({ status: v })}
          getLabel={(v) => ACCOUNT_STATUS_LABEL[v]}
        />
      </div>

      <Card className={cn('overflow-hidden', isFetching && !isLoading && 'opacity-70 transition-opacity')}>
        {isError ? (
          <ErrorState message={error.message} onRetry={() => refetch()} />
        ) : !isLoading && data?.items.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No customers found"
            description={values.search || status ? 'Try a different search or clear the filters.' : 'No customers yet.'}
          />
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>Customer</Th>
                  <Th>Contact</Th>
                  <Th>Jobs requested</Th>
                  <Th>Status</Th>
                  <Th>Joined</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {isLoading || !data ? (
                  <TableSkeleton columns={6} />
                ) : (
                  data.items.map((customer) => (
                    <Tr key={customer.id}>
                      <Td>
                        <div className="flex items-center gap-3">
                          <Avatar name={customer.name} />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-900">{customer.name}</p>
                            <p className="truncate text-xs text-slate-500">{customer.email ?? 'No email'}</p>
                          </div>
                        </div>
                      </Td>
                      <Td>
                        <p className="whitespace-nowrap text-slate-900">{formatPhone(customer.phone)}</p>
                        <p className="whitespace-nowrap text-xs text-slate-500">{customer.location}</p>
                      </Td>
                      <Td className="text-slate-600">{customer.jobsRequested}</Td>
                      <Td>
                        <AccountStatusBadge status={customer.status} />
                      </Td>
                      <Td className="whitespace-nowrap text-slate-600">{formatDate(customer.createdAt)}</Td>
                      <Td className="text-right">
                        <AccountStatusAction
                          name={customer.name}
                          status={customer.status}
                          loading={updateStatus.isPending}
                          onChange={(next) => updateStatus.mutateAsync({ id: customer.id, status: next })}
                        />
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
    </>
  );
}
