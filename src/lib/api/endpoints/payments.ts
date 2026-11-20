import { api, unwrap } from '../client';

export type BookingPaymentStatus =
  | 'VALID'
  | 'EXPIRED'
  | 'PAUSED'
  | 'RESUMED'
  | 'COMPLETED';

export type PaymentClaimStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type PaymentClaimMethod = 'MTN' | 'AIRTEL' | string;

export interface BookingPayment {
  id: string;
  customerId: string;
  serviceCategoryId: string;
  jobId: string | null;
  externalPaymentId: string;
  phoneNumber: string;
  amount: number;
  status: BookingPaymentStatus;
  paidAt: string;
  validUntil: string;
  remainingValiditySeconds: number | null;
  extensionCount: number;
  createdAt: string;
  updatedAt: string;
  currency: string;

  customer: {
    id: string;
    fullName: string;
    phoneNumber: string;
  };

  serviceCategory: {
    id: string;
    name: string;
    slug: string;
  };

  job: {
    id: string;
    status: string;
    description: string;
    createdAt: string;
    completedAt: string | null;
    assignmentHistory: {
      technicianId: string;
      technicianName: string;
      acceptedAt: string;
      endedAt: string | null;
      endReason: string | null;
      reason: string | null;
    }[];
  } | null;
}

export interface PaymentClaim {
  id: string;
  customerId: string;
  serviceCategoryId: string;
  requestType?: string | null;
  amount: number;
  paymentMethod: PaymentClaimMethod;
  paymentNumber: string;
  status: PaymentClaimStatus;
  reviewNote: string | null;
  reviewedById: string | null;
  reviewedAt: string | null;
  bookingPaymentId: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    fullName: string;
    phoneNumber: string;
  };
  serviceCategory?: {
    id: string;
    name: string;
    slug: string;
  };
  bookingPayment?: {
    id: string;
    status: BookingPaymentStatus | string;
  } | null;
}

export interface ExtendPaymentInput {
  days: number;
}

export interface CreateCompletedPaymentInput {
  jobId: string;
  externalPaymentId: string;
  phoneNumber: string;
  paidAt: string;
}

export interface UpdateCompletedPaymentInput {
  externalPaymentId?: string;
  phoneNumber?: string;
  paidAt?: string;
}

export interface ReviewPaymentClaimInput {
  status: Extract<PaymentClaimStatus, 'APPROVED' | 'REJECTED'>;
  reviewNote?: string;
}

export const paymentsApi = {
  list(): Promise<BookingPayment[]> {
    return unwrap(api.get<BookingPayment[]>('/admin/payments'));
  },

  extend(paymentId: string, body: ExtendPaymentInput): Promise<BookingPayment> {
    return unwrap(
      api.patch<BookingPayment>(`/admin/payments/${paymentId}/extend`, body),
    );
  },

  listCompleted(): Promise<BookingPayment[]> {
    return unwrap(api.get<BookingPayment[]>('/admin/payments/completed'));
  },

  createCompleted(
    body: CreateCompletedPaymentInput,
  ): Promise<BookingPayment> {
    return unwrap(
      api.post<BookingPayment>('/admin/payments/completed', body),
    );
  },

  updateCompleted(
    paymentId: string,
    body: UpdateCompletedPaymentInput,
  ): Promise<BookingPayment> {
    return unwrap(
      api.patch<BookingPayment>(
        `/admin/payments/completed/${paymentId}`,
        body,
      ),
    );
  },

  deleteCompleted(
    paymentId: string,
  ): Promise<{ id: string; deleted?: boolean }> {
    return unwrap(
      api.delete<{ id: string; deleted?: boolean }>(
        `/admin/payments/completed/${paymentId}`,
      ),
    );
  },

listClaims(status?: PaymentClaimStatus): Promise<PaymentClaim[]> {
    const query = status
      ? `?${new URLSearchParams({ status }).toString()}`
      : '';
    return unwrap(api.get<PaymentClaim[]>(`/admin/payment-claims${query}`));
  },

  reviewClaim(
    claimId: string,
    body: ReviewPaymentClaimInput,
  ): Promise<PaymentClaim> {
    return unwrap(
      api.patch<PaymentClaim>(
        `/admin/payment-claims/${claimId}/review`,
        body,
      ),
    );
  },

  deleteClaim(claimId: string): Promise<{ id: string; deleted?: boolean }> {
    return unwrap(
      api.delete<{ id: string; deleted?: boolean }>(
        `/admin/payment-claims/${claimId}`,
      ),
    );
  },
};