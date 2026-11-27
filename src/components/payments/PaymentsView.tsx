'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Banknote,
  CalendarClock,
  CalendarPlus,
  Check,
  CheckCircle2,
  CreditCard,
  FileCheck2,
  Pencil,
  Plus,
  Send,
  Trash2,
  Users,
  Wallet,
  X,
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
import {
  useCreateCompletedPayment,
  useDeleteCompletedPayment,
  useExtendPayment,
  usePaymentClaims,
  usePayments,
  usePaymentSummary,
  useReviewPaymentClaim,
  useUpdateCompletedPayment,
} from '@/hooks/usePayments';
import { useDebouncedSearch } from '@/hooks/useUrlFilters';
import { useLogAdminAction, useUsers } from '@/hooks/useUsers';
import type {
  BookingPayment,
  BookingPaymentStatus,
  PaymentClaim,
  PaymentClaimStatus,
  PaymentQuery,
} from '@/lib/api/endpoints/payments';
import { formatMoney } from '@/lib/jobs';
import { cn, formatDate } from '@/lib/utils';
import { USER_ROLE_LABELS, type UserRole } from '@/types/user';

const PAGE_SIZE = 10;

type FinanceTab =
  | 'booking-fees'
  | 'payment-claims'
  | 'technician-payouts'
  | 'staff-payroll';
type StatusFilter = 'all' | BookingPaymentStatus;
type ClaimFilter = 'ALL' | PaymentClaimStatus;

interface EditCompletedState {
  externalPaymentId: string;
  phoneNumber: string;
  paidAt: string;
}

const STATUS_LABELS: Record<BookingPaymentStatus, string> = {
  VALID: 'Valid',
  EXPIRED: 'Expired',
  PAUSED: 'Paused',
  RESUMED: 'Resumed',
  COMPLETED: 'Completed',
};

const CLAIM_STATUS_LABELS: Record<PaymentClaimStatus, string> = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  PAY_CODE: 'Pay Code',
  MOBILE_MONEY: 'Mobile Money',
  MTN: 'MTN MoMo',
  AIRTEL: 'Airtel Money',
};

function toDateInputValue(isoOrDate: string): string {
  const parsed = new Date(isoOrDate);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().slice(0, 10);
}

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

function claimStatusTone(
  status: PaymentClaimStatus,
): 'success' | 'warning' | 'danger' {
  switch (status) {
    case 'APPROVED':
      return 'success';
    case 'PENDING':
      return 'warning';
    case 'REJECTED':
      return 'danger';
  }
}

