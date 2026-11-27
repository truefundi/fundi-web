
import type {
  BookingPaymentStatus,
  DisputeOutcome,
  Job,
  JobListItem,
  JobParty,
  JobStatus,
  Urgency,
  Rating,
} from '@/types/job';

export type BackendJobListItem = Omit<BackendJob, 'dispute'> & {
  dispute?: { id: string; resolvedAt: string | null } | null;
};

export function mapBackendJobListItem(row: BackendJobListItem): JobListItem {
  // Never pass the summary dispute through the full-detail dispute mapper.
  const mapped = mapBackendJob({ ...row, dispute: undefined });
  return {
    id: mapped.id,
    reference: mapped.reference,
    service: mapped.service,
    problem: mapped.problem,
    urgency: mapped.urgency,
    location: mapped.location,
    customer: mapped.customer,
    technician: mapped.technician,
    status: mapped.status,
    bookingPaymentStatus: row.bookingPayment ? 'PAID' : 'PENDING',
    bookingFee: mapped.bookingFee,
    currency: mapped.currency,
    createdAt: mapped.createdAt,
    updatedAt: mapped.updatedAt,
    completedAt: mapped.completedAt,
    latitude: mapped.latitude,
    longitude: mapped.longitude,
    offeredAmount: mapped.offeredAmount,
    visitFee: mapped.visitFee,
    dispute: row.dispute ?? null,
  };
}

/** A list row is enough to paint the detail shell while the full record loads. */
export function jobListItemToJob(item: JobListItem): Job {
  return {
    id: item.id,
    reference: item.reference,
    service: item.service,
    problem: item.problem,
    urgency: item.urgency,
    location: item.location,
    customer: item.customer,
    technician: item.technician,
    status: item.status,
    bookingPaymentStatus: item.bookingPaymentStatus,
    bookingFee: item.bookingFee,
    currency: item.currency,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    completedAt: item.completedAt,
    latitude: item.latitude,
    longitude: item.longitude,
    offeredAmount: item.offeredAmount,
    visitFee: item.visitFee,
    events: [],
  };
}

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
