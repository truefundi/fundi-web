'use client';

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import {
  paymentsApi,
  type BookingPayment,
  type CreateCompletedPaymentInput,
  type ExtendPaymentInput,
  type PaymentClaim,
  type PaymentClaimStatus,
  type ReviewPaymentClaimInput,
  type UpdateCompletedPaymentInput,
  type PaymentFilters,
  type PaymentQuery,
} from '@/lib/api/endpoints/payments';
import type { AdminPage } from '@/types/api';

export const paymentKeys = {
  all: ['payments'] as const,
  list: (query: PaymentQuery) => ['payments', 'list', query] as const,
  summary: (filters: PaymentFilters) => ['payments', 'summary', filters] as const,
  claims: (status?: PaymentClaimStatus | 'ALL') =>
    ['payments', 'claims', status ?? 'ALL'] as const,
};

export function usePayments(query: PaymentQuery = {}, enabled = true) {
  return useQuery({
    queryKey: paymentKeys.list(query),
    queryFn: ({ signal }) => paymentsApi.list(query, signal),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function usePaymentSummary(filters: PaymentFilters = {}) {
  return useQuery({
    queryKey: paymentKeys.summary(filters),
    queryFn: ({ signal }) => paymentsApi.summary(filters, signal),
    staleTime: 15_000,
  });
}

export function usePaymentClaims(status?: PaymentClaimStatus, enabled = true) {
  return useQuery({
    queryKey: paymentKeys.claims(status ?? 'ALL'),
    queryFn: ({ signal }) => paymentsApi.listClaims(status, signal),
    enabled,
  });
}

/** Aggregates change even when the visible row can be patched in place. */
function invalidatePaymentAggregates(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ['payments', 'summary'] }),
    queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
  ]);
}

function patchPayment(
  queryClient: QueryClient,
  updated: BookingPayment,
): void {
  queryClient.setQueriesData<AdminPage<BookingPayment>>(
    { queryKey: ['payments', 'list'] as const },
    (page) =>
      page
        ? {
            ...page,
            data: page.data.map((row) =>
              row.id === updated.id ? updated : row,
            ),
          }
        : page,
  );
}

function removePayment(queryClient: QueryClient, paymentId: string): void {
  queryClient.setQueriesData<AdminPage<BookingPayment>>(
    { queryKey: ['payments', 'list'] as const },
    (page) =>
      page
        ? {
            ...page,
            data: page.data.filter((row) => row.id !== paymentId),
            pagination: {
              ...page.pagination,
              total: Math.max(0, page.pagination.total - 1),
            },
          }
        : page,
  );
}

function patchClaim(queryClient: QueryClient, updated: PaymentClaim): void {
  queryClient.setQueriesData<PaymentClaim[]>(
    { queryKey: ['payments', 'claims'] as const },
    (rows) =>
      rows?.map((row) => (row.id === updated.id ? updated : row)) ?? rows,
  );
}

export function invalidatePaymentDependents(queryClient: QueryClient) {
  return Promise.all(
    ['payments', 'jobs', 'dashboard'].map((key) =>
      queryClient.invalidateQueries({ queryKey: [key] }),
    ),
  );
}

export function useReviewPaymentClaim() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      claimId,
      ...body
    }: { claimId: string } & ReviewPaymentClaimInput) =>
      paymentsApi.reviewClaim(claimId, body),
    onSuccess: (claim) => {
      patchClaim(queryClient, claim);
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: ['payments', 'list'] as const }),
        invalidatePaymentAggregates(queryClient),
      ]);
    },
  });
}

export function useExtendPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      paymentId,
      days,
    }: { paymentId: string } & ExtendPaymentInput) =>
      paymentsApi.extend(paymentId, { days }),
    onSuccess: (payment) => {
      patchPayment(queryClient, payment);
      void invalidatePaymentAggregates(queryClient);
    },
  });
}

export function useCreateCompletedPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateCompletedPaymentInput) =>
      paymentsApi.createCompleted(body),
    onSuccess: () => {
      // A new row affects sorting and totals, so fetch the list once.
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: ['payments', 'list'] as const }),
        invalidatePaymentAggregates(queryClient),
      ]);
    },
  });
}

export function useUpdateCompletedPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      paymentId,
      ...body
    }: { paymentId: string } & UpdateCompletedPaymentInput) =>
      paymentsApi.updateCompleted(paymentId, body),
    onSuccess: (payment) => {
      patchPayment(queryClient, payment);
      void invalidatePaymentAggregates(queryClient);
    },
  });
}

export function useDeleteCompletedPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (paymentId: string) => paymentsApi.deleteCompleted(paymentId),
    onSuccess: (_, paymentId) => {
      removePayment(queryClient, paymentId);
      void invalidatePaymentAggregates(queryClient);
    },
  });
}
