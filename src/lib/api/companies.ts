import { api, unwrap } from '@/lib/api/client';
import type {
  Company,
  CompanyVerificationStatus,
  CreateAdminCompanyPayload,
  UpdateCompanyPayload,
} from '@/types/company';

export async function listAdminCompanies(
  verificationStatus?: CompanyVerificationStatus,
): Promise<Company[]> {
  return unwrap<Company[]>(
    api.get('/api/v1/admin/companies', {
      query: verificationStatus ? { verificationStatus } : undefined,
    }),
  );
}

export async function getAdminCompany(id: string): Promise<Company> {
  return unwrap<Company>(api.get(`/api/v1/admin/companies/${id}`));
}

export async function createAdminCompany(
  payload: CreateAdminCompanyPayload,
): Promise<Company> {
  return unwrap<Company>(api.post('/api/v1/admin/companies', payload));
}

export async function updateAdminCompany(
  id: string,
  payload: UpdateCompanyPayload,
): Promise<Company> {
  return unwrap<Company>(api.patch(`/api/v1/admin/companies/${id}`, payload));
}

export async function updateAdminCompanyVerification(
  id: string,
  verificationStatus: CompanyVerificationStatus,
): Promise<Company> {
  return unwrap<Company>(
    api.patch(`/api/v1/admin/companies/${id}/verification-status`, {
      verificationStatus,
    }),
  );
}

export async function deleteAdminCompany(
  id: string,
): Promise<{ id: string; deleted: boolean }> {
  return unwrap<{ id: string; deleted: boolean }>(
    api.delete(`/api/v1/admin/companies/${id}`),
  );
}