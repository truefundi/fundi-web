
import { env } from '@/config/env';
import { clone, delay, mockDb } from '@/mocks/mock-db';
import type { Service, ServiceInput } from '@/types/service';
import { api, unwrap } from '../client';

interface BackendService {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  bookingFee: number;
  emergencyVisitFee: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  keywords?: string;
  icon?: string | null;
  sosBookingFee?: number | null;
  category: { id: string; name: string };
}

const mapService = (item: BackendService): Service => ({
  id: item.id,
  categoryId: item.categoryId,
  name: item.name,
  category: item.category?.name ?? '',
  description: item.description ?? '',
  visitFee: Number(item.bookingFee ?? 0),
  emergencyVisitFee: Number(item.emergencyVisitFee ?? 0),
  isActive: item.isActive,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
  keywords: item.keywords,
  icon: item.icon,
  sosBookingFee: item.sosBookingFee,
});

const payload = (input: ServiceInput) => ({
  name: input.name.trim(),
  categoryId: input.categoryId,
  description: input.description.trim(),
  bookingFee: Math.round(input.visitFee),
  emergencyVisitFee: Math.round(input.emergencyVisitFee),
  isActive: input.isActive,
  keywords: input.keywords ?? '',
  icon: input.icon ?? null,
  sosBookingFee: input.sosBookingFee ?? null,
});

export const servicesApi = {
  async list(): Promise<Service[]> {
    if (!env.useMocks) {
      const result = await unwrap<BackendService[]>(
        api.get('/catalog/admin/services'),
      );
      return (result ?? []).map(mapService);
    }

    await delay();
    return clone(mockDb.services);
  },

  async create(input: ServiceInput): Promise<Service> {
    if (!env.useMocks) {
      const result = await unwrap<BackendService>(
        api.post('/catalog/services', payload(input)),
      );
      return mapService(result);
    }

    await delay();
    const service: Service = {
      ...input,
      id: `svc_${Date.now()}`,
      name: input.name.trim(),
      createdAt: new Date().toISOString(),
    };
    mockDb.services.push(service);
    return clone(service);
  },

  async update(id: string, input: ServiceInput): Promise<Service> {
    if (!env.useMocks) {
      const result = await unwrap<BackendService>(
        api.patch(`/catalog/services/${id}`, payload(input)),
      );
      return mapService(result);
    }

    await delay();
    const service = mockDb.services.find((item) => item.id === id);
    if (!service) throw new Error('Service not found.');
    Object.assign(service, input, { name: input.name.trim() });
    return clone(service);
  },

  async remove(id: string): Promise<void> {
    if (!env.useMocks) {
      await unwrap(api.delete(`/catalog/services/${id}`));
      return;
    }

    await delay();
    mockDb.services = mockDb.services.filter((item) => item.id !== id);
  },
};
