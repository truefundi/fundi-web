import type { ServiceCategory } from '@/config/services';
import type { Account } from './customer';

/** Mirrors mobile WorkStatus (none | pending | verified) plus admin-only `rejected`. */
export type VerificationStatus = 'not_submitted' | 'pending' | 'verified' | 'rejected';

export const VERIFICATION_LABEL: Record<VerificationStatus, string> = {
  not_submitted: 'Not submitted',
  pending: 'Under review',
  verified: 'Verified',
  rejected: 'Rejected',
};

export type WorkHours = 'mornings' | 'days' | 'evenings' | 'always';

export const WORK_HOURS_LABEL: Record<WorkHours, string> = {
  mornings: 'Mornings',
  days: 'Daytime',
  evenings: 'Evenings',
  always: 'Any time',
};

export interface TechnicianVerification {
  status: VerificationStatus;
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  idDocumentUrl?: string;
  certificateUrls: string[];
}

/** Mirrors mobile WorkSettings (constants/work.ts). */
export interface WorkSettings {
  radiusKm: number;
  maxJobsPerDay: number;
  hours: WorkHours;
}

export interface Technician extends Account {
  trades: ServiceCategory[];
  yearsExperience: number;
  rating: number;
  jobsCompleted: number;
  isAvailable: boolean;
  verification: TechnicianVerification;
  workSettings: WorkSettings;
}

/** Fields an admin may edit on a technician profile. */
export type TechnicianProfilePatch = Partial<
  Pick<Technician, 'name' | 'phone' | 'email' | 'location' | 'trades' | 'yearsExperience'>
> & { workSettings?: Partial<WorkSettings> };
