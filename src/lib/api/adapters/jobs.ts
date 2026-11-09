import type { DisputeOutcome, Job, JobParty, JobStatus, Urgency, Rating } from '@/types/job';

export type BackendJob = {
  id: string;
  service?: string | null;
  description?: string | null;
  location?: {
    address?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  } | null;
  offeredAmount?: number | null;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'ASSIGNED' | 'PAUSED' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
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

const statusMap: Record<BackendJob['status'], JobStatus> = {
  OPEN: 'REQUESTED',
  ASSIGNED: 'ACCEPTED',
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
};

function mapUrgency(priority?: BackendJob['priority']): Urgency {
  switch (priority) {
    case 'URGENT':
      return 'Emergency';
    case 'HIGH':
      return 'Today';
    default:
      return 'Schedule';
  }
}

function mapDisputeOutcome(outcome?: string): DisputeOutcome {
  if (outcome === 'CUSTOMER' || outcome === 'customer') return 'customer';
  if (outcome === 'TECHNICIAN' || outcome === 'technician') return 'technician';
  return 'partial';
}

export function mapBackendJob(job: BackendJob): Job {
  const customer: JobParty = {
    id: job.customer?.id ?? '', name: job.customer?.fullName ?? 'Unknown customer',
    phone: job.customer?.phoneNumber ?? '',
  };
  return {
    id: job.id, reference: job.id, service: job.service ?? 'Unspecified service',
    problem: job.description ?? '', urgency: mapUrgency(job.priority),
    location: job.location?.address ?? '', customer,
    latitude: job.location?.latitude ?? undefined,
    longitude: job.location?.longitude ?? undefined,
    offeredAmount: job.offeredAmount ?? undefined,
    technician: job.currentTechnician ? {
      id: job.currentTechnician.id, name: job.currentTechnician.fullName, phone: '',
    } : undefined,
    status: statusMap[job.status], createdAt: job.createdAt, updatedAt: job.updatedAt,
    visitFee: job.bookingPayment?.amount ?? 0,
    completedAt: job.completedAt ?? undefined,
    cancellationReason: job.cancellationReason ?? undefined,
    rating: job.rating ?? undefined,
    dispute: job.dispute ? {
      reason: job.dispute.reason,
      openedBy: job.dispute.openedBy.toLowerCase() === 'technician' ? 'technician' : 'customer',
      openedAt: job.dispute.openedAt,
      resolution: job.dispute.resolution ? {
        ...job.dispute.resolution,
        outcome: mapDisputeOutcome(job.dispute.resolution.outcome),
        resolvedBy: job.dispute.resolution.resolvedBy ?? 'Admin',
      } : undefined,
    } : undefined,
    events: [],
  };
}
