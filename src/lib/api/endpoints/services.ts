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

const buildPayload = (input: ServiceInput, includeStatus: boolean) => {
  const trimmedKeywords = input.keywords?.trim();
  const normalizedSosFee =
    typeof input.sosBookingFee === 'number' && input.sosBookingFee > 0
      ? Math.round(input.sosBookingFee)
      : undefined;

  return {
    name: input.name.trim(),
    categoryId: input.categoryId,
    description: input.description.trim(),
    bookingFee: Math.round(input.visitFee),
    emergencyVisitFee: Math.round(input.emergencyVisitFee),
    ...(includeStatus ? { isActive: input.isActive } : {}),
    ...(trimmedKeywords ? { keywords: trimmedKeywords } : {}),
    icon: input.icon ?? null,
    ...(normalizedSosFee !== undefined
      ? { sosBookingFee: normalizedSosFee }
      : {}),
  };
};

export const servicesApi = {
  async list(): Promise<Service[]> {
    const result = await unwrap<BackendService[]>(
      api.get('/catalog/admin/services'),
    );
    return (result ?? []).map(mapService);
  },

  async create(input: ServiceInput): Promise<Service> {
    const result = await unwrap<BackendService>(
      api.post('/catalog/services', buildPayload(input, false)),
    );
    return mapService(result);
  },

  async update(id: string, input: ServiceInput): Promise<Service> {
    const result = await unwrap<BackendService>(
      api.patch(`/catalog/services/${id}`, buildPayload(input, true)),
    );
    return mapService(result);
  },

  async remove(id: string): Promise<void> {
    await unwrap(api.delete(`/catalog/services/${id}`));
  },
};