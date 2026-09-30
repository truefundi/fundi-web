'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, HardHat, Star } from 'lucide-react';
import { AccountStatusBadge } from '@/components/accounts/AccountStatus';
import { VerificationBadge } from '@/components/technicians/VerificationBadge';
import {
  Avatar,
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
import { SERVICE_CATEGORIES, type ServiceCategory } from '@/config/services';
import { useAdminStats } from '@/hooks/useCustomers';
import { useTechnicians } from '@/hooks/useTechnicians';
import { useDebouncedValue, useUrlFilters } from '@/hooks/useUrlFilters';
import { DEFAULT_PAGE_SIZE } from '@/lib/api/mock-utils';
import { cn, formatDate } from '@/lib/utils';
import { ACCOUNT_STATUSES, ACCOUNT_STATUS_LABEL, type AccountStatus } from '@/types/customer';
import type { VerificationStatus } from '@/types/technician';

const FILTER_KEYS = ['search', 'verification', 'status', 'trade', 'available'] as const;
const AVAILABILITY = ['online', 'offline'] as const;
type Tab = 'all' | VerificationStatus;

export function TechniciansView() {
  const router = useRouter();
  const { values, page, setParams } = useUrlFilters(FILTER_KEYS);
  const [search, setSearch] = useState(values.search ?? '');
  const debouncedSearch = useDebouncedValue(search);

  useEffect(() => {
    if (debouncedSearch !== (values.search ?? '')) setParams({ search: debouncedSearch });
  }, [debouncedSearch, values.search, setParams]);

  const verification = values.verification as VerificationStatus | undefined;
  const status = values.status as AccountStatus | undefined;
  const trade = values.trade as ServiceCategory | undefined;
  const availability = values.available as (typeof AVAILABILITY)[number] | undefined;

  const { data, isLoading, isError, error, refetch, isFetching } = useTechnicians({
    search: values.search,
    verification,
    status,
    trade,
    available: availability ? availability === 'online' : undefined,
    page,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const { data: stats } = useAdminStats();

  const tabs: { value: Tab; label: string; count?: number }[] = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending review', count: stats?.pendingVerifications },
    { value: 'verified', label: 'Verified' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'not_submitted', label: 'Not submitted' },
  ];
  const hasFilters = Boolean(values.search || verification || status || trade || availability);

  return (
    <>
      <PageHeader title="Technicians" description="Verify and manage technicians." />

      <div className="mb-4 space-y-3">
        <SegmentedTabs
          label="Verification status"
          tabs={tabs}
          value={verification ?? 'all'}
          onChange={(tab) => setParams({ verification: tab === 'all' ? undefined : tab })}
        />
        <div className="flex flex-col gap-3 md:flex-row">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by name, phone or email"
            className="md:flex-1"
          />
          <Select
            value={trade ?? ''}
            onChange={(e) => setParams({ trade: e.target.value || undefined })}
            aria-label="Filter by service"
            className="md:w-56"
          >
            <option value="">All services</option>
            {SERVICE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-3 xl:flex-row xl:gap-6">
          <ChipGroup
            label="Account"
            options={ACCOUNT_STATUSES}
            value={status}
            onChange={(v) => setParams({ status: v })}
            getLabel={(v) => ACCOUNT_STATUS_LABEL[v]}
          />
          <ChipGroup
            label="Availability"
            options={AVAILABILITY}
            value={availability}
            onChange={(v) => setParams({ available: v })}
            getLabel={(v) => (v === 'online' ? 'Online' : 'Offline')}
          />
        </div>
      </div>

      <Card className={cn('overflow-hidden', isFetching && !isLoading && 'opacity-70 transition-opacity')}>
        {isError ? (
          <ErrorState message={error.message} onRetry={() => refetch()} />
        ) : !isLoading && data?.items.length === 0 ? (
          <EmptyState
            icon={HardHat}
            title="No technicians found"
            description={hasFilters ? 'Try a different search or clear the filters.' : 'No technicians have signed up yet.'}
          />
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>Technician</Th>
                  <Th>Verification</Th>
                  <Th>Account</Th>
                  <Th>Rating</Th>
                  <Th>Jobs</Th>
                  <Th>Experience</Th>
                  <Th>Joined</Th>
                </tr>
              </thead>
              <tbody>
                {isLoading || !data ? (
                  <TableSkeleton columns={7} />
                ) : (
                  data.items.map((t) => (
                    <Tr key={t.id} onClick={() => router.push(`/technicians/${t.id}`)} label={`Open ${t.name}`}>
                      <Td>
                        <div className="flex items-center gap-3">
                          <span className="relative">
                            <Avatar name={t.name} />
                            {t.isAvailable && (
                              <span
                                className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-green-500"
                                title="Online"
                              />
                            )}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-900">{t.name}</p>
                            <p className="truncate text-xs text-slate-500">{t.trades.join(' · ')}</p>
                          </div>
                        </div>
                      </Td>
                      <Td>
                        <VerificationBadge status={t.verification.status} />
                      </Td>
                      <Td>
                        <AccountStatusBadge status={t.status} />
                      </Td>
                      <Td>
                        {t.jobsCompleted > 0 ? (
                          <span className="inline-flex items-center gap-1 font-medium text-slate-900">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />
                            {t.rating.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </Td>
                      <Td className="text-slate-600">{t.jobsCompleted}</Td>
                      <Td className="whitespace-nowrap text-slate-600">{t.yearsExperience} yrs</Td>
                      <Td className="whitespace-nowrap text-slate-600">
                        <span className="inline-flex items-center gap-2">
                          {formatDate(t.createdAt)}
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
    </>
  );
}
