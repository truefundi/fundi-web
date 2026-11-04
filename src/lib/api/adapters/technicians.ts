import type { ServiceCategory } from '@/config/services';
import type { AccountStatus } from '@/types/customer';
import type { Technician, VerificationStatus } from '@/types/technician';

export type BackendTechnician = {
  id: string;
  user: {
    fullName: string;
    phoneNumber: string;
    email?: string | null;
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
    createdAt: string;
    updatedAt: string;
  };
  yearsOfExperience?: number;
  serviceExperiences?: Array<{
    category?: { name?: string | null } | null;
    customName?: string | null;
    yearsOfExperience?: number;
  }>;
  verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  availabilityStatus: 'ONLINE' | 'OFFLINE';
  location?: {
    address?: string | null;
    publicLocationLabel?: string | null;
  } | null;
  nationalIdNumber?: string | null;
  createdAt: string;
  updatedAt: string;
};

const STATUS: Record<BackendTechnician['user']['status'], AccountStatus> = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
};

const VERIFICATION: Record<BackendTechnician['verificationStatus'], VerificationStatus> = {
  PENDING: 'pending',
  APPROVED: 'verified',
  REJECTED: 'rejected',
};

export function mapBackendTechnician(profile: BackendTechnician): Technician {
  const trades = (profile.serviceExperiences ?? [])
    .map((row) => row.category?.name || row.customName)
    .filter((name): name is string => Boolean(name));

  return {
    id: profile.id,
    name: profile.user.fullName,
    phone: profile.user.phoneNumber,
    email: profile.user.email || undefined,
    status: STATUS[profile.user.status] ?? 'inactive',
    location: profile.location?.publicLocationLabel || profile.location?.address || '—',
    createdAt: profile.user.createdAt || profile.createdAt,
    lastActiveAt: profile.updatedAt,
    trades: trades as ServiceCategory[],
    yearsExperience: profile.yearsOfExperience ?? 0,
    rating: 0,
    jobsCompleted: 0,
    isAvailable: profile.availabilityStatus === 'ONLINE',
    verification: {
      status: VERIFICATION[profile.verificationStatus] ?? 'pending',
      certificateUrls: [],
    },
    workSettings: { radiusKm: 0, maxJobsPerDay: 0, hours: 'always' },
  };
}
