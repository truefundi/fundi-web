'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Car,
  ChevronDown,
  House,
  Layers,
  Pencil,
  Plus,
  Trash2,
  Wrench,
} from 'lucide-react';

import {
  SERVICE_GROUPS,
  SERVICE_CATEGORIES,
  SERVICE_CATEGORY_STYLE,
  getServiceGroup,
  type ServiceCategory,
} from '@/config/services';

import { CategoryFormDialog } from '@/components/services/CategoryFormDialog';
import { ServiceFormDialog } from '@/components/services/ServiceFormDialog';

import {
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  PageHeader,
  TableSkeleton,
  useToast,
} from '@/components/ui';

import {
  useDeleteService,
  useServices,
} from '@/hooks/useServices';

import {
  useCategories,
  useCreateCategory,
} from '@/hooks/useCategories';

import {
  readCatalogAdminMetadata,
  writeCatalogAdminMetadata,
} from '@/lib/catalog-admin-metadata';

import { formatMoney } from '@/lib/jobs';
import { cn } from '@/lib/utils';

import type {
  CatalogCategory,
  Service,
} from '@/types/service';

type CategoriesMetadata = {
  categories: [];
  serviceIcons: Record<string, string>;
};

const EMPTY_METADATA: CategoriesMetadata = {
  categories: [],
  serviceIcons: {},
};

const DEFAULT_CATEGORY_STYLE = {
  icon: Layers,
  className: 'bg-slate-100 text-slate-600',
};

function resolveServiceGroup(
  service: Service,
): 'Home Services' | 'Car Services' | 'Other Services' {
  const byCategory = getServiceGroup(service.category);
  if (byCategory === 'Home Services' || byCategory === 'Car Services') {
    return byCategory;
  }

  const byName = getServiceGroup(service.name);
  if (byName === 'Home Services' || byName === 'Car Services') {
    return byName;
  }

  const text = `${service.name} ${service.category ?? ''}`.toLowerCase();
  if (
    text.includes('car') ||
    text.includes('garage') ||
    text.includes('auto') ||
    text.includes('vehicle') ||
    text.includes('mechanic') ||
    text.includes('tire') ||
    text.includes('tyre') ||
    text.includes('battery') ||
    text.includes('towing')
  ) {
    return 'Car Services';
  }

  if (
    text.includes('plumb') ||
    text.includes('electric') ||
    text.includes('appliance') ||
    text.includes('carpent') ||
    text.includes('clean') ||
    text.includes('paint') ||
    text.includes('hvac') ||
    text.includes('ac ') ||
    text.includes('roof') ||
    text.includes('home') ||
    text.includes('house')
  ) {
    return 'Home Services';
  }

  return 'Other Services';
}

function ServiceIcon({
  service,
  icon,
}: {
  service: Service;
  icon?: string;
}) {
  const style =
    SERVICE_CATEGORY_STYLE[service.category as ServiceCategory] ??
    SERVICE_CATEGORY_STYLE[service.name as ServiceCategory] ??
    DEFAULT_CATEGORY_STYLE;

  const Icon = style.icon;

  return (
    <span
      className={cn(
        'flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl',
        icon
          ? 'bg-slate-100'
          : style.className ?? 'bg-slate-100 text-slate-600',
      )}
    >
      {icon ? (
        <span
          role="img"
          aria-label={`${service.name} icon`}
          className="h-full w-full bg-cover bg-center"
          style={{ backgroundImage: `url("${icon}")` }}
        />
      ) : (
        <Icon className="h-5 w-5" aria-hidden />
      )}
    </span>
  );
}

