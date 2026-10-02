import { env } from '@/config/env';
import { clone, delay, mockDb, MockNotFoundError } from '@/mocks/mock-db';
import type { PaginatedResponse, TechnicianQuery } from '@/types/api';
import type { AccountStatus } from '@/types/customer';
import type { Technician, TechnicianProfilePatch, TechnicianVerification } from '@/types/technician';
import { api, unwrap } from '../client';
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
};
