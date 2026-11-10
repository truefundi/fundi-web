import { env } from '@/config/env';
import { clone, delay, mockDb, MockNotFoundError } from '@/mocks/mock-db';
import { mapBackendTechnician, type BackendTechnician } from '@/lib/api/adapters/technicians';
import type { PaginatedResponse, TechnicianQuery } from '@/types/api';
import type { AccountStatus } from '@/types/customer';
import type { Technician, TechnicianInput, TechnicianProfilePatch, TechnicianVerification, VerificationStatus } from '@/types/technician';
import { api, ApiError, unwrap } from '../client';
import { queryAccounts } from '../mock-utils';

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

/** Reviewer recorded on mock decisions; the real API takes it from the admin session. */
const MOCK_REVIEWER = 'Fundi Admin';

function findMock(id: string): Technician {
  const technician = mockDb.technicians.find((t) => t.id === id);
  if (!technician) throw new MockNotFoundError('Technician', id);
  return technician;
}

function review(technician: Technician, changes: Partial<TechnicianVerification>): Technician {
  technician.verification = {
    ...technician.verification,
    ...changes,
    reviewedAt: new Date().toISOString(),
    reviewedBy: MOCK_REVIEWER,
  };
  return clone(technician);
}

export const techniciansApi = {
  async list(query: TechnicianQuery = {}): Promise<PaginatedResponse<Technician>> {
    if (!env.useMocks) {
      const response = await unwrap(
        api.get<{ data: BackendTechnician[]; pagination: { page: number; limit: number; total: number } }>(
          '/admin/technicians',
          { query: toLiveQuery(query) },
        ),
      );
      return {
        items: (response.data || []).map(mapBackendTechnician),
        total: response.pagination?.total ?? 0,
        page: response.pagination?.page ?? 1,
        pageSize: response.pagination?.limit ?? 20,
      };
    }
    await delay();
    return clone(
      queryAccounts(
        mockDb.technicians,
        query,
        (t) =>
          (!query.verification || t.verification.status === query.verification) &&
          (!query.trade || (t.trades && t.trades.includes(query.trade))) &&
          (query.available === undefined || t.isAvailable === query.available),
      ),
    );
  },

  async get(id: string): Promise<Technician> {
    if (!env.useMocks) return readLive(unwrap(api.get<BackendTechnician>(`/admin/technicians/${id}`)));
    await delay();
    return clone(findMock(id));
  },

  async update(id: string, patch: TechnicianProfilePatch): Promise<Technician> {
    if (!env.useMocks) {
      if (patch.name !== undefined || patch.phone !== undefined || patch.email !== undefined) {
        const profile = await unwrap(api.get<BackendTechnician>(`/admin/technicians/${id}`));
        await unwrap(api.patch(`/users/${profile.user.id}`, {
          ...(patch.name !== undefined ? { fullName: patch.name } : {}),
          ...(patch.phone !== undefined ? { phoneNumber: patch.phone } : {}),
          ...(patch.email ? { email: patch.email } : {}),
        }));
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
    }
    await delay();
    const technician = findMock(id);
    const { workSettings, ...rest } = patch;
    Object.assign(technician, rest);
    if (workSettings) Object.assign(technician.workSettings, workSettings);
    return clone(technician);
  },

  async updateStatus(id: string, status: AccountStatus): Promise<Technician> {
    if (!env.useMocks) {
      const apiStatus = ACCOUNT_TO_API[status] ?? (status.toUpperCase() as 'ACTIVE' | 'SUSPENDED' | 'INACTIVE');
      return readLive(unwrap(api.patch<BackendTechnician>(`/admin/technicians/${id}/status`, { status: apiStatus })));
    }
    await delay();
    const technician = findMock(id);
    technician.status = status;
    if (status !== 'active') technician.isAvailable = false;
    return clone(technician);
  },

  async approve(id: string): Promise<Technician> {
    if (!env.useMocks) {
      return readLive(
        unwrap(
          api.patch<BackendTechnician>(`/admin/technicians/${id}/verification-status`, {
            verificationStatus: 'APPROVED',
          }),
        ),
      );
    }
    await delay();
    return review(findMock(id), { status: 'verified', rejectionReason: undefined });
  },

  async reject(id: string, reason: string): Promise<Technician> {
    if (!env.useMocks) {
      return readLive(
        unwrap(
          api.patch<BackendTechnician>(`/admin/technicians/${id}/verification-status`, {
            verificationStatus: 'REJECTED',
          }),
        ),
      );
    }
    await delay();
    const technician = findMock(id);
    technician.isAvailable = false;
    return review(technician, { status: 'rejected', rejectionReason: reason });
  },

  /** Adds a technician; they still need verification before they can receive jobs. */
  async create(input: TechnicianInput): Promise<Technician> {
    if (!env.useMocks) {
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
    }
    await delay();
    if (mockDb.technicians.some((t) => t.phone === input.phone)) {
      throw new ApiError('A technician with this phone number already exists.', 409);
    }
    const now = new Date().toISOString();
    const technician: Technician = {
      ...input,
      id: `tec_${Date.now()}`,
      status: 'active',
      createdAt: now,
      lastActiveAt: now,
      rating: 0,
      jobsCompleted: 0,
      isAvailable: false,
      verification: { status: 'not_submitted', certificateUrls: [] },
    };
    mockDb.technicians.unshift(technician);
    return clone(technician);
  },

  /** Permanently removes a technician who has no open jobs; otherwise suspend them instead. */
  async remove(id: string): Promise<void> {
    if (!env.useMocks) {
      await unwrap(api.delete(`/admin/technicians/${id}`));
      return;
    }
    await delay();
    const technician = findMock(id);
    const openJobs = mockDb.jobs.filter(
      (j) => j.technician?.id === id && j.status !== 'COMPLETED' && j.status !== 'CANCELLED',
    ).length;
    if (openJobs > 0) {
      throw new ApiError(
        `${technician.name} has ${openJobs} open job${openJobs === 1 ? '' : 's'}. Reassign or finish them first, or suspend the account instead.`,
        409,
      );
    }
    mockDb.technicians = mockDb.technicians.filter((t) => t.id !== id);
  },
};
