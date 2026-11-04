
import type { Job, JobParty, JobStatus, Urgency } from '@/types/job';

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

export function mapBackendJob(job: BackendJob): Job {
  const customer: JobParty = {
    id: job.customer?.id ?? '',
    name: job.customer?.fullName ?? 'Unknown customer',
    phone: job.customer?.phoneNumber ?? '',
  };

  const technician: JobParty | undefined = job.currentTechnician
    ? {
        id: job.currentTechnician.id,
        name: job.currentTechnician.fullName,
        phone: '',
      }
    : undefined;

  return {
    id: job.id,
    reference: job.id,
    service: job.service ?? 'Unspecified service',
    problem: job.description ?? '',
    urgency: mapUrgency(job.priority),
    location: job.location?.address ?? '',
    customer,
    technician,
    status: statusMap[job.status],
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    visitFee: 0,
    completedAt: job.completedAt ?? undefined,
    cancellationReason: job.cancellationReason ?? undefined,
    events: [],
  };
}
