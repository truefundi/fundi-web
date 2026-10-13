'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Banknote, CreditCard, Percent, Wallet } from 'lucide-react';
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
import { usePaymentJobs } from '@/hooks/useJobs';
import { formatMoney, repairTotal, visitFeeSplit } from '@/lib/jobs';
import { formatDate } from '@/lib/utils';
import type { Job, PaymentMethod, SettlementMethod } from '@/types/job';
import { useCommissionSettings } from '@/context/CommissionSettingsContext';

type PaymentStatus = 'paid' | 'pending';
type PaymentKind = 'Visit fee' | 'Repair balance';
type PaymentMethodFilter = PaymentMethod | SettlementMethod | '';

interface PaymentRecord {
  id: string;
  jobId: string;
  reference: string;
  customer: string;
  technician?: string;
  kind: PaymentKind;
  method?: PaymentMethod | SettlementMethod;
  amount: number;
  status: PaymentStatus;
  at: string;
}

const PAGE_SIZE = 10;
const PAYMENT_METHODS: Exclude<PaymentMethodFilter, ''>[] = [
  'Card',
  'Mobile Money',
  'Fundi Wallet',
  'Fundi',
  'Cash',
  'Other',
];

function repairBalance(job: Job): number {
  return Math.max(repairTotal(job) - job.visitFee, 0);
}

function getPaymentDate(job: Job, status: 'VISIT_PAID' | 'PAYMENT_REPORTED'): string {
  return job.events.find((event) => event.status === status)?.at ?? job.updatedAt;
}

function getPaymentRecords(jobs: Job[]): PaymentRecord[] {
  const records: PaymentRecord[] = [];

  for (const job of jobs) {
    if (job.visitPaymentMethod) {
      records.push({
        id: `${job.id}-visit`,
        jobId: job.id,
        reference: job.reference,
        customer: job.customer.name,
        technician: job.technician?.name,
        kind: 'Visit fee',
        method: job.visitPaymentMethod,
        amount: job.visitFee,
        status: 'paid',
        at: getPaymentDate(job, 'VISIT_PAID'),
      });
    }

    const balance = repairBalance(job);
    if (job.settlementMethod) {
      records.push({
        id: `${job.id}-repair`,
        jobId: job.id,
        reference: job.reference,
        customer: job.customer.name,
        technician: job.technician?.name,
        kind: 'Repair balance',
        method: job.settlementMethod,
        amount: balance,
        status: 'paid',
        at: getPaymentDate(job, 'PAYMENT_REPORTED'),
      });
    } else if (job.status === 'PAYMENT_PENDING' && balance > 0) {
      records.push({
        id: `${job.id}-repair`,
        jobId: job.id,
        reference: job.reference,
        customer: job.customer.name,
        technician: job.technician?.name,
        kind: 'Repair balance',
        amount: balance,
        status: 'pending',
        at: job.updatedAt,
      });
    }
  }

  return records.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
}

