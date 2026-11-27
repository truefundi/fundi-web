import { api, unwrap } from '../client';
import type { CatalogCategory } from '@/types/service';

export const categoriesApi = {
  async list(): Promise<CatalogCategory[]> {
    const response = await unwrap<CatalogCategory[]>(
      api.get('/catalog/admin/categories'),
    );
    return response ?? [];
  },

  async create(input: {
    name: string;
    description: string;
  }): Promise<CatalogCategory> {
    return unwrap<CatalogCategory>(
      api.post('/catalog/categories', input),
    );
  },

  async update(
    id: string,
    input: {
      name?: string;
      description?: string;
      isActive?: boolean;
    },
  ): Promise<CatalogCategory> {
    return unwrap<CatalogCategory>(
      api.patch(`/catalog/categories/${id}`, input),
    );
  },

  async remove(id: string): Promise<void> {
    await unwrap(api.delete(`/catalog/categories/${id}`));
  },
};