export function CategoriesView() {
  const toast = useToast();

  const {
    data: servicesData,
    isLoading: servicesLoading,
    isError: servicesError,
    error: servicesErrorObject,
    refetch: refetchServices,
  } = useServices();

  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    isError: categoriesError,
    error: categoriesErrorObject,
    refetch: refetchCategories,
  } = useCategories();

  const remove = useDeleteService();
  const createCategory = useCreateCategory();

  const [metadata, setMetadata] = useState(EMPTY_METADATA);
  const [metadataError, setMetadataError] = useState('');
  const [metadataLoaded, setMetadataLoaded] = useState(false);

  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [serviceFormOpen, setServiceFormOpen] = useState(false);

  const [serviceCategory, setServiceCategory] = useState<string>();
  const [editing, setEditing] = useState<Service>();
  const [deleting, setDeleting] = useState<Service | null>(null);

  const [openManageId, setOpenManageId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const [activeTab, setActiveTab] = useState<string>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] =
    useState<string>('All Services');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenManageId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const services = useMemo(() => servicesData ?? [], [servicesData]);
  const categories = useMemo(() => categoriesData ?? [], [categoriesData]);

  const missingRequiredCategories = useMemo(() => {
    const existing = new Set(
      categories.map((c) => c.name.trim().toLowerCase()),
    );
    return SERVICE_CATEGORIES.filter(
      (name) => !existing.has(name.toLowerCase()),
    );
  }, [categories]);

  const seedRequiredCategories = async () => {
    const descriptions: Record<ServiceCategory, string> = {
      Electrical: 'Electrical wiring, sockets, lighting, and fault repairs.',
      Plumbing: 'Pipe leaks, taps, toilets, water heaters, and drainage.',
      HVAC: 'Air conditioning, ventilation, and refrigeration servicing.',
      'Appliance Repair': 'Fridges, washing machines, cookers, and home appliances.',
      'Home Repair': 'Carpentry, doors, locks, painting, and structural repairs.',
      'General Maintenance': 'Routine property upkeep and general handyman tasks.',
      'Car & Garage': 'Engine diagnostics, brakes, batteries, and car servicing.',
      'Truck & Mechanical': 'Heavy truck repair, mechanical systems, and fleet maintenance.',
    };

    for (const name of missingRequiredCategories) {
      await createCategory.mutateAsync({
        name,
        description: descriptions[name],
      });
    }
    toast('Required Fundi categories added');
    refetchCategories();
  };

  const formCategories = useMemo<CatalogCategory[]>(() => {
    if (categories.length > 0) return categories;
    const now = new Date().toISOString();
    return [
      {
        id: 'default-home',
        name: 'Home Services',
        description: 'General home services',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'default-car',
        name: 'Car Services',
        description: 'General car & garage services',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'default-other',
        name: 'Other Services',
        description: 'Other miscellaneous services',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    ];
  }, [categories]);

  const activeCategories = useMemo(
    () => categories.filter((category) => category.isActive),
    [categories],
  );

  const totalServices = services.length;

  const homeServices = useMemo(
    () =>
      services.filter((s) => resolveServiceGroup(s) === 'Home Services').length,
    [services],
  );

  const carServices = useMemo(
    () =>
      services.filter((s) => resolveServiceGroup(s) === 'Car Services').length,
    [services],
  );

  const otherServices = useMemo(
    () =>
      services.filter((s) => resolveServiceGroup(s) === 'Other Services')
        .length,
    [services],
  );

  useEffect(() => {
    try {
      const saved = readCatalogAdminMetadata();
      setMetadata({
        categories: [],
        serviceIcons: saved.serviceIcons ?? {},
      });
      setMetadataError('');
    } catch (cause) {
      setMetadataError(
        cause instanceof Error
          ? cause.message
          : 'Could not load saved service icons.',
      );
    } finally {
      setMetadataLoaded(true);
    }
  }, []);

  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const group = resolveServiceGroup(service);

      if (activeTab === 'Home Services' && group !== 'Home Services') {
        return false;
      }
      if (activeTab === 'Car Services' && group !== 'Car Services') {
        return false;
      }
      if (activeTab === 'Other Services' && group !== 'Other Services') {
        return false;
      }

      if (
        selectedCategoryFilter !== 'All Services' &&
        service.category !== selectedCategoryFilter &&
        group !== selectedCategoryFilter
      ) {
        return false;
      }

      return true;
    });
  }, [services, activeTab, selectedCategoryFilter]);

  const openNewService = (category?: string) => {
    setEditing(undefined);
    const defaultCat =
      category ?? (activeTab !== 'all' ? activeTab : activeCategories[0]?.name);
    setServiceCategory(defaultCat);
    setServiceFormOpen(true);
  };

  const openEditService = (service: Service) => {
    setEditing(service);
    setServiceCategory(undefined);
    setServiceFormOpen(true);
    setOpenManageId(null);
  };

  const saveCategory = (category: { name: string; description: string }) => {
    createCategory.mutate(category, {
      onSuccess: () => {
        setCategoryFormOpen(false);
        toast(`${category.name} added successfully`);
        refetchCategories();
      },
      onError: (error: Error) => {
        toast(error.message || 'Could not create category.', 'error');
      },
    });
  };

  const saveServiceIcon = (serviceId: string, icon: string | null) => {
    const serviceIcons = { ...metadata.serviceIcons };

    if (icon) {
      serviceIcons[serviceId] = icon;
    } else {
      delete serviceIcons[serviceId];
    }

    const nextMetadata = {
      ...metadata,
      serviceIcons,
    };

    try {
      writeCatalogAdminMetadata(nextMetadata);
      setMetadata(nextMetadata);
      return true;
    } catch (cause) {
      toast(
        cause instanceof Error
          ? cause.message
          : 'Could not save the service icon.',
        'error',
      );
      return false;
    }
  };

  const refreshAll = () => {
    refetchServices();
    refetchCategories();
  };

  const loading = servicesLoading || categoriesLoading || !metadataLoaded;
  const hasError = servicesError || categoriesError || Boolean(metadataError);

  return (
    <>
      <PageHeader
        title="Service Management"
        description="Manage Home Services, Car Services, and other categories, their booking fees, and availability."
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            {missingRequiredCategories.length > 0 && (
              <Button
                variant="secondary"
                onClick={seedRequiredCategories}
                disabled={createCategory.isPending}
              >
                Seed {missingRequiredCategories.length} default categories
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={() => setCategoryFormOpen(true)}
              disabled={createCategory.isPending}
            >
              <Plus className="h-4 w-4" aria-hidden />
              Add category
            </Button>
            <Button
              onClick={() => openNewService()}
              className="bg-orange-600 text-white hover:bg-orange-700"
            >
              <Plus className="h-4 w-4" aria-hidden />
              Add service
            </Button>
          </div>
        }
      />

      {!loading && !hasError && (
        <div className="mb-6 grid w-full min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <button
            type="button"
            onClick={() => {
              setActiveTab('all');
              setSelectedCategoryFilter('All Services');
            }}
            className={cn(
              'rounded-xl border bg-white p-5 text-left shadow-sm transition-all focus:outline-none',
              activeTab === 'all'
                ? 'border-slate-900 ring-2 ring-slate-900/10'
                : 'border-slate-200 hover:border-slate-300',
            )}
          >
            <p className="text-sm font-medium text-slate-500">All Services</p>
            <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">
              {totalServices}
            </p>
            <p className="mt-1 text-xs text-slate-500">View all services</p>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('Home Services');
              setSelectedCategoryFilter('All Services');
            }}
            className={cn(
              'rounded-xl border bg-white p-5 text-left shadow-sm transition-all focus:outline-none',
              activeTab === 'Home Services'
                ? 'border-slate-900 ring-2 ring-slate-900/10'
                : 'border-slate-200 hover:border-slate-300',
            )}
          >
            <p className="text-sm font-medium text-slate-500">Home Services</p>
            <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">
              {homeServices}
            </p>
            <p className="mt-1 text-xs text-slate-500">View category</p>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('Car Services');
              setSelectedCategoryFilter('All Services');
            }}
            className={cn(
              'rounded-xl border bg-white p-5 text-left shadow-sm transition-all focus:outline-none',
              activeTab === 'Car Services'
                ? 'border-slate-900 ring-2 ring-slate-900/10'
                : 'border-slate-200 hover:border-slate-300',
            )}
          >
            <p className="text-sm font-medium text-slate-500">Car Services</p>
            <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">
              {carServices}
            </p>
            <p className="mt-1 text-xs text-slate-500">View category</p>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('Other Services');
              setSelectedCategoryFilter('All Services');
            }}
            className={cn(
              'rounded-xl border bg-white p-5 text-left shadow-sm transition-all focus:outline-none',
              activeTab === 'Other Services'
                ? 'border-slate-900 ring-2 ring-slate-900/10'
                : 'border-slate-200 hover:border-slate-300',
            )}
          >
            <p className="text-sm font-medium text-slate-500">Other Categories</p>
            <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">
              {otherServices}
            </p>
            <p className="mt-1 text-xs text-slate-500">View other categories</p>
          </button>
        </div>
      )}

      {hasError ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <ErrorState
            message={
              servicesError
                ? servicesErrorObject?.message ?? 'Could not load services.'
                : categoriesError
                  ? categoriesErrorObject?.message ?? 'Could not load categories.'
                  : metadataError
            }
            onRetry={refreshAll}
          />
        </div>
      ) : loading ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5">
          <TableSkeleton columns={5} rows={5} />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {activeTab === 'all'
                  ? 'All Services'
                  : activeTab === 'Other Services'
                    ? 'Other Categories'
                    : activeTab}
              </h2>
              <p className="text-sm text-slate-500">
                {filteredServices.length} service
                {filteredServices.length === 1 ? '' : 's'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <label
                htmlFor="category-filter"
                className="text-sm font-medium text-slate-700"
              >
                Category
              </label>
              <select
                id="category-filter"
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              >
                <option value="All Services">All Services</option>
                <option value="Home Services">Home Services</option>
                <option value="Car Services">Car Services</option>
                {activeCategories
                  .filter(
                    (cat) =>
                      cat.name !== 'Home Services' &&
                      cat.name !== 'Car Services',
                  )
                  .map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {filteredServices.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
              <EmptyState
                icon={Layers}
                title="No services found"
                description="Get started by creating a category or adding a new service offering."
                action={
                  <div className="mt-4 flex justify-center gap-3">
                    <Button
                      variant="secondary"
                      onClick={() => setCategoryFormOpen(true)}
                    >
                      <Plus className="h-4 w-4" aria-hidden />
                      Add category
                    </Button>
                    <Button
                      onClick={() => openNewService()}
                      className="bg-orange-600 text-white hover:bg-orange-700"
                    >
                      <Plus className="h-4 w-4" aria-hidden />
                      Add service
                    </Button>
                  </div>
                }
              />
            </div>
          ) : (
            <div className="overflow-visible rounded-2xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 pl-6 pr-4">Service</th>
                    <th className="px-4 py-3.5">Category</th>
                    <th className="px-4 py-3.5">Booking Fee</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="py-3.5 pl-4 pr-6 text-right">Manage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white text-sm">
                  {filteredServices.map((service) => {
                    const isMenuOpen = openManageId === service.id;
                    const displayGroup = resolveServiceGroup(service);

                    return (
                      <tr
                        key={service.id}
                        className="transition-colors hover:bg-slate-50/50"
                      >
                        <td className="py-4 pl-6 pr-4">
                          <div className="flex items-center gap-3">
                            <ServiceIcon
                              service={service}
                              icon={metadata.serviceIcons[service.id]}
                            />
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900">
                                {service.name}
                              </p>
                              <p className="max-w-xs truncate text-xs text-slate-500">
                                {service.description}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 font-medium text-slate-600">
                          {displayGroup}
                        </td>
                        <td className="px-4 py-4 font-semibold text-slate-900">
                          {formatMoney(service.visitFee)}
                        </td>
                        <td className="px-4 py-4">
                          {service.isActive ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                              Hidden
                            </span>
                          )}
                        </td>
                        <td className="py-4 pl-4 pr-6 text-right">
                          <div
                            ref={isMenuOpen ? menuRef : null}
                            className="relative inline-block text-left"
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setOpenManageId(isMenuOpen ? null : service.id)
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                            >
                              Manage
                              <ChevronDown
                                className={cn(
                                  'h-3.5 w-3.5 text-slate-500 transition-transform',
                                  isMenuOpen && 'rotate-180',
                                )}
                              />
                            </button>

                            {isMenuOpen && (
                              <div className="absolute right-0 z-20 mt-2 w-44 origin-top-right rounded-xl border border-slate-200 bg-white py-1.5 shadow-lg">
                                <button
                                  type="button"
                                  onClick={() => openEditService(service)}
                                  className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                                >
                                  <Pencil className="h-4 w-4 text-slate-400" />
                                  Edit service
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenManageId(null);
                                    setDeleting(service);
                                  }}
                                  className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                  Delete service
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <CategoryFormDialog
        open={categoryFormOpen}
        onClose={() => setCategoryFormOpen(false)}
        existingNames={categories.map((category) => category.name)}
        onSave={saveCategory}
      />

      <ServiceFormDialog
        open={serviceFormOpen}
        onClose={() => {
          setServiceFormOpen(false);
          setEditing(undefined);
          setServiceCategory(undefined);
        }}
        service={editing}
        categories={formCategories}
        initialCategory={serviceCategory}
        icon={editing?.id ? metadata.serviceIcons[editing.id] : undefined}
        onIconChange={saveServiceIcon}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title={`Hide ${deleting?.name ?? 'service'}?`}
        description="This will deactivate the service so customers can no longer request it. Existing records are retained."
        confirmLabel="Hide service"
        destructive
        loading={remove.isPending}
        onConfirm={() => {
          if (!deleting) return;

          remove.mutate(deleting.id, {
            onSuccess: () => {
              const serviceId = deleting.id;
              const serviceName = deleting.name;

              setDeleting(null);

              const iconRemoved = metadata.serviceIcons[serviceId]
                ? saveServiceIcon(serviceId, null)
                : true;

              toast(
                iconRemoved
                  ? `${serviceName} hidden`
                  : `${serviceName} hidden, but its saved icon could not be removed`,
                iconRemoved ? 'success' : 'error',
              );
            },
            onError: (err) => {
              toast(err.message || 'Could not hide the service', 'error');
              setDeleting(null);
            },
          });
        }}
      />
    </>
  );
}