export function PaymentsView() {
  const router = useRouter();
  const { commissionRatePercent } = useCommissionSettings();
  const { data: jobs, isLoading, isError, error, refetch, isFetching } = usePaymentJobs();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | PaymentStatus>('all');
  const [method, setMethod] = useState<PaymentMethodFilter>('');
  const [page, setPage] = useState(1);

  const records = useMemo(() => getPaymentRecords(jobs ?? []), [jobs]);
  const stats = useMemo(() => {
    const paid = records.filter((record) => record.status === 'paid');
    const viaFundi = paid
      .filter((record) => record.kind === 'Visit fee' || record.method === 'Fundi')
      .reduce((sum, record) => sum + record.amount, 0);
    const direct = paid
      .filter((record) => record.kind === 'Repair balance' && record.method !== 'Fundi')
      .reduce((sum, record) => sum + record.amount, 0);
    const commission = (jobs ?? [])
      .filter((job) => job.visitPaymentMethod)
      .reduce((sum, job) => sum + visitFeeSplit(job, commissionRatePercent / 100).fundi, 0);
    const pending = records
      .filter((record) => record.status === 'pending')
      .reduce((sum, record) => sum + record.amount, 0);

    return { viaFundi, direct, commission, pending };
  }, [commissionRatePercent, jobs, records]);

  const filteredRecords = useMemo(() => {
    const term = search.trim().toLowerCase();
    return records.filter((record) => {
      const matchesSearch =
        !term ||
        [record.reference, record.customer, record.technician ?? '', record.kind]
          .some((value) => value.toLowerCase().includes(term));
      return (
        matchesSearch &&
        (status === 'all' || record.status === status) &&
        (!method || record.method === method)
      );
    });
  }, [method, records, search, status]);

  const pageCount = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visibleRecords = filteredRecords.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const updateSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <>
      <PageHeader
        title="Payments"
        description="Track visit fees, repair settlements, and balances awaiting payment."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Paid through Fundi"
          value={isError ? '—' : formatMoney(stats.viaFundi)}
          hint="Visit fees and Fundi repair settlements"
          icon={CreditCard}
          loading={isLoading}
        />
        <StatCard
          label="Direct repair settlements"
          value={isError ? '—' : formatMoney(stats.direct)}
          hint="Cash, mobile money, or other"
          icon={Banknote}
          loading={isLoading}
        />
        <StatCard
          label="Awaiting repair payment"
          value={isError ? '—' : formatMoney(stats.pending)}
          hint="Jobs marked payment pending"
          icon={Wallet}
          loading={isLoading}
        />
        <StatCard
          label="Fundi visit-fee commission"
          value={isError ? '—' : formatMoney(stats.commission)}
          hint={`${commissionRatePercent}% of recorded visit fees`}
          icon={Percent}
          loading={isLoading}
        />
      </div>

      <Card className={isFetching && !isLoading ? 'opacity-70 transition-opacity' : undefined}>
        <div className="space-y-3 border-b border-slate-100 p-4">
          <div className="flex flex-col gap-3 md:flex-row">
            <SearchInput
              value={search}
              onChange={updateSearch}
              placeholder="Search by job reference, customer, or technician"
              className="md:flex-1"
            />
            <Select
              value={method}
              onChange={(event) => {
                setMethod(event.target.value as PaymentMethodFilter);
                setPage(1);
              }}
              aria-label="Filter by payment method"
              className="md:w-56"
            >
              <option value="">All payment methods</option>
              {PAYMENT_METHODS.map((paymentMethod) => (
                <option key={paymentMethod} value={paymentMethod}>
                  {paymentMethod}
                </option>
              ))}
            </Select>
            <Select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as 'all' | PaymentStatus);
                setPage(1);
              }}
              aria-label="Filter by payment status"
              className="md:w-44"
            >
              <option value="all">All statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
            </Select>
          </div>
        </div>

        {isError ? (
          <ErrorState message={error.message} onRetry={() => refetch()} />
        ) : !isLoading && filteredRecords.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title={records.length === 0 ? 'No payment records yet' : 'No payments found'}
            description={
              records.length === 0
                ? 'Visit-fee payments and repair settlements will appear here when recorded on a job.'
                : 'Try changing your search or filters.'
            }
          />
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>Date</Th>
                  <Th>Job and customer</Th>
                  <Th>Payment</Th>
                  <Th>Method</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Amount</Th>
                </tr>
              </thead>
              <tbody>
                {isLoading || !jobs ? (
                  <TableSkeleton columns={6} />
                ) : (
                  visibleRecords.map((record) => (
                    <Tr
                      key={record.id}
                      onClick={() => router.push(`/admin/jobs/${record.jobId}`)}
                      label={`Open job ${record.reference}`}
                    >
                      <Td className="whitespace-nowrap text-slate-600">{formatDate(record.at)}</Td>
                      <Td>
                        <p className="font-medium text-slate-900">{record.reference}</p>
                        <p className="text-xs text-slate-500">{record.customer}</p>
                        {record.technician && (
                          <p className="text-xs text-slate-400">Technician: {record.technician}</p>
                        )}
                      </Td>
                      <Td className="whitespace-nowrap text-slate-600">{record.kind}</Td>
                      <Td className="whitespace-nowrap text-slate-600">{record.method ?? '—'}</Td>
                      <Td>
                        <Badge tone={record.status === 'paid' ? 'success' : 'warning'}>
                          {record.status === 'paid' ? 'Paid' : 'Pending'}
                        </Badge>
                      </Td>
                      <Td className="whitespace-nowrap text-right font-semibold text-slate-900">
                        {formatMoney(record.amount)}
                      </Td>
                    </Tr>
                  ))
                )}
              </tbody>
            </Table>
            {filteredRecords.length > 0 && (
              <Pagination
                page={currentPage}
                pageSize={PAGE_SIZE}
                total={filteredRecords.length}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </Card>

      <p className="mt-3 text-xs text-slate-500">
        Records are derived from job payment details; provider transaction IDs and refunds are not available here.
      </p>
      {!isLoading && !isError && records.length > 0 && filteredRecords.length === 0 && (
        <div className="mt-3 flex justify-center">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setSearch('');
              setStatus('all');
              setMethod('');
              setPage(1);
            }}
          >
            Clear filters
          </Button>
        </div>
      )}
    </>
  );
}
