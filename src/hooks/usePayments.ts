'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  paymentsApi,
  type CreateCompletedPaymentInput,
  type ExtendPaymentInput,
  type PaymentClaimStatus,
  type ReviewPaymentClaimInput,
  type UpdateCompletedPaymentInput,
} from '@/lib/api/endpoints/payments';

export const paymentKeys = {
  all: ['payments'] as const,
  list: ['payments', 'list'] as const,
  completed: ['payments', 'completed'] as const,
  claims: (status?: PaymentClaimStatus | 'ALL') =>
    ['payments', 'claims', status ?? 'ALL'] as const,
};

export function usePayments() {
  return useQuery({
    queryKey: paymentKeys.list,
    queryFn: paymentsApi.list,
  });
}

export function useCompletedPayments() {
  return useQuery({
    queryKey: paymentKeys.completed,
    queryFn: paymentsApi.listCompleted,
  });
}

export function usePaymentClaims(status?: PaymentClaimStatus) {
  return useQuery({
    queryKey: paymentKeys.claims(status ?? 'ALL'),
    queryFn: () => paymentsApi.listClaims(status),
  });
}

export function useReviewPaymentClaim() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      claimId,
      ...body
    }: { claimId: string } & ReviewPaymentClaimInput) =>
      paymentsApi.reviewClaim(claimId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: paymentKeys.all });
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
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: paymentKeys.all });
    },
  });
}

export function useCreateCompletedPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateCompletedPaymentInput) =>
      paymentsApi.createCompleted(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: paymentKeys.all });
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
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: paymentKeys.all });
    },
  });
}

export function useDeleteCompletedPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (paymentId: string) => paymentsApi.deleteCompleted(paymentId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: paymentKeys.all });
    },
  });
}