import type { ServiceCategory } from '@/config/services';
import type { AccountStatus } from '@/types/customer';
import type { Technician, VerificationStatus } from '@/types/technician';

export type BackendTechnician = {
  id: string;
  user: {
    id: string;
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
  gender?: Technician['gender'] | null;
  paymentMethod?: Technician['paymentMethod'] | null;
  paymentNumber?: string | null;
  profilePictureUrl?: string | null;
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
  return {
    id: profile.id, name: profile.user.fullName, phone: profile.user.phoneNumber,
    email: profile.user.email || undefined, status: STATUS[profile.user.status],
    location: profile.location?.publicLocationLabel || profile.location?.address || '—',
    createdAt: profile.user.createdAt, lastActiveAt: profile.updatedAt,
    trades: (profile.serviceExperiences ?? []).map((row) => row.category?.name || row.customName)
      .filter((name): name is ServiceCategory => Boolean(name)),
    yearsExperience: profile.yearsOfExperience ?? 0,
    rating: 0, jobsCompleted: 0, isAvailable: profile.availabilityStatus === 'ONLINE',
    verification: { status: VERIFICATION[profile.verificationStatus], certificateUrls: [] },
    workSettings: { radiusKm: 10, maxJobsPerDay: 4, hours: 'always' },
    gender: profile.gender ?? undefined,
    nationalIdNumber: profile.nationalIdNumber ?? undefined,
    paymentMethod: profile.paymentMethod ?? undefined,
    paymentNumber: profile.paymentNumber ?? undefined,
    profilePictureUrl: profile.profilePictureUrl ?? undefined,
  };
}
