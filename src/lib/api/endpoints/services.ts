import { env } from '@/config/env';
import { clone, delay, mockDb, MockNotFoundError } from '@/mocks/mock-db';
import type { Service, ServiceInput } from '@/types/service';
import { api, ApiError, unwrap } from '../client';

function findMock(id: string): Service {
  const service = mockDb.services.find((s) => s.id === id);
  if (!service) throw new MockNotFoundError('Service', id);
  return service;
}

/** Names must be unique, ignoring case and extra spaces. */
function assertUniqueName(name: string, exceptId?: string) {
  const key = name.trim().toLowerCase();
  if (mockDb.services.some((s) => s.id !== exceptId && s.name.trim().toLowerCase() === key)) {
    throw new ApiError(`A service called "${name.trim()}" already exists.`, 409);
  }
}

/** Alphabetical, with the catch-all "Other" always last. */
const byName = (a: Service, b: Service) =>
  Number(a.name === 'Other') - Number(b.name === 'Other') || a.name.localeCompare(b.name);

interface BackendCategory {
  id: string; name: string; category: Service['category']; description: string | null;
  bookingFee: number; emergencyVisitFee: number; isActive: boolean; createdAt: string;
}
function mapBackendCategory(cat: BackendCategory): Service {
  return {
    id: cat.id,
    name: cat.name,
    category: cat.category || 'Mechanical',
    description: cat.description || `Professional ${cat.name?.toLowerCase() || 'repair'} services`,
    visitFee: Number(cat.bookingFee),
    emergencyVisitFee: Number(cat.emergencyVisitFee ?? 0),
    isActive: cat.isActive !== false,
    createdAt: cat.createdAt,
  };
}

export const servicesApi = {
  async list(): Promise<Service[]> {
    if (!env.useMocks) {
      const response = await unwrap<BackendCategory[]>(api.get('/catalog/admin/categories'));
      return (response || []).map(mapBackendCategory).sort(byName);
    }
    await delay();
    return clone([...mockDb.services].sort(byName));
  },

  async create(input: ServiceInput): Promise<Service> {
    if (!env.useMocks) {
      const payload = {
        name: input.name.trim(),
        bookingFee: Math.round(input.visitFee),
        emergencyVisitFee: Math.round(input.emergencyVisitFee),
        category: input.category,
        description: input.description,
        isActive: input.isActive,
      };
      const response = await unwrap<BackendCategory>(api.post('/catalog/categories', payload));
      return mapBackendCategory(response);
    }
    await delay();
    assertUniqueName(input.name);
    const service: Service = {
      ...input,
      name: input.name.trim(),
      id: `svc_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    mockDb.services.push(service);
    return clone(service);
  },

  async update(id: string, input: ServiceInput): Promise<Service> {
    if (!env.useMocks) {
      const payload = {
        name: input.name.trim(),
        bookingFee: Math.round(input.visitFee),
        emergencyVisitFee: Math.round(input.emergencyVisitFee),
        category: input.category,
        description: input.description,
        isActive: input.isActive,
      };
      const response = await unwrap<BackendCategory>(api.patch(`/catalog/categories/${id}`, payload));
      return mapBackendCategory(response);
    }
    await delay();
    assertUniqueName(input.name, id);
    const service = findMock(id);
    Object.assign(service, { ...input, name: input.name.trim() });
    return clone(service);
  },

  /** A service with open jobs cannot be deleted; the admin should hide it instead. */
  async remove(id: string): Promise<void> {
    if (!env.useMocks) {
      await unwrap(api.delete(`/catalog/categories/${id}`));
      return;
    }
    await delay();
    const service = findMock(id);
    const openJobs = mockDb.jobs.filter(
      (j) => j.service === service.name && j.status !== 'COMPLETED' && j.status !== 'CANCELLED',
    ).length;
    if (openJobs > 0) {
      throw new ApiError(
        `${service.name} has ${openJobs} open job${openJobs === 1 ? '' : 's'}. Hide it instead, or wait until they finish.`,
        409,
      );
    }
    mockDb.services = mockDb.services.filter((s) => s.id !== id);
  },
};
