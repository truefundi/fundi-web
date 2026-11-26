export type CompanyVerificationStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface CompanyOwnerSummary {
  id: string;
  fullName: string;
  email: string | null;
  phoneNumber: string;
}

export interface CompanyTechnicianSummary {
  id: string;
  verificationStatus: CompanyVerificationStatus;
  user: CompanyOwnerSummary;
}

export interface CompanyVerifierSummary {
  id: string;
  fullName: string;
  email: string | null;
}

export interface Company {
  id: string;
  technicianId: string;
  name: string;
  location: string;
  email: string;
  phoneNumber: string;
  description: string | null;
  verificationStatus: CompanyVerificationStatus;
  verifiedAt: string | null;
  verifiedById: string | null;
  createdAt: string;
  updatedAt: string;
  technician?: CompanyTechnicianSummary;
  verifiedBy?: CompanyVerifierSummary | null;
}

export interface CreateAdminCompanyPayload {
  technicianId: string;
  name: string;
  location: string;
  email: string;
  phoneNumber: string;
  description?: string;
}

export interface UpdateCompanyPayload {
  name?: string;
  location?: string;
  email?: string;
  phoneNumber?: string;
  description?: string | null;
}