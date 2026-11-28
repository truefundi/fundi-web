import type { AccountStatus } from '@/types/customer';
import type { ServiceExperience, Technician, VerificationStatus } from '@/types/technician';

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
  businessType?: 'INDIVIDUAL' | 'COMPANY' | null;
  yearsOfExperience?: number;
  serviceExperiences?: Array<{
    id?: string;
    categoryId?: string | null;
    category?: { name?: string | null } | null;
    customName?: string | null;
    yearsOfExperience?: number;
  }>;
  stats?: {
    averageRating?: number | null;
    ratingCount?: number;
    jobsCompleted?: number;
  };
  verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  /** The admin's note on a rejected application. */
  rejectionReason?: string | null;
  availabilityStatus: 'ONLINE' | 'OFFLINE';
  location?: {
    address?: string | null;
    publicLocationLabel?: string | null;
    latitude?: number | null;
    longitude?: number | null;
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

function serviceName(row: NonNullable<BackendTechnician['serviceExperiences']>[number]): string {
  return row.category?.name?.trim() || row.customName?.trim() || '';
}

export function mapBackendTechnician(profile: BackendTechnician): Technician {
  const serviceExperiences: ServiceExperience[] = (profile.serviceExperiences ?? [])
    .map((row) => ({
      ...(row.id ? { id: row.id } : {}),
      categoryId: row.categoryId ?? null,
      customName: row.customName ?? serviceName(row),
      yearsOfExperience: row.yearsOfExperience ?? 0,
    }))
    .filter((row) => Boolean(row.customName));

  return {
    id: profile.id,
    name: profile.user.fullName,
    phone: profile.user.phoneNumber,
    email: profile.user.email || undefined,
    status: STATUS[profile.user.status],
    location: profile.location?.publicLocationLabel || profile.location?.address || '—',
    baseAddress: profile.location?.address ?? undefined,
    baseLatitude: profile.location?.latitude ?? null,
    baseLongitude: profile.location?.longitude ?? null,
    createdAt: profile.user.createdAt,
    lastActiveAt: profile.updatedAt,
    serviceExperiences,
    trades: serviceExperiences.map((row) => row.customName || ''),
    yearsExperience: profile.yearsOfExperience ?? 0,
    rating: Number(profile.stats?.averageRating ?? 0),
    jobsCompleted: profile.stats?.jobsCompleted ?? 0,
    isAvailable: profile.availabilityStatus === 'ONLINE',
    verification: {
      status: VERIFICATION[profile.verificationStatus],
      certificateUrls: [],
      ...(profile.rejectionReason ? { rejectionReason: profile.rejectionReason } : {}),
    },
    businessType: profile.businessType ?? undefined,
    gender: profile.gender ?? undefined,
    nationalIdNumber: profile.nationalIdNumber ?? undefined,
    paymentMethod: profile.paymentMethod ?? undefined,
    paymentNumber: profile.paymentNumber ?? undefined,
    profilePictureUrl: profile.profilePictureUrl ?? undefined,
  };
}
