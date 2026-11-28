import type { CompanyDetails } from '@/types/technician';
import { api, unwrap } from '../client';

export interface AdminCompany extends Omit<CompanyDetails, 'description'> {
  id: string;
  technicianId: string;
  description?: string | null;
  verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export const companiesApi = {
  async list(): Promise<AdminCompany[]> {
    return (await unwrap<AdminCompany[]>(api.get('/admin/companies'))) ?? [];
  },

  async create(technicianId: string, details: CompanyDetails): Promise<AdminCompany> {
    return unwrap<AdminCompany>(
      api.post('/admin/companies', { technicianId, ...companyPayload(details) }),
    );
  },

  async update(id: string, details: CompanyDetails): Promise<AdminCompany> {
    return unwrap<AdminCompany>(api.patch(`/admin/companies/${id}`, companyPayload(details)));
  },

  async remove(id: string): Promise<void> {
    await unwrap(api.delete(`/admin/companies/${id}`));
  },
};

function companyPayload(details: CompanyDetails) {
  const description = details.description?.trim();
  return {
    name: details.name.trim(),
    location: details.location.trim(),
    email: details.email.trim().toLowerCase(),
    phoneNumber: details.phoneNumber.replace(/\s/g, ''),
    ...(description ? { description } : {}),
  };
}
