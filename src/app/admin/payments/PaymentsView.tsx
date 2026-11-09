'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Banknote,
  CalendarClock,
  CheckCircle2,
  CreditCard,
} from 'lucide-react';

import {
  Badge,
  Button,
  Card,
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
} from '@/components/ui';

import { usePayments } from '@/hooks/usePayments';
import type {
  BookingPayment,
  BookingPaymentStatus,
} from '@/lib/api/endpoints/payments';
import { formatMoney } from '@/lib/jobs';
import { formatDate } from '@/lib/utils';

const PAGE_SIZE = 10;

type StatusFilter = 'all' | BookingPaymentStatus;

const STATUS_LABELS: Record<BookingPaymentStatus, string> = {
  VALID: 'Valid',
  EXPIRED: 'Expired',
  PAUSED: 'Paused',
  RESUMED: 'Resumed',
  COMPLETED: 'Completed',
};

function statusTone(
  status: BookingPaymentStatus,
): 'success' | 'warning' | 'danger' | 'info' {
  switch (status) {
    case 'VALID':
    case 'COMPLETED':
      return 'success';
    case 'PAUSED':
      return 'warning';
    case 'EXPIRED':
      return 'danger';
    case 'RESUMED':
      return 'info';
  }
}

function matchesSearch(payment: BookingPayment, term: string): boolean {
  if (!term) return true;

  return [
    payment.externalPaymentId,
    payment.customer.fullName,
    payment.customer.phoneNumber,
    payment.phoneNumber,
    payment.serviceCategory.name,
    payment.job?.id ?? '',
    payment.job?.description ?? '',
  ].some((value) => value.toLowerCase().includes(term));
}

export function PaymentsView() {
  const router = useRouter();

  const {
    data: payments = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = usePayments();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);

  const stats = useMemo(() => {
    const totalCollected = payments.reduce(
      (sum, payment) => sum + payment.amount,
      0,
    );

    const activeBookings = payments
      .filter((payment) =>
        ['VALID', 'PAUSED', 'RESUMED'].includes(payment.status),
      )
      .reduce((sum, payment) => sum + payment.amount, 0);

    const expiredBookings = payments
      .filter((payment) => payment.status === 'EXPIRED')
      .reduce((sum, payment) => sum + payment.amount, 0);

    const completedBookings = payments
      .filter((payment) => payment.status === 'COMPLETED')
      .reduce((sum, payment) => sum + payment.amount, 0);

    return {
      totalCollected,
      activeBookings,
      expiredBookings,
      completedBookings,
    };
  }, [payments]);

  const filteredPayments = useMemo(() => {
    const term = search.trim().toLowerCase();

    return payments
      .filter(
        (payment) =>
          matchesSearch(payment, term) &&
          (status === 'all' || payment.status === status),
      )
      .sort(
        (a, b) => Date.parse(b.paidAt) - Date.parse(a.paidAt),
      );
  }, [payments, search, status]);

  const pageCount = Math.max(
    1,
    Math.ceil(filteredPayments.length / PAGE_SIZE),
  );

  const currentPage = Math.min(page, pageCount);

  const visiblePayments = filteredPayments.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const updateSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setStatus('all');
    setPage(1);
  };

  return (
    <>
      <PageHeader
        title="Payments"
        description="Monitor booking fees collected across services and track their payment lifecycle."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total booking fees"
          value={isError ? '—' : formatMoney(stats.totalCollected)}
          hint="All booking payment records"
          icon={Banknote}
          loading={isLoading}
        />

        <StatCard
          label="Active bookings"
          value={isError ? '—' : formatMoney(stats.activeBookings)}
          hint="Valid, paused and resumed payments"
          icon={CheckCircle2}
          loading={isLoading}
        />

        <StatCard
          label="Expired bookings"
          value={isError ? '—' : formatMoney(stats.expiredBookings)}
          hint="Booking payments past their validity"
          icon={CalendarClock}
          loading={isLoading}
        />

        <StatCard
          label="Completed bookings"
          value={isError ? '—' : formatMoney(stats.completedBookings)}
          hint="Payments linked to completed jobs"
          icon={CreditCard}
          loading={isLoading}
        />
      </div>

      <Card
        className={
          isFetching && !isLoading
            ? 'opacity-70 transition-opacity'
            : undefined
        }
      >
        <div className="space-y-3 border-b border-slate-100 p-4">
          <div className="flex flex-col gap-3 md:flex-row">
            <SearchInput
              value={search}
              onChange={updateSearch}
              placeholder="Search transaction, customer, or service"
              className="md:flex-1"
            />

            <Select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as StatusFilter);
                setPage(1);
              }}
              aria-label="Filter by booking payment status"
              className="md:w-56"
            >
              <option value="all">All statuses</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {isError ? (
          <ErrorState
            message={error?.message ?? 'Could not load booking payments.'}
            onRetry={() => refetch()}
          />
        ) : !isLoading && filteredPayments.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title={
              payments.length === 0
                ? 'No booking payments yet'
                : 'No payments found'
            }
            description={
              payments.length === 0
                ? 'Booking fee transactions will appear here when customers make payments.'
                : 'Try changing your search or status filter.'
            }
          />
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>Date</Th>
                  <Th>Transaction</Th>
                  <Th>Customer</Th>
                  <Th>Service</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Booking fee</Th>
                </tr>
              </thead>

              <tbody>
                {isLoading ? (
                  <TableSkeleton columns={6} />
                ) : (
                  visiblePayments.map((payment) => (
                    <Tr
                      key={payment.id}
                      onClick={
                        payment.jobId
                          ? () =>
                              router.push(`/admin/jobs/${payment.jobId}`)
                          : undefined
                      }
                      label={
                        payment.jobId
                          ? `Open associated job for ${payment.customer.fullName}`
                          : undefined
                      }
                    >
                      <Td className="whitespace-nowrap text-slate-600">
                        {formatDate(payment.paidAt)}
                      </Td>

                      <Td>
                        <p className="font-medium text-slate-900">
                          {payment.externalPaymentId}
                        </p>
                        <p className="text-xs text-slate-500">
                          {payment.phoneNumber}
                        </p>
                      </Td>

                      <Td>
                        <p className="font-medium text-slate-900">
                          {payment.customer.fullName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {payment.customer.phoneNumber}
                        </p>
                      </Td>

                      <Td className="text-slate-600">
                        <p>{payment.serviceCategory.name}</p>
                        {payment.job && (
                          <p className="text-xs text-slate-400">
                            Job: {payment.job.id.slice(0, 8)}
                          </p>
                        )}
                      </Td>

                      <Td>
                        <Badge tone={statusTone(payment.status)}>
                          {STATUS_LABELS[payment.status]}
                        </Badge>
                      </Td>

                      <Td className="whitespace-nowrap text-right font-semibold text-slate-900">
                        {formatMoney(payment.amount)}
                      </Td>
                    </Tr>
                  ))
                )}
              </tbody>
            </Table>

            {filteredPayments.length > 0 && (
              <Pagination
                page={currentPage}
                pageSize={PAGE_SIZE}
                total={filteredPayments.length}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </Card>

      {!isLoading &&
        !isError &&
        payments.length > 0 &&
        filteredPayments.length === 0 && (
          <div className="mt-3 flex justify-center">
            <Button
              variant="secondary"
              size="sm"
              onClick={clearFilters}
            >
              Clear filters
            </Button>
          </div>
        )}

      <p className="mt-3 text-xs text-slate-500">
        Amounts show booking fees recorded by the backend in Rwandan francs
        (RWF). Booking status reflects the validity and completion lifecycle.
      </p>
    </>
  );
}