import { api, unwrap } from '../client';

export type BookingPaymentStatus =
  | 'VALID'
  | 'EXPIRED'
  | 'PAUSED'
  | 'RESUMED'
  | 'COMPLETED';

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

export const paymentsApi = {
  list(): Promise<BookingPayment[]> {
    return unwrap(api.get<BookingPayment[]>('/admin/payments'));
  },
};