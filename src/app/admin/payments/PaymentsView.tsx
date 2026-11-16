'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Banknote,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  Send,
  Users,
  Wallet,
} from 'lucide-react';

import {
  Avatar,
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
  useToast,
} from '@/components/ui';

import { RoleGuard } from '@/components/auth/RoleGuard';
import { useAuth } from '@/context/AuthContext';
import { usePayments } from '@/hooks/usePayments';
import { useLogAdminAction, useUsers } from '@/hooks/useUsers';
import type {
  BookingPayment,
  BookingPaymentStatus,
} from '@/lib/api/endpoints/payments';
import { formatMoney } from '@/lib/jobs';
import { cn, formatDate } from '@/lib/utils';
import { USER_ROLE_LABELS, type UserRole } from '@/types/user';

const PAGE_SIZE = 10;

type FinanceTab = 'booking-fees' | 'technician-payouts' | 'staff-payroll';
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
  const toast = useToast();
  const { user } = useAuth();
  const logAction = useLogAdminAction();

  const actorId = user?.id ?? 'unknown';
  const actorName = user?.fullName ?? 'Finance Officer';
  const actorRole = ((user as { staffRole?: UserRole } | null)?.staffRole ??
    user?.role ??
    'ACCOUNTANT') as UserRole;

  const [activeTab, setActiveTab] = useState<FinanceTab>('booking-fees');

  const {
    data: payments = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = usePayments();

  const { data: staffData, isLoading: isStaffLoading } = useUsers({
    role: 'ADMIN',
    page: 1,
    pageSize: 50,
  });

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);

  const [paidJobIds, setPaidJobIds] = useState<Record<string, boolean>>({});
  const [paidStaffIds, setPaidStaffIds] = useState<Record<string, string>>({});

  const completedJobPayments = useMemo(
    () => payments.filter((p) => p.status === 'COMPLETED'),
    [payments],
  );

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

    const completedBookings = completedJobPayments.reduce(
      (sum, payment) => sum + payment.amount,
      0,
    );

    return {
      totalCollected,
      activeBookings,
      expiredBookings,
      completedBookings,
    };
  }, [payments, completedJobPayments]);

  const filteredPayments = useMemo(() => {
    const term = search.trim().toLowerCase();

    return payments
      .filter(
        (payment) =>
          matchesSearch(payment, term) &&
          (status === 'all' || payment.status === status),
      )
      .sort((a, b) => Date.parse(b.paidAt) - Date.parse(a.paidAt));
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

  const handleDisbursePayout = (payment: BookingPayment) => {
    setPaidJobIds((prev) => ({ ...prev, [payment.id]: true }));

    logAction.mutate({
      actorId,
      actorName,
      actorRole,
      action: 'DISBURSED_TECHNICIAN_PAYOUT',
      target: `Transaction ${payment.externalPaymentId}`,
      details: `Disbursed technician payout for ${payment.serviceCategory.name} (${formatMoney(payment.amount)})`,
    });

    toast(`Payout recorded for ${payment.externalPaymentId}`, 'success');
  };

  const handlePayStaff = (staffId: string, staffName: string, roleLabel: string) => {
    const today = new Date().toISOString();
    setPaidStaffIds((prev) => ({ ...prev, [staffId]: today }));

    logAction.mutate({
      actorId,
      actorName,
      actorRole,
      action: 'PAID_STAFF_SALARY',
      target: `${staffName} (${roleLabel})`,
      details: `Recorded monthly salary payment for ${staffName}`,
    });

    toast(`Salary payment recorded for ${staffName}`, 'success');
  };

  return (
    <RoleGuard requiredPermission="manage:finance">
      <PageHeader
        title="Payments & Finance"
        description="Manage booking fees, technician payouts, and internal staff payroll."
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

      <div className="mb-4 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('booking-fees')}
          className={cn(
            'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
            activeTab === 'booking-fees'
              ? 'bg-amber-400 text-slate-950 shadow-sm'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
          )}
        >
          <CreditCard className="h-4 w-4" />
          Booking Fees ({payments.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('technician-payouts')}
          className={cn(
            'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
            activeTab === 'technician-payouts'
              ? 'bg-amber-400 text-slate-950 shadow-sm'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
          )}
        >
          <Wallet className="h-4 w-4" />
          Technician Payouts ({completedJobPayments.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('staff-payroll')}
          className={cn(
            'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
            activeTab === 'staff-payroll'
              ? 'bg-amber-400 text-slate-950 shadow-sm'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
          )}
        >
          <Users className="h-4 w-4" />
          Staff Payroll ({staffData?.items.length ?? 0})
        </button>
      </div>

      {activeTab === 'booking-fees' && (
        <>
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
        </>
      )}

      {activeTab === 'technician-payouts' && (
        <Card className="overflow-hidden">
          {completedJobPayments.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="No completed jobs awaiting payout"
              description="Completed service jobs ready for technician payout disbursement will appear here."
            />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Completed Date</Th>
                  <Th>Transaction / Job</Th>
                  <Th>Service Category</Th>
                  <Th>Customer</Th>
                  <Th>Payout Status</Th>
                  <Th className="text-right">Action</Th>
                </tr>
              </thead>
              <tbody>
                {completedJobPayments.map((payment) => {
                  const isPaid = Boolean(paidJobIds[payment.id]);
                  return (
                    <Tr key={payment.id}>
                      <Td className="whitespace-nowrap text-slate-600">
                        {formatDate(payment.paidAt)}
                      </Td>
                      <Td>
                        <p className="font-medium text-slate-900">
                          {payment.externalPaymentId}
                        </p>
                        {payment.job && (
                          <p className="text-xs text-slate-500">
                            Job #{payment.job.id.slice(0, 8)}
                          </p>
                        )}
                      </Td>
                      <Td className="text-slate-700">
                        {payment.serviceCategory.name}
                      </Td>
                      <Td className="text-slate-700">
                        {payment.customer.fullName}
                      </Td>
                      <Td>
                        <Badge tone={isPaid ? 'success' : 'warning'}>
                          {isPaid ? 'Disbursed' : 'Pending Payout'}
                        </Badge>
                      </Td>
                      <Td className="text-right">
                        {!isPaid ? (
                          <Button
                            size="sm"
                            onClick={() => handleDisbursePayout(payment)}
                          >
                            <Send className="mr-1.5 h-3.5 w-3.5" />
                            Disburse Payout
                          </Button>
                        ) : (
                          <span className="inline-flex items-center text-xs font-medium text-emerald-600">
                            <CheckCircle2 className="mr-1 h-4 w-4" />
                            Paid
                          </span>
                        )}
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Card>
      )}

      {activeTab === 'staff-payroll' && (
        <Card className="overflow-hidden">
          {!isStaffLoading && (staffData?.items.length ?? 0) === 0 ? (
            <EmptyState
              icon={Users}
              title="No staff members found"
              description="Add administrative staff under Staff Management to process payroll."
            />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Staff Member</Th>
                  <Th>Role</Th>
                  <Th>Contact</Th>
                  <Th>Payroll Status</Th>
                  <Th className="text-right">Action</Th>
                </tr>
              </thead>
              <tbody>
                {isStaffLoading ? (
                  <TableSkeleton columns={5} />
                ) : (
                  (staffData?.items ?? []).map((staff) => {
                    const effectiveStaffRole = ((staff as { staffRole?: UserRole })
                      .staffRole ?? staff.role) as UserRole;
                    const roleLabel =
                      USER_ROLE_LABELS[effectiveStaffRole] ?? effectiveStaffRole;
                    const paidDate = paidStaffIds[staff.id];

                    return (
                      <Tr key={staff.id}>
                        <Td>
                          <div className="flex items-center gap-3">
                            <Avatar name={staff.fullName} />
                            <p className="font-medium text-slate-900">
                              {staff.fullName}
                            </p>
                          </div>
                        </Td>
                        <Td className="font-medium text-slate-600">
                          {roleLabel}
                        </Td>
                        <Td className="text-slate-600">
                          {staff.email ?? staff.phone ?? '—'}
                        </Td>
                        <Td>
                          <Badge tone={paidDate ? 'success' : 'neutral'}>
                            {paidDate
                              ? `Paid (${formatDate(paidDate)})`
                              : 'Pending Cycle'}
                          </Badge>
                        </Td>
                        <Td className="text-right">
                          {!paidDate ? (
                            <Button
                              size="sm"
                              onClick={() =>
                                handlePayStaff(staff.id, staff.fullName, roleLabel)
                              }
                            >
                              <Banknote className="mr-1.5 h-3.5 w-3.5" />
                              Record Salary Payment
                            </Button>
                          ) : (
                            <span className="inline-flex items-center text-xs font-medium text-emerald-600">
                              <CheckCircle2 className="mr-1 h-4 w-4" />
                              Paid
                            </span>
                          )}
                        </Td>
                      </Tr>
                    );
                  })
                )}
              </tbody>
            </Table>
          )}
        </Card>
      )}

      <p className="mt-3 text-xs text-slate-500">
        Amounts show booking fees recorded by the backend in Rwandan francs
        (RWF). All financial disbursements and staff payments are logged for
        Super Admin review.
      </p>
    </RoleGuard>
  );
}