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

export function mapBackendTechnician(profile: BackendTechnician | Partial<Technician> | any): Technician {
  if (!profile) {
    return {
      id: '',
      name: '—',
      phone: '—',
      status: 'inactive',
      location: '—',
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      trades: [],
      yearsExperience: 0,
      rating: 0,
      jobsCompleted: 0,
      isAvailable: false,
      verification: { status: 'not_submitted', certificateUrls: [] },
      workSettings: { radiusKm: 10, maxJobsPerDay: 4, hours: 'days' },
    };
  }

  // If already in frontend Technician shape
  if (Array.isArray(profile.trades) && typeof profile.name === 'string' && profile.workSettings) {
    return {
      ...profile,
      trades: profile.trades ?? [],
      workSettings: profile.workSettings ?? { radiusKm: 10, maxJobsPerDay: 4, hours: 'days' },
      verification: {
        status: profile.verification?.status ?? 'pending',
        certificateUrls: profile.verification?.certificateUrls ?? [],
        submittedAt: profile.verification?.submittedAt,
        reviewedAt: profile.verification?.reviewedAt,
        reviewedBy: profile.verification?.reviewedBy,
        rejectionReason: profile.verification?.rejectionReason,
        idDocumentUrl: profile.verification?.idDocumentUrl,
      },
    } as Technician;
  }

  const user = profile.user;
  const trades = (profile.serviceExperiences ?? [])
    .map((row: any) => row.category?.name || row.customName)
    .filter((name: any): name is string => Boolean(name));

  const statusKey = user?.status as keyof typeof STATUS | undefined;
  const verificationKey = profile.verificationStatus as keyof typeof VERIFICATION | undefined;

  return {
    id: profile.id,
    name: user?.fullName || profile.name || '—',
    phone: user?.phoneNumber || profile.phone || '—',
    email: user?.email || profile.email || undefined,
    status: (statusKey ? STATUS[statusKey] : profile.status) ?? 'inactive',
    location: profile.location?.publicLocationLabel || profile.location?.address || profile.location || '—',
    createdAt: user?.createdAt || profile.createdAt || new Date().toISOString(),
    lastActiveAt: profile.updatedAt || profile.lastActiveAt || new Date().toISOString(),
    trades: (trades.length > 0 ? trades : (profile.trades ?? [])) as ServiceCategory[],
    yearsExperience: profile.yearsOfExperience ?? profile.yearsExperience ?? 0,
    rating: profile.rating ?? 0,
    jobsCompleted: profile.jobsCompleted ?? 0,
    isAvailable: profile.availabilityStatus === 'ONLINE' || profile.isAvailable === true,
    verification: {
      status: (verificationKey ? VERIFICATION[verificationKey] : profile.verification?.status) ?? 'pending',
      submittedAt: profile.verification?.submittedAt,
      reviewedAt: profile.verification?.reviewedAt,
      reviewedBy: profile.verification?.reviewedBy,
      rejectionReason: profile.verification?.rejectionReason,
      idDocumentUrl: profile.verification?.idDocumentUrl,
      certificateUrls: profile.verification?.certificateUrls ?? [],
    },
    workSettings: profile.workSettings ?? { radiusKm: 10, maxJobsPerDay: 4, hours: 'always' },
  };
}