function getAssignedTechnicianName(payment: BookingPayment): string {
  const history = payment.job?.assignmentHistory ?? [];
  const activeOrLatest =
    history.find((entry) => !entry.endedAt) ?? history[history.length - 1];
  return activeOrLatest?.technicianName ?? 'Unassigned';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const [completedPage, setCompletedPage] = useState(1);
  const [sortBy, setSortBy] = useState<PaymentQuery['sortBy']>('paidAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [search, updateSearch] = useDebouncedSearch(searchTerm, (value) => {
    setSearchTerm(value);
    setPage(1);
  });

  const {
    data: paymentPage,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = usePayments(
    {
      page,
      limit: PAGE_SIZE,
      search: searchTerm || undefined,
      status: status === 'all' ? undefined : status,
      sortBy,
      sortOrder,
    },
    activeTab === 'booking-fees',
  );
  const summary = usePaymentSummary();
  const completed = usePayments(
    { page: completedPage, limit: PAGE_SIZE, status: 'COMPLETED' },
    activeTab === 'technician-payouts',
  );
  const payments = paymentPage?.data ?? [];
  const completedJobPayments = completed.data?.data ?? [];
  // After deletion, move back to the last available page instead of trapping
  // users on an empty page whose pagination controls would be hidden.
  useEffect(() => {
    if (paymentPage && !isFetching && page > Math.max(1, paymentPage.pagination.totalPages)) {
      setPage(Math.max(1, paymentPage.pagination.totalPages));
    }
  }, [paymentPage, isFetching, page]);
  useEffect(() => {
    if (completed.data && !completed.isFetching && completedPage > Math.max(1, completed.data.pagination.totalPages)) {
      setCompletedPage(Math.max(1, completed.data.pagination.totalPages));
    }
  }, [completed.data, completed.isFetching, completedPage]);

  const [claimFilter, setClaimFilter] = useState<ClaimFilter>('ALL');
  const {
    data: claims = [],
    isLoading: isClaimsLoading,
    isError: isClaimsError,
    error: claimsError,
    refetch: refetchClaims,
  } = usePaymentClaims(
    claimFilter === 'ALL' ? undefined : claimFilter,
    activeTab === 'payment-claims',
  );

  const extendPayment = useExtendPayment();
  const reviewClaim = useReviewPaymentClaim();
  const createCompletedPayment = useCreateCompletedPayment();
  const updateCompletedPayment = useUpdateCompletedPayment();
  const deleteCompletedPayment = useDeleteCompletedPayment();

  const { data: staffData, isLoading: isStaffLoading } = useUsers(
    {
      role: 'ADMIN',
      page: 1,
      pageSize: 50,
    },
    activeTab === 'staff-payroll',
  );

  const [paidJobIds, setPaidJobIds] = useState<Record<string, boolean>>({});
  const [paidStaffIds, setPaidStaffIds] = useState<Record<string, string>>({});
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  // Completed payment creation form state
  const [showCreateCompleted, setShowCreateCompleted] = useState(false);
  const [newJobId, setNewJobId] = useState('');
  const [newExternalPaymentId, setNewExternalPaymentId] = useState('');
  const [newPhoneNumber, setNewPhoneNumber] = useState('+2507');
  const [newPaidAt, setNewPaidAt] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );

  // Inline completed payment edit state
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<EditCompletedState>({
    externalPaymentId: '',
    phoneNumber: '',
    paidAt: '',
  });

  const amountFor = (...statuses: BookingPaymentStatus[]) =>
    summary.data?.byStatus
      .filter((row) => statuses.includes(row.status))
      .reduce((total, row) => total + row.amount, 0) ?? 0;
  const stats = {
    totalCollected: summary.data?.amount ?? 0,
    activeBookings: amountFor('VALID', 'PAUSED', 'RESUMED'),
    expiredBookings: amountFor('EXPIRED'),
    completedBookings: amountFor('COMPLETED'),
  };

  const clearFilters = () => {
    updateSearch('');
    setSearchTerm('');
    setStatus('all');
    setPage(1);
  };

  const handleExtendValidity = (payment: BookingPayment, days = 7) => {
    extendPayment.mutate(
      { paymentId: payment.id, days },
      {
        onSuccess: (updated) => {
          logAction.mutate({
            actorId,
            actorName,
            actorRole,
            action: 'EXTENDED_BOOKING_PAYMENT',
            target: `Transaction ${payment.externalPaymentId}`,
            details: `Extended validity by ${days} days (new expiry: ${formatDate(updated.validUntil)})`,
          });
          toast(
            `Extended ${payment.externalPaymentId} by ${days} days`,
            'success',
          );
        },
        onError: (err: Error) => {
          toast(
            err.message || 'Could not extend booking payment validity.',
            'error',
          );
        },
      },
    );
  };

  const handleReviewClaim = (
    claim: PaymentClaim,
    decision: 'APPROVED' | 'REJECTED',
  ) => {
    const trimmedNote = reviewNotes[claim.id]?.trim();
    const methodLabel =
      PAYMENT_METHOD_LABELS[claim.paymentMethod] ?? claim.paymentMethod;

    reviewClaim.mutate(
      {
        claimId: claim.id,
        status: decision,
        reviewNote: trimmedNote || undefined,
      },
      {
        onSuccess: () => {
          logAction.mutate({
            actorId,
            actorName,
            actorRole,
            action:
              decision === 'APPROVED'
                ? 'APPROVED_PAYMENT_CLAIM'
                : 'REJECTED_PAYMENT_CLAIM',
            target: `Claim ${claim.id.slice(0, 8)} (${methodLabel}: ${claim.paymentNumber})`,
            details: `${decision} claim of ${formatMoney(claim.amount)}${claim.transactionRef ? ` [Ref: ${claim.transactionRef}]` : ''}${trimmedNote ? ` — Note: ${trimmedNote}` : ''}`,
          });
          toast(
            decision === 'APPROVED'
              ? 'Manual payment approved and booking payment issued'
              : 'Manual payment claim rejected',
            'success',
          );
        },
        onError: (err: Error) => {
          toast(err.message || 'Failed to review payment claim.', 'error');
        },
      },
    );
  };

  const handleCreateCompleted = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedJobId = newJobId.trim();
    const trimmedRef = newExternalPaymentId.trim();
    const trimmedPhone = newPhoneNumber.trim();

    if (!trimmedJobId || !trimmedRef || !trimmedPhone || !newPaidAt) {
      toast('Please fill in job ID, reference, phone number, and date.', 'error');
      return;
    }

    const paidAtIso = new Date(`${newPaidAt}T12:00:00.000Z`).toISOString();

    createCompletedPayment.mutate(
      {
        jobId: trimmedJobId,
        externalPaymentId: trimmedRef,
        phoneNumber: trimmedPhone,
        paidAt: paidAtIso,
      },
      {
        onSuccess: (created) => {
          logAction.mutate({
            actorId,
            actorName,
            actorRole,
            action: 'COMPLETED_JOB_PAYMENT_CREATED',
            target: `Transaction ${created.externalPaymentId}`,
            details: `Recorded completed payment for job ${trimmedJobId.slice(0, 8)} (${trimmedPhone})`,
          });
          toast(
            `Recorded completed payment ${created.externalPaymentId}`,
            'success',
          );
          setNewJobId('');
          setNewExternalPaymentId('');
          setNewPhoneNumber('+2507');
          setShowCreateCompleted(false);
        },
        onError: (err: Error) => {
          toast(
            err.message || 'Could not record completed payment.',
            'error',
          );
        },
      },
    );
  };

  const startEditingCompleted = (payment: BookingPayment) => {
    setEditingPaymentId(payment.id);
    setEditDraft({
      externalPaymentId: payment.externalPaymentId,
      phoneNumber: payment.phoneNumber,
      paidAt: toDateInputValue(payment.paidAt),
    });
  };

  const cancelEditingCompleted = () => {
    setEditingPaymentId(null);
  };

  const handleSaveCompletedEdit = (payment: BookingPayment) => {
    const trimmedRef = editDraft.externalPaymentId.trim();
    const trimmedPhone = editDraft.phoneNumber.trim();
    const paidAtIso = editDraft.paidAt
      ? new Date(`${editDraft.paidAt}T12:00:00.000Z`).toISOString()
      : payment.paidAt;

    updateCompletedPayment.mutate(
      {
        paymentId: payment.id,
        externalPaymentId: trimmedRef || undefined,
        phoneNumber: trimmedPhone || undefined,
        paidAt: paidAtIso,
      },
      {
        onSuccess: (updated) => {
          logAction.mutate({
            actorId,
            actorName,
            actorRole,
            action: 'COMPLETED_JOB_PAYMENT_UPDATED',
            target: `Transaction ${updated.externalPaymentId}`,
            details: `Updated completed payment details for ${updated.id.slice(0, 8)}`,
          });
          toast(`Updated payment ${updated.externalPaymentId}`, 'success');
          setEditingPaymentId(null);
        },
        onError: (err: Error) => {
          toast(
            err.message || 'Could not update completed payment.',
            'error',
          );
        },
      },
    );
  };

  const handleDeleteCompleted = (payment: BookingPayment) => {
    deleteCompletedPayment.mutate(payment.id, {
      onSuccess: () => {
        logAction.mutate({
          actorId,
          actorName,
          actorRole,
          action: 'COMPLETED_JOB_PAYMENT_DELETED',
          target: `Transaction ${payment.externalPaymentId}`,
          details: `Deleted completed payment (${formatMoney(payment.amount)})`,
        });
        toast(
          `Deleted completed payment ${payment.externalPaymentId}`,
          'success',
        );
      },
      onError: (err: Error) => {
        toast(err.message || 'Could not delete completed payment.', 'error');
      },
    });
  };

  const handleDisbursePayout = (payment: BookingPayment) => {
    const technicianName = getAssignedTechnicianName(payment);
    setPaidJobIds((prev) => ({ ...prev, [payment.id]: true }));

    logAction.mutate({
      actorId,
      actorName,
      actorRole,
      action: 'DISBURSED_TECHNICIAN_PAYOUT',
      target: `Transaction ${payment.externalPaymentId}`,
      details: `Disbursed technician payout to ${technicianName} for ${payment.serviceCategory.name} (${formatMoney(payment.amount)})`,
    });

    toast(`Payout recorded for ${payment.externalPaymentId}`, 'success');
  };

  const handlePayStaff = (
    staffId: string,
    staffName: string,
    roleLabel: string,
  ) => {
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
        description="Manage booking fees, manual pay code & mobile money claims, technician payouts, and staff payroll."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total booking fees"
          value={summary.isError ? '—' : formatMoney(stats.totalCollected)}
          hint="All booking payment records"
          icon={Banknote}
          loading={summary.isLoading}
        />

        <StatCard
          label="Active bookings"
          value={summary.isError ? '—' : formatMoney(stats.activeBookings)}
          hint="Valid, paused and resumed payments"
          icon={CheckCircle2}
          loading={summary.isLoading}
        />

        <StatCard
          label="Expired bookings"
          value={summary.isError ? '—' : formatMoney(stats.expiredBookings)}
          hint="Booking payments past their validity"
          icon={CalendarClock}
          loading={summary.isLoading}
        />

        <StatCard
          label="Completed bookings"
          value={summary.isError ? '—' : formatMoney(stats.completedBookings)}
          hint="Payments linked to completed jobs"
          icon={CreditCard}
          loading={summary.isLoading}
        />
      </div>

      {summary.isError && <ErrorState message={summary.error.message} onRetry={() => summary.refetch()} />}
      {summary.data && <p className="mb-4 text-xs text-slate-500">All booking records · totals generated {new Date(summary.data.generatedAt).toLocaleTimeString()}</p>}

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
          Booking Fees ({summary.data?.total ?? '—'})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('payment-claims')}
          className={cn(
            'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
            activeTab === 'payment-claims'
              ? 'bg-amber-400 text-slate-950 shadow-sm'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
          )}
        >
          <FileCheck2 className="h-4 w-4" />
          Payment Claims{activeTab === 'payment-claims' ? ` (${claims.length})` : ''}
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
          Technician Payouts ({summary.data?.byStatus.find((row) => row.status === 'COMPLETED')?.count ?? '—'})
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
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <SearchInput
                  value={search}
                  onChange={updateSearch}
                  placeholder="Search transaction, customer, job reference, or service"
                />

                <Select
                  value={status}
                  onChange={(event) => {
                    setStatus(event.target.value as StatusFilter);
                    setPage(1);
                  }}
                  aria-label="Filter by booking payment status"
                >
                  <option value="all">All statuses</option>
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
                <Select value={sortBy} onChange={(event) => { setSortBy(event.target.value as PaymentQuery['sortBy']); setPage(1); }} aria-label="Sort payments by">
                  <option value="paidAt">Payment date</option>
                  <option value="createdAt">Created date</option>
                  <option value="amount">Amount</option>
                  <option value="validUntil">Valid until</option>
                </Select>
                <Select value={sortOrder} onChange={(event) => { setSortOrder(event.target.value as 'asc' | 'desc'); setPage(1); }} aria-label="Payment sort direction">
                  <option value="desc">Descending</option><option value="asc">Ascending</option>
                </Select>
              </div>
            </div>

            {isError ? (
              <ErrorState
                message={error?.message ?? 'Could not load booking payments.'}
                onRetry={() => refetch()}
              />
            ) : !isLoading && payments.length === 0 ? (
              <EmptyState
                icon={CreditCard}
                title={
                  !searchTerm && status === 'all'
                    ? 'No booking payments yet'
                    : 'No payments found'
                }
                description={
                  !searchTerm && status === 'all'
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
                      <Th>Valid Until</Th>
                      <Th className="text-right">Booking fee</Th>
                      <Th className="text-right">Extend</Th>
                    </tr>
                  </thead>

                  <tbody>
                    {isLoading ? (
                      <TableSkeleton columns={8} />
                    ) : (
                       payments.map((payment) => (
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

                          <Td className="whitespace-nowrap text-xs text-slate-600">
                            <p>{formatDate(payment.validUntil)}</p>
                            {payment.extensionCount > 0 && (
                              <p className="text-slate-400">
                                +{payment.extensionCount} ext
                              </p>
                            )}
                          </Td>

                          <Td className="whitespace-nowrap text-right font-semibold text-slate-900">
                            {formatMoney(payment.amount)}
                          </Td>

                          <Td className="text-right">
                            <div
                              className="inline-flex justify-end"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {payment.status !== 'COMPLETED' ? (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  disabled={extendPayment.isPending}
                                  onClick={() => handleExtendValidity(payment, 7)}
                                >
                                  <CalendarPlus className="mr-1 h-3.5 w-3.5" />
                                  +7d
                                </Button>
                              ) : (
                                <span className="text-xs text-slate-400">—</span>
                              )}
                            </div>
                          </Td>
                        </Tr>
                      ))
                    )}
                  </tbody>
                </Table>

              </>
            )}
            {paymentPage && !isError && <Pagination page={paymentPage.pagination.page} pageSize={paymentPage.pagination.limit} total={paymentPage.pagination.total} disabled={isFetching} onPageChange={setPage} />}
          </Card>

          {!isLoading &&
            !isError &&
            Boolean(searchTerm || status !== 'all') &&
            payments.length === 0 && (
              <div className="mt-3 flex justify-center">
                <Button variant="secondary" size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              </div>
            )}
        </>
      )}

      {activeTab === 'payment-claims' && (
        <Card className="overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">
              Review manual Pay Code and Mobile Money payment claims and issue
              valid booking payments.
            </p>
            <Select
              value={claimFilter}
              onChange={(e) => setClaimFilter(e.target.value as ClaimFilter)}
              aria-label="Filter payment claims by status"
              className="sm:w-48"
            >
              <option value="ALL">All claims</option>
              {Object.entries(CLAIM_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>

          {isClaimsError ? (
            <ErrorState
              message={claimsError?.message ?? 'Could not load payment claims.'}
              onRetry={() => refetchClaims()}
            />
          ) : !isClaimsLoading && claims.length === 0 ? (
            <EmptyState
              icon={FileCheck2}
              title="No payment claims found"
              description="Submitted Pay Code and Mobile Money claims will appear here for review."
            />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Submitted</Th>
                  <Th>Customer & Channel</Th>
                  <Th>Service</Th>
                  <Th className="text-right">Amount</Th>
                  <Th>Status</Th>
                  <Th>Review Note</Th>
                  <Th className="text-right">Decision</Th>
                </tr>
              </thead>
              <tbody>
                {isClaimsLoading ? (
                  <TableSkeleton columns={7} />
                ) : (
                  claims.map((claim) => {
                    const isPending = claim.status === 'PENDING';
                    const methodLabel =
                      PAYMENT_METHOD_LABELS[claim.paymentMethod] ??
                      claim.paymentMethod;
                    return (
                      <Tr key={claim.id}>
                        <Td className="whitespace-nowrap text-slate-600">
                          {formatDate(claim.createdAt)}
                        </Td>
                        <Td>
                          <p className="font-medium text-slate-900">
                            {claim.customer?.fullName ??
                              `Customer ${claim.customerId.slice(0, 8)}`}
                          </p>
                          <p className="text-xs text-slate-500">
                            {methodLabel} • {claim.paymentNumber}
                            {claim.transactionRef
                              ? ` (Ref: ${claim.transactionRef})`
                              : ''}
                          </p>
                        </Td>
                        <Td className="text-slate-700">
                          {claim.serviceCategory?.name ??
                            claim.serviceCategoryId.slice(0, 8)}
                        </Td>
                        <Td className="whitespace-nowrap text-right font-semibold text-slate-900">
                          {formatMoney(claim.amount)}
                        </Td>
                        <Td>
                          <Badge tone={claimStatusTone(claim.status)}>
                            {CLAIM_STATUS_LABELS[claim.status]}
                          </Badge>
                        </Td>
                        <Td>
                          {isPending ? (
                            <input
                              type="text"
                              value={reviewNotes[claim.id] ?? ''}
                              onChange={(e) =>
                                setReviewNotes((prev) => ({
                                  ...prev,
                                  [claim.id]: e.target.value,
                                }))
                              }
                              placeholder="Optional note..."
                              className="w-40 rounded-md border border-slate-200 px-2.5 py-1 text-xs text-slate-700 focus:border-amber-400 focus:outline-none"
                            />
                          ) : (
                            <span className="text-xs text-slate-500">
                              {claim.reviewNote ?? '—'}
                            </span>
                          )}
                        </Td>
                        <Td className="whitespace-nowrap text-right">
                          {isPending ? (
                            <div className="inline-flex items-center gap-2">
                              <Button
                                size="sm"
                                disabled={reviewClaim.isPending}
                                onClick={() =>
                                  handleReviewClaim(claim, 'APPROVED')
                                }
                              >
                                <Check className="mr-1 h-3.5 w-3.5" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                disabled={reviewClaim.isPending}
                                onClick={() =>
                                  handleReviewClaim(claim, 'REJECTED')
                                }
                              >
                                <X className="mr-1 h-3.5 w-3.5" />
                                Reject
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">
                              Reviewed
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

      {activeTab === 'technician-payouts' && (
        <Card className="overflow-hidden">
          <div className="border-b border-slate-100 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-600">
                Record, edit, or remove completed job payments and disburse
                technician payouts.
              </p>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setShowCreateCompleted((prev) => !prev)}
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                {showCreateCompleted
                  ? 'Cancel'
                  : 'Record Completed Payment'}
              </Button>
            </div>

            {showCreateCompleted && (
              <form
                onSubmit={handleCreateCompleted}
                className="mt-4 grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-5"
              >
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Job ID
                  </label>
                  <input
                    type="text"
                    value={newJobId}
                    onChange={(e) => setNewJobId(e.target.value)}
                    placeholder="UUID of completed job"
                    className="h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Transaction Ref / Code
                  </label>
                  <input
                    type="text"
                    value={newExternalPaymentId}
                    onChange={(e) => setNewExternalPaymentId(e.target.value)}
                    placeholder="e.g. MOMO-123456"
                    className="h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Phone Number (+2507...)
                  </label>
                  <input
                    type="text"
                    value={newPhoneNumber}
                    onChange={(e) => setNewPhoneNumber(e.target.value)}
                    placeholder="+2507..."
                    className="h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Paid Date
                  </label>
                  <input
                    type="date"
                    value={newPaidAt}
                    onChange={(e) => setNewPaidAt(e.target.value)}
                    className="h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-sm"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={createCompletedPayment.isPending}
                    className="h-9 w-full"
                  >
                    Save Payment
                  </Button>
                </div>
              </form>
            )}
          </div>

          {completed.isError ? (
            <ErrorState
              message={completed.error.message}
              onRetry={() => completed.refetch()}
            />
          ) : !completed.isLoading && completedJobPayments.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="No completed job payments yet"
              description="Completed job payments eligible for technician payout will appear here."
            />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Date</Th>
                  <Th>Reference / Phone</Th>
                  <Th>Technician</Th>
                  <Th>Service</Th>
                  <Th className="text-right">Amount</Th>
                  <Th className="text-right">Payout & Actions</Th>
                </tr>
              </thead>
              <tbody>
                {completed.isLoading ? (
                  <TableSkeleton columns={6} />
                ) : (
                  completedJobPayments.map((payment) => {
                    const isEditing = editingPaymentId === payment.id;
                    const isDisbursed = Boolean(paidJobIds[payment.id]);
                    const techName = getAssignedTechnicianName(payment);

                    return (
                      <Tr key={payment.id}>
                        <Td className="whitespace-nowrap text-slate-600">
                          {isEditing ? (
                            <input
                              type="date"
                              value={editDraft.paidAt}
                              onChange={(e) =>
                                setEditDraft((prev) => ({
                                  ...prev,
                                  paidAt: e.target.value,
                                }))
                              }
                              className="h-8 rounded border border-slate-300 px-2 text-xs"
                            />
                          ) : (
                            formatDate(payment.paidAt)
                          )}
                        </Td>
                        <Td>
                          {isEditing ? (
                            <div className="space-y-1">
                              <input
                                type="text"
                                value={editDraft.externalPaymentId}
                                onChange={(e) =>
                                  setEditDraft((prev) => ({
                                    ...prev,
                                    externalPaymentId: e.target.value,
                                  }))
                                }
                                className="h-8 w-full rounded border border-slate-300 px-2 text-xs"
                              />
                              <input
                                type="text"
                                value={editDraft.phoneNumber}
                                onChange={(e) =>
                                  setEditDraft((prev) => ({
                                    ...prev,
                                    phoneNumber: e.target.value,
                                  }))
                                }
                                className="h-8 w-full rounded border border-slate-300 px-2 text-xs"
                              />
                            </div>
                          ) : (
                            <>
                              <p className="font-medium text-slate-900">
                                {payment.externalPaymentId}
                              </p>
                              <p className="text-xs text-slate-500">
                                {payment.phoneNumber}
                              </p>
                            </>
                          )}
                        </Td>
                        <Td className="font-medium text-slate-800">{techName}</Td>
                        <Td className="text-slate-600">
                          {payment.serviceCategory.name}
                        </Td>
                        <Td className="whitespace-nowrap text-right font-semibold text-slate-900">
                          {formatMoney(payment.amount)}
                        </Td>
                        <Td className="whitespace-nowrap text-right">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            {isEditing ? (
                              <>
                                <Button
                                  size="sm"
                                  disabled={updateCompletedPayment.isPending}
                                  onClick={() => handleSaveCompletedEdit(payment)}
                                >
                                  <Check className="mr-1 h-3.5 w-3.5" />
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={cancelEditingCompleted}
                                >
                                  Cancel
                                </Button>
                              </>
                            ) : (
                              <>
                                {isDisbursed ? (
                                  <Badge tone="success">Disbursed</Badge>
                                ) : (
                                  <Button
                                    size="sm"
                                    onClick={() => handleDisbursePayout(payment)}
                                  >
                                    <Send className="mr-1 h-3.5 w-3.5" />
                                    Disburse
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => startEditingCompleted(payment)}
                                  aria-label="Edit completed payment"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  disabled={deleteCompletedPayment.isPending}
                                  onClick={() => handleDeleteCompleted(payment)}
                                  aria-label="Delete completed payment"
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-red-600" />
                                </Button>
                              </>
                            )}
                          </div>
                        </Td>
                      </Tr>
                    );
                  })
                )}
              </tbody>
            </Table>
          )}
          {completed.data && !completed.isError && <Pagination page={completed.data.pagination.page} pageSize={completed.data.pagination.limit} total={completed.data.pagination.total} disabled={completed.isFetching} onPageChange={setCompletedPage} />}
        </Card>
      )}

      {activeTab === 'staff-payroll' && (
        <Card className="overflow-hidden">
          <div className="border-b border-slate-100 p-4">
            <p className="text-sm text-slate-600">
              Review administrative staff and record monthly salary disbursements.
            </p>
          </div>

          {!isStaffLoading && (staffData?.items.length ?? 0) === 0 ? (
            <EmptyState
              icon={Users}
              title="No staff members found"
              description="Administrative staff accounts will appear here for payroll."
            />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Staff Member</Th>
                  <Th>Role</Th>
                  <Th>Contact</Th>
                  <Th className="text-right">Payroll Status</Th>
                </tr>
              </thead>
              <tbody>
                {isStaffLoading ? (
                  <TableSkeleton columns={4} />
                ) : (
                  (staffData?.items ?? []).map((member) => {
                    const staffRecord = member as {
                      id: string;
                      fullName?: string;
                      name?: string;
                      email?: string;
                      phoneNumber?: string;
                      phone?: string;
                      staffRole?: UserRole;
                      role?: UserRole;
                    };
                    const displayName =
                      staffRecord.fullName?.trim() ||
                      staffRecord.name?.trim() ||
                      staffRecord.email?.trim() ||
                      'Staff Member';
                    const roleKey = (staffRecord.staffRole ??
                      staffRecord.role ??
                      'ADMIN') as UserRole;
                    const roleLabel = USER_ROLE_LABELS[roleKey] ?? roleKey;
                    const contact =
                      staffRecord.phoneNumber ||
                      staffRecord.phone ||
                      staffRecord.email ||
                      '—';
                    const paidAt = paidStaffIds[staffRecord.id];

                    return (
                      <Tr key={staffRecord.id}>
                        <Td>
                          <div className="flex items-center gap-2.5">
                            <Avatar name={displayName} size="sm" />
                            <span className="font-medium text-slate-900">
                              {displayName}
                            </span>
                          </div>
                        </Td>
                        <Td>
                          <Badge tone="info">{roleLabel}</Badge>
                        </Td>
                        <Td className="text-xs text-slate-600">{contact}</Td>
                        <Td className="whitespace-nowrap text-right">
                          {paidAt ? (
                            <Badge tone="success">
                              Paid {formatDate(paidAt)}
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() =>
                                handlePayStaff(
                                  staffRecord.id,
                                  displayName,
                                  roleLabel,
                                )
                              }
                            >
                              <Banknote className="mr-1 h-3.5 w-3.5" />
                              Record Salary
                            </Button>
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
    </RoleGuard>
  );
}
