export interface AdminCategory {
  name: string;
  description: string;
}

export interface CatalogAdminMetadata {
  categories: AdminCategory[];
  serviceIcons: Record<string, string>;
}

const STORAGE_KEY = 'fundi.catalog-admin-metadata.v1';

export function readCatalogAdminMetadata(): CatalogAdminMetadata {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) return { categories: [], serviceIcons: {} };

  const parsed: unknown = JSON.parse(saved);
  if (
    !parsed ||
    typeof parsed !== 'object' ||
    !('categories' in parsed) ||
    !Array.isArray(parsed.categories) ||
    !('serviceIcons' in parsed) ||
    !parsed.serviceIcons ||
    typeof parsed.serviceIcons !== 'object' ||
    Array.isArray(parsed.serviceIcons)
  ) {
    throw new Error('Saved category details could not be loaded.');
  }

  const categories = parsed.categories.map((category) => {
    if (
      !category ||
      typeof category !== 'object' ||
      !('name' in category) ||
      typeof category.name !== 'string' ||
      !('description' in category) ||
      typeof category.description !== 'string'
    ) {
      throw new Error('Saved category details could not be loaded.');
    }
    return { name: category.name, description: category.description };
  });

  const serviceIcons: Record<string, string> = {};
  for (const [serviceId, icon] of Object.entries(parsed.serviceIcons)) {
    if (typeof icon !== 'string') {
      throw new Error('Saved service icons could not be loaded.');
    }
    serviceIcons[serviceId] = icon;
  }

  return { categories, serviceIcons };
}

export function writeCatalogAdminMetadata(
  metadata: CatalogAdminMetadata,
): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(metadata));
}
