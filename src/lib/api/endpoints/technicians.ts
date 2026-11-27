import { mapBackendTechnician, type BackendTechnician } from '@/lib/api/adapters/technicians';
import type { PaginatedResponse, TechnicianQuery } from '@/types/api';
import type { AccountStatus } from '@/types/customer';
import type { Technician, TechnicianInput, TechnicianProfilePatch, VerificationStatus } from '@/types/technician';
import { api, unwrap } from '../client';

const ACCOUNT_TO_API: Record<AccountStatus, 'ACTIVE' | 'SUSPENDED' | 'INACTIVE'> = {
  active: 'ACTIVE',
  suspended: 'SUSPENDED',
  inactive: 'INACTIVE',
};

const VERIFICATION_TO_API: Record<VerificationStatus, 'PENDING' | 'APPROVED' | 'REJECTED'> = {
  not_submitted: 'PENDING',
  pending: 'PENDING',
  verified: 'APPROVED',
  rejected: 'REJECTED',
};

function toLiveQuery(query: TechnicianQuery) {
  return {
    search: query.search,
    page: query.page,
    limit: query.pageSize,
    category: query.trade,
    verificationStatus: query.verification ? VERIFICATION_TO_API[query.verification] : undefined,
    status: query.status ? ACCOUNT_TO_API[query.status] : undefined,
    availabilityStatus: query.available === undefined ? undefined : query.available ? 'ONLINE' : 'OFFLINE',
  };
}

async function readLive(profile: Promise<BackendTechnician> | BackendTechnician): Promise<Technician> {
  return mapBackendTechnician(await profile);
}

export const techniciansApi = {
  async list(
    query: TechnicianQuery = {},
    signal?: AbortSignal,
  ): Promise<PaginatedResponse<Technician>> {
    const response = await unwrap(
      api.get<{ data: BackendTechnician[]; pagination: { page: number; limit: number; total: number } }>(
        '/admin/technicians',
        { query: toLiveQuery(query), signal },
      ),
    );
    return {
      items: (response.data || []).map(mapBackendTechnician),
      total: response.pagination?.total ?? 0,
      page: response.pagination?.page ?? 1,
      pageSize: response.pagination?.limit ?? 20,
    };
  },

  async get(id: string, signal?: AbortSignal): Promise<Technician> {
    return readLive(
      unwrap(api.get<BackendTechnician>(`/admin/technicians/${id}`, { signal })),
    );
  },

  async update(id: string, patch: TechnicianProfilePatch): Promise<Technician> {
    if (patch.name !== undefined || patch.phone !== undefined || patch.email !== undefined) {
      const profile = await unwrap(api.get<BackendTechnician>(`/admin/technicians/${id}`));
      await unwrap(
        api.patch(`/users/${profile.user.id}`, {
          ...(patch.name !== undefined ? { fullName: patch.name } : {}),
          ...(patch.phone !== undefined ? { phoneNumber: patch.phone } : {}),
          ...(patch.email ? { email: patch.email } : {}),
        }),
      );
    }

    // Backend AdminUpdateTechnicianDto accepts profile fields (location, service experiences)
    const profilePayload: Record<string, unknown> = {};
    if (patch.location !== undefined) {
      profilePayload.publicLocationLabel = patch.location;
      profilePayload.baseAddress = patch.location;
    }
    if (patch.gender !== undefined) profilePayload.gender = patch.gender;
    if (patch.nationalIdNumber !== undefined) profilePayload.nationalIdNumber = patch.nationalIdNumber;
    if (patch.paymentMethod !== undefined) profilePayload.paymentMethod = patch.paymentMethod;
    if (patch.paymentNumber !== undefined) profilePayload.paymentNumber = patch.paymentNumber;
    if (patch.trades !== undefined || patch.yearsExperience !== undefined) {
      const trades = patch.trades ?? (await techniciansApi.get(id)).trades;
      profilePayload.serviceExperiences = trades.map((trade) => ({
        customName: trade,
        yearsOfExperience: patch.yearsExperience ?? 1,
      }));
    }

    if (Object.keys(profilePayload).length > 0) {
      return readLive(unwrap(api.patch<BackendTechnician>(`/admin/technicians/${id}`, profilePayload)));
    }

    return techniciansApi.get(id);
  },

  async updateStatus(id: string, status: AccountStatus): Promise<Technician> {
    const apiStatus = ACCOUNT_TO_API[status] ?? (status.toUpperCase() as 'ACTIVE' | 'SUSPENDED' | 'INACTIVE');
    return readLive(unwrap(api.patch<BackendTechnician>(`/admin/technicians/${id}/status`, { status: apiStatus })));
  },

  async approve(id: string): Promise<Technician> {
    return readLive(
      unwrap(
        api.patch<BackendTechnician>(`/admin/technicians/${id}/verification-status`, {
          verificationStatus: 'APPROVED',
        }),
      ),
    );
  },

  async reject(id: string, _reason?: string): Promise<Technician> {
    return readLive(
      unwrap(
        api.patch<BackendTechnician>(`/admin/technicians/${id}/verification-status`, {
          verificationStatus: 'REJECTED',
        }),
      ),
    );
  },

  /** Adds a technician; they still need verification before they can receive jobs. */
  async create(input: TechnicianInput): Promise<Technician> {
    const payload = {
      user: {
        fullName: input.name,
        phoneNumber: input.phone,
        email: input.email || undefined,
      },
      profile: {
        gender: input.gender,
        nationalIdNumber: input.nationalIdNumber,
        paymentMethod: input.paymentMethod,
        paymentNumber: input.paymentNumber,
        publicLocationLabel: input.location,
        baseAddress: input.location,
        serviceExperiences: (input.trades || []).map((trade) => ({
          customName: trade,
          yearsOfExperience: input.yearsExperience ?? 1,
        })),
      },
    };
    return readLive(unwrap(api.post<BackendTechnician>('/admin/technicians', payload)));
  },

  /** Permanently removes a technician who has no open jobs; otherwise suspend them instead. */
  async remove(id: string): Promise<void> {
    await unwrap(api.delete(`/admin/technicians/${id}`));
  },
};