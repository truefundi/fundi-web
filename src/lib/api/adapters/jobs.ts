import type { DisputeOutcome, Job, JobParty, JobStatus, Urgency } from '@/types/job';

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
  PAUSED: 'REPAIR_IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  FAILED: 'CANCELLED',
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

export function mapBackendJob(job: BackendJob | any): Job {
  if (!job) {
    return {
      id: '',
      reference: '',
      service: 'Unspecified service',
      problem: '',
      urgency: 'Schedule',
      location: '',
      customer: { id: '', name: '—', phone: '' },
      status: 'REQUESTED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      visitFee: 0,
      events: [],
    };
  }

  // Already a mapped Job
  if ('customer' in job && 'events' in job && 'problem' in job) {
    return job as Job;
  }

  const customer: JobParty = {
    id: job.customer?.id ?? '',
    name: job.customer?.fullName ?? job.customer?.name ?? 'Unknown customer',
    phone: job.customer?.phoneNumber ?? job.customer?.phone ?? '',
  };

  const technician: JobParty | undefined = job.currentTechnician
    ? {
        id: job.currentTechnician.id,
        name: job.currentTechnician.fullName || job.currentTechnician.name || 'Technician',
        phone: job.currentTechnician.phoneNumber || job.currentTechnician.phone || '',
      }
    : job.technician
      ? {
          id: job.technician.id,
          name: job.technician.fullName || job.technician.name || 'Technician',
          phone: job.technician.phoneNumber || job.technician.phone || '',
        }
      : undefined;

  const dispute = job.dispute
    ? {
        reason: job.dispute.reason,
        openedBy: (job.dispute.openedBy?.toLowerCase?.() === 'technician' ? 'technician' : 'customer') as 'customer' | 'technician',
        openedAt: typeof job.dispute.openedAt === 'string' ? job.dispute.openedAt : new Date().toISOString(),
        resolution: job.dispute.resolution
          ? {
              outcome: mapDisputeOutcome(job.dispute.resolution.outcome),
              amount: job.dispute.resolution.amount ?? 0,
              note: job.dispute.resolution.note ?? '',
              resolvedAt: typeof job.dispute.resolution.resolvedAt === 'string' ? job.dispute.resolution.resolvedAt : new Date().toISOString(),
              resolvedBy: job.dispute.resolution.resolvedBy ?? 'Admin',
            }
          : undefined,
      }
    : undefined;

  return {
    id: job.id,
    reference: job.id,
    service: job.service ?? 'Unspecified service',
    problem: job.description ?? job.problem ?? '',
    urgency: mapUrgency(job.priority),
    location: job.location?.address ?? job.location ?? '',
    customer,
    technician,
    status: statusMap[job.status as BackendJob['status']] ?? job.status ?? 'REQUESTED',
    createdAt: typeof job.createdAt === 'string' ? job.createdAt : new Date().toISOString(),
    updatedAt: typeof job.updatedAt === 'string' ? job.updatedAt : new Date().toISOString(),
    visitFee: 0,
    completedAt: job.completedAt ?? undefined,
    cancellationReason: job.cancellationReason ?? undefined,
    dispute,
    events: [],
  };
}
