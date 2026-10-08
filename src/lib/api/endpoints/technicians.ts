import { env } from '@/config/env';
import { clone, delay, mockDb, MockNotFoundError } from '@/mocks/mock-db';
import type { PaginatedResponse, TechnicianQuery } from '@/types/api';
import type { AccountStatus } from '@/types/customer';
import type { Technician, TechnicianInput, TechnicianProfilePatch, TechnicianVerification } from '@/types/technician';
import { api, ApiError, unwrap } from '../client';
import { queryAccounts } from '../mock-utils';

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
    if (!env.useMocks) return unwrap(api.get('/admin/technicians', { query: { ...query } }));
    await delay();
    return clone(
      queryAccounts(
        mockDb.technicians,
        query,
        (t) =>
          (!query.verification || t.verification.status === query.verification) &&
          (!query.trade || t.trades.includes(query.trade)) &&
          (query.available === undefined || t.isAvailable === query.available),
      ),
    );
  },

  async get(id: string): Promise<Technician> {
    if (!env.useMocks) return unwrap(api.get(`/admin/technicians/${id}`));
    await delay();
    return clone(findMock(id));
  },

  async update(id: string, patch: TechnicianProfilePatch): Promise<Technician> {
    if (!env.useMocks) return unwrap(api.patch(`/admin/technicians/${id}`, patch));
    await delay();
    const technician = findMock(id);
    const { workSettings, ...rest } = patch;
    Object.assign(technician, rest);
    if (workSettings) Object.assign(technician.workSettings, workSettings);
    return clone(technician);
  },

  async updateStatus(id: string, status: AccountStatus): Promise<Technician> {
    if (!env.useMocks) return unwrap(api.patch(`/admin/technicians/${id}/status`, { status }));
    await delay();
    const technician = findMock(id);
    technician.status = status;
    if (status !== 'active') technician.isAvailable = false;
    return clone(technician);
  },

  async approve(id: string): Promise<Technician> {
    if (!env.useMocks) return unwrap(api.post(`/admin/technicians/${id}/verification/approve`));
    await delay();
    return review(findMock(id), { status: 'verified', rejectionReason: undefined });
  },

  async reject(id: string, reason: string): Promise<Technician> {
    if (!env.useMocks) return unwrap(api.post(`/admin/technicians/${id}/verification/reject`, { reason }));
    await delay();
    const technician = findMock(id);
    technician.isAvailable = false;
    return review(technician, { status: 'rejected', rejectionReason: reason });
  },

  /** Adds a technician; they still need verification before they can receive jobs. */
  async create(input: TechnicianInput): Promise<Technician> {
    if (!env.useMocks) return unwrap(api.post('/admin/technicians', input));
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
