import type { Account } from './customer';

/** Mirrors mobile WorkStatus (none | pending | verified) plus admin-only `rejected`. */
export type VerificationStatus = 'not_submitted' | 'pending' | 'verified' | 'rejected';

export const VERIFICATION_LABEL: Record<VerificationStatus, string> = {
  not_submitted: 'Not submitted',
  pending: 'Under review',
  verified: 'Verified',
  rejected: 'Rejected',
};

export type BusinessType = 'INDIVIDUAL' | 'COMPANY';

export type Gender = 'FEMALE' | 'MALE' | 'NON_BINARY' | 'PREFER_NOT_TO_SAY';
export type PaymentMethod = 'MOMO' | 'BANK_TRANSFER' | 'CASH' | 'OTHER';

/** A trade backed by a catalog service (categoryId) or entered by the admin (customName). */
export interface ServiceExperience {
  id?: string;
  categoryId?: string | null;
  customName?: string | null;
  yearsOfExperience: number;
}

export interface CompanyDetails {
  name: string;
  location: string;
  email: string;
  phoneNumber: string;
  description?: string;
}

export interface TechnicianVerification {
  status: VerificationStatus;
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  idDocumentUrl?: string;
  certificateUrls: string[];
}

export interface Technician extends Account {
  profilePictureUrl?: string;
  trades: string[];
  serviceExperiences?: ServiceExperience[];
  yearsExperience: number;
  rating: number;
  jobsCompleted: number;
  isAvailable: boolean;
  verification: TechnicianVerification;
  businessType?: BusinessType;
  gender?: Gender;
  nationalIdNumber?: string;
  paymentMethod?: PaymentMethod;
  paymentNumber?: string;
  baseAddress?: string;
  baseLatitude?: number | null;
  baseLongitude?: number | null;
}

/** What the admin fills in to add a technician; verification starts as "pending". */
export interface TechnicianInput {
  name: string;
  phone: string;
  email?: string;
  location: string;
  baseLatitude?: number;
  baseLongitude?: number;
  serviceExperiences: ServiceExperience[];
  gender: Gender;
  nationalIdNumber?: string;
  paymentMethod: PaymentMethod;
  paymentNumber: string;
}

/** Fields an admin may edit on a technician profile. */
export type TechnicianProfilePatch = Partial<TechnicianInput>;
