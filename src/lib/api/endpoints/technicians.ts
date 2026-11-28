import { mapBackendTechnician, type BackendTechnician } from '@/lib/api/adapters/technicians';
import type { PaginatedResponse, TechnicianQuery } from '@/types/api';
import type { AccountStatus } from '@/types/customer';
import type { ServiceExperience, Technician, TechnicianInput, TechnicianProfilePatch, VerificationStatus } from '@/types/technician';
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

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

function apiServiceExperiences(
  experiences: ServiceExperience[] | undefined,
): Array<{ categoryId?: string; customName?: string; yearsOfExperience: number }> | undefined {
  if (!experiences) return undefined;
  return experiences
    .map((experience) => {
      const yearsOfExperience = Number.isFinite(experience.yearsOfExperience)
        ? Math.max(0, Math.min(60, Math.round(experience.yearsOfExperience)))
        : 1;
      if (experience.categoryId && UUID.test(experience.categoryId)) {
        return { categoryId: experience.categoryId, yearsOfExperience };
      }
      return { customName: (experience.customName || '').trim(), yearsOfExperience };
    })
    .filter((experience) => experience.categoryId || Boolean(experience.customName));
}

type ProfileInput = TechnicianInput | TechnicianProfilePatch;

function profilePayload(input: ProfileInput, isCreate: boolean) {
  const payload: Record<string, unknown> = {};
  const address = input.location?.trim();

  if (input.name !== undefined) payload.fullName = input.name.trim();
  if (input.phone !== undefined) payload.phoneNumber = input.phone.replace(/\s/g, '');
  if (input.email !== undefined) payload.email = input.email.trim() || null;
  if (input.location !== undefined) {
    payload.baseAddress = address || 'Kigali, Rwanda';
    payload.publicLocationLabel = (address || 'Kigali').split(',')[0].trim();
  }
  if (input.baseLatitude !== undefined) payload.baseLatitude = input.baseLatitude;
  else if (isCreate) payload.baseLatitude = -1.9441;
  if (input.baseLongitude !== undefined) payload.baseLongitude = input.baseLongitude;
  else if (isCreate) payload.baseLongitude = 30.0619;
  if (input.gender !== undefined) payload.gender = input.gender;
  if (input.nationalIdNumber !== undefined) {
    const nationalId = input.nationalIdNumber.trim();
    if (nationalId && !/^\*{4}\d{4}$/.test(nationalId)) payload.nationalIdNumber = nationalId;
  }
  if (input.paymentMethod !== undefined) payload.paymentMethod = input.paymentMethod;
  if (input.paymentNumber !== undefined) payload.paymentNumber = input.paymentNumber.replace(/\s/g, '');
  if (input.serviceExperiences !== undefined) {
    payload.serviceExperiences = apiServiceExperiences(input.serviceExperiences);
  }
  return payload;
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

  /** Profile fields and user identity are all accepted by the admin profile DTO. */
  async update(id: string, patch: TechnicianProfilePatch): Promise<Technician> {
    const payload = profilePayload(patch, false);
    if (Object.keys(payload).length === 0) return techniciansApi.get(id);
    return readLive(unwrap(api.patch<BackendTechnician>(`/admin/technicians/${id}`, payload)));
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

  /** Adds a technician with the same profile fields the mobile application sends. */
  async create(input: TechnicianInput): Promise<Technician> {
    const payload = {
      user: {
        fullName: input.name,
        phoneNumber: input.phone,
        ...(input.email?.trim() ? { email: input.email.trim() } : {}),
      },
      profile: profilePayload(input, true),
    };
    return readLive(unwrap(api.post<BackendTechnician>('/admin/technicians', payload)));
  },

  /** Permanently removes a technician who has no open jobs; otherwise suspend them instead. */
  async remove(id: string): Promise<void> {
    await unwrap(api.delete(`/admin/technicians/${id}`));
  },
};
