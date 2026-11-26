import type { ServiceGroup } from '@/config/services';

export interface AdminCategory {
  name: string;
  description: string;
  group?: ServiceGroup;
}

export interface CatalogAdminMetadata {
  categories: AdminCategory[];
  categoryGroups: Record<string, ServiceGroup>;
  serviceIcons: Record<string, string>;
}

const STORAGE_KEY = 'fundi.catalog-admin-metadata.v1';

const VALID_GROUPS: ServiceGroup[] = [
  'Home Services',
  'Car Services',
  'Other Services',
];

export function readCatalogAdminMetadata(): CatalogAdminMetadata {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return { categories: [], categoryGroups: {}, serviceIcons: {} };
  }

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
    const group =
      'group' in category &&
      typeof category.group === 'string' &&
      VALID_GROUPS.includes(category.group as ServiceGroup)
        ? (category.group as ServiceGroup)
        : undefined;

    return {
      name: category.name,
      description: category.description,
      ...(group ? { group } : {}),
    };
  });

  const categoryGroups: Record<string, ServiceGroup> = {};
  if (
    'categoryGroups' in parsed &&
    parsed.categoryGroups &&
    typeof parsed.categoryGroups === 'object' &&
    !Array.isArray(parsed.categoryGroups)
  ) {
    for (const [key, grp] of Object.entries(parsed.categoryGroups)) {
      if (typeof grp === 'string' && VALID_GROUPS.includes(grp as ServiceGroup)) {
        categoryGroups[key.toLowerCase()] = grp as ServiceGroup;
      }
    }
  }

  const serviceIcons: Record<string, string> = {};
  for (const [serviceId, icon] of Object.entries(parsed.serviceIcons)) {
    if (typeof icon !== 'string') {
      throw new Error('Saved service icons could not be loaded.');
    }
    serviceIcons[serviceId] = icon;
  }

  return { categories, categoryGroups, serviceIcons };
}

export function writeCatalogAdminMetadata(
  metadata: CatalogAdminMetadata,
): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(metadata));
}
