
import type {
  BookingPaymentStatus,
  DisputeOutcome,
  Job,
  JobParty,
  JobStatus,
  Urgency,
  Rating,
} from '@/types/job';

export type BackendJob = {
  id: string;
  reference?: string;
  service?: string | null;
  description?: string | null;
  location?: {
    address?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  } | null;
  offeredAmount?: number | null;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  status: JobStatus;
  bookingPaymentStatus?: BookingPaymentStatus;
  bookingFee?: number | null;
  currency?: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
  rating?: Rating | null;
  bookingPayment?: { amount: number } | null;
  cancellationReason?: string | null;
  customer?: {
    id: string;
    fullName: string;
    phoneNumber?: string | null;
    email?: string | null;
  } | null;
  currentTechnician?: {
    id: string;
    fullName: string;
  } | null;
  dispute?: {
    reason: string;
    openedBy: string;
    openedAt: string;
    resolution?: {
      outcome: string;
      amount: number;
      note: string;
      resolvedAt: string;
      resolvedBy?: string | null;
    };
  } | null;
};

function mapUrgency(priority?: BackendJob['priority']): Urgency {
  return priority ?? 'NORMAL';
}

function mapDisputeOutcome(outcome?: string): DisputeOutcome {
  if (outcome === 'CUSTOMER' || outcome === 'customer') return 'customer';
  if (outcome === 'TECHNICIAN' || outcome === 'technician') return 'technician';
  return 'partial';
}

export function mapBackendJob(job: BackendJob): Job {
  const customer: JobParty = {
    id: job.customer?.id ?? '',
    name: job.customer?.fullName ?? 'Unknown customer',
    phone: job.customer?.phoneNumber ?? '',
  };

  const bookingFee = job.bookingFee ?? job.bookingPayment?.amount ?? 0;

  return {
    id: job.id,
    reference: job.reference ?? job.id,
    service: job.service ?? 'Unspecified service',
    problem: job.description ?? '',
    urgency: mapUrgency(job.priority),
    location: job.location?.address ?? '',
    customer,
    latitude: job.location?.latitude ?? undefined,
    longitude: job.location?.longitude ?? undefined,
    offeredAmount: job.offeredAmount ?? undefined,
    technician: job.currentTechnician
      ? {
          id: job.currentTechnician.id,
          name: job.currentTechnician.fullName,
          phone: '',
        }
      : undefined,
    status: job.status,
    bookingPaymentStatus: job.bookingPaymentStatus ?? 'PAID',
    bookingFee,
    currency: job.currency ?? 'RWF',
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    visitFee: bookingFee,
    completedAt: job.completedAt ?? undefined,
    cancellationReason: job.cancellationReason ?? undefined,
    rating: job.rating ?? undefined,
    dispute: job.dispute
      ? {
          reason: job.dispute.reason,
          openedBy:
            job.dispute.openedBy.toLowerCase() === 'technician'
              ? 'technician'
              : 'customer',
          openedAt: job.dispute.openedAt,
          resolution: job.dispute.resolution
            ? {
                ...job.dispute.resolution,
                outcome: mapDisputeOutcome(job.dispute.resolution.outcome),
                resolvedBy: job.dispute.resolution.resolvedBy ?? 'Admin',
              }
            : undefined,
        }
      : undefined,
    events: [],
  };
}
