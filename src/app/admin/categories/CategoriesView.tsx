
'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Car,
  ChevronDown,
  House,
  Layers,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';

import {
  SERVICE_GROUPS,
  SERVICE_CATEGORY_STYLE,
  DEFAULT_CATEGORY_STYLE,
  getServiceGroup,
  type ServiceCategory,
} from '@/config/services';

import { CategoryFormDialog } from '@/components/services/CategoryFormDialog';
import { ServiceFormDialog } from '@/components/services/ServiceFormDialog';

import {
  Badge,
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

function ServiceIcon({
  service,
  icon,
}: {
  service: Service;
  icon?: string;
}) {
  const style =
    SERVICE_CATEGORY_STYLE[service.category as ServiceCategory] ??
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

function SummaryCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: number;
  icon: typeof Layers;
  color: string;
}) {
  return (
    <article className="w-full min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <p className="truncate text-sm font-medium text-slate-500">
          {title}
        </p>

        <span className={cn('shrink-0 rounded-lg p-2', color)}>
          <Icon className="h-5 w-5" aria-hidden />
        </span>
      </div>

      <p className="mt-3 text-2xl font-bold tabular-nums text-slate-900 sm:text-3xl">
        {value}
      </p>
    </article>
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

  const [expandedCategory, setExpandedCategory] = useState<string | null>(
    null,
  );

  const services = useMemo(
    () => servicesData ?? [],
    [servicesData],
  );

  const categories = useMemo(
    () => categoriesData ?? [],
    [categoriesData],
  );

  const activeCategories = useMemo(
    () => categories.filter((category) => category.isActive),
    [categories],
  );

  const totalServices = services.length;

  const homeServices = services.filter(
    (service) =>
      getServiceGroup(service.category) === 'Home Services',
  ).length;

  const carServices = services.filter(
    (service) =>
      getServiceGroup(service.category) === 'Car Services',
  ).length;

  const otherServices = Math.max(
    0,
    totalServices - homeServices - carServices,
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

  const groupedCategories = useMemo(
    () =>
      SERVICE_GROUPS.map((group) => ({
        name: group,
        categories: activeCategories.filter(
          (category) => getServiceGroup(category.name) === group,
        ),
      })),
    [activeCategories],
  );

  const categoriesWithOther = useMemo(() => {
    const known = new Set(
      SERVICE_GROUPS.flatMap((group) =>
        activeCategories
          .filter(
            (category) => getServiceGroup(category.name) === group,
          )
          .map((category) => category.id),
      ),
    );

    return activeCategories.filter(
      (category) => !known.has(category.id),
    );
  }, [activeCategories]);

  const categoryServices = (category: CatalogCategory) =>
    services.filter(
      (service) => service.categoryId === category.id,
    );

  const openNewService = (category?: string) => {
    setEditing(undefined);
    setServiceCategory(category);
    setServiceFormOpen(true);
  };

  const openEditService = (service: Service) => {
    setEditing(service);
    setServiceCategory(undefined);
    setServiceFormOpen(true);
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategory((current) =>
      current === categoryId ? null : categoryId,
    );
  };

  const saveCategory = (category: { name: string; description: string }) => {
    createCategory.mutate(category, {
      onSuccess: () => {
        setCategoryFormOpen(false);
        toast(`${category.name} added successfully`);
      },
      onError: (error: Error) => {
        toast(error.message || 'Could not create category.', 'error');
      },
    });
  };

  const saveServiceIcon = (
    serviceId: string,
    icon: string | null,
  ) => {
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

  const loading =
    servicesLoading ||
    categoriesLoading ||
    !metadataLoaded;

  const hasError =
    servicesError ||
    categoriesError ||
    Boolean(metadataError);

  return (
    <>
      <PageHeader
        title="Categories & Services"
        description="Organize service offerings into categories and manage their booking fees."
        actions={
          <Button
            onClick={() => setCategoryFormOpen(true)}
            disabled={createCategory.isPending}
          >
            <Plus className="h-4 w-4" aria-hidden />
            Add category
          </Button>
        }
      />

      {!loading && !hasError && (
        <div className="mb-6 grid w-full min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Total Services"
            value={totalServices}
            icon={Layers}
            color="bg-blue-50 text-blue-600"
          />

          <SummaryCard
            title="Home Services"
            value={homeServices}
            icon={House}
            color="bg-green-50 text-green-600"
          />

          <SummaryCard
            title="Car Services"
            value={carServices}
            icon={Car}
            color="bg-orange-50 text-orange-600"
          />

          <SummaryCard
            title="Other Services"
            value={otherServices}
            icon={Layers}
            color="bg-purple-50 text-purple-600"
          />
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
          <TableSkeleton columns={4} rows={5} />
        </div>
      ) : activeCategories.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <EmptyState
            icon={Layers}
            title="No categories yet"
            description="Add a category to start organizing your services."
            action={
              <Button onClick={() => setCategoryFormOpen(true)}>
                <Plus className="h-4 w-4" aria-hidden />
                Add category
              </Button>
            }
          />
        </div>
      ) : (
        <div className="space-y-8">
          {groupedCategories.map((group) => (
            <section key={group.name} className="space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <h2 className="text-xl font-bold text-slate-900">
                  {group.name}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {group.categories.length} categor
                  {group.categories.length === 1 ? 'y' : 'ies'}
                </p>
              </div>

              {group.categories.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500">
                  No categories in this group yet.
                </p>
              ) : (
                <div className="space-y-5">
                  {group.categories.map((category) => {
                    const items = categoryServices(category);
                    const activeCount = items.filter(
                      (service) => service.isActive,
                    ).length;

                    const isExpanded =
                      expandedCategory === category.id;

                    const servicesId =
                      `category-services-${category.id}`;

                    const headingId =
                      `category-heading-${category.id}`;

                    return (
                      <section
                        key={category.id}
                        aria-labelledby={headingId}
                        className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                      >
                        <header className="flex flex-col gap-3 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4">
                          <button
                            type="button"
                            aria-expanded={isExpanded}
                            aria-controls={servicesId}
                            onClick={() => toggleCategory(category.id)}
                            className="group flex w-full min-w-0 flex-1 items-center justify-between gap-3 rounded-lg text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                          >
                            <span className="flex min-w-0 items-center gap-3">
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand-100 bg-brand-50 text-brand-600">
                                <Layers className="h-5 w-5" aria-hidden />
                              </span>

                              <span className="min-w-0">
                                <span className="flex flex-wrap items-center gap-2">
                                  <span
                                    id={headingId}
                                    role="heading"
                                    aria-level={3}
                                    className="break-words text-base font-semibold text-slate-900"
                                  >
                                    {category.name}
                                  </span>

                                  <Badge
                                    tone={
                                      activeCount > 0
                                        ? 'success'
                                        : 'neutral'
                                    }
                                  >
                                    {activeCount > 0
                                      ? 'Active'
                                      : 'No active services'}
                                  </Badge>
                                </span>

                                <span className="mt-1 block text-sm text-slate-500">
                                  {items.length} service
                                  {items.length === 1 ? '' : 's'} in this category
                                </span>
                              </span>
                            </span>

                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors group-hover:border-brand-200 group-hover:text-brand-600">
                              <ChevronDown
                                className={cn(
                                  'h-4 w-4 transition-transform duration-300',
                                  isExpanded && 'rotate-180',
                                )}
                                aria-hidden
                              />
                            </span>
                          </button>

                          <Button
                            variant="secondary"
                            size="sm"
                            className="w-full shrink-0 sm:w-auto"
                            onClick={() => openNewService(category.name)}
                          >
                            <Plus className="h-4 w-4" aria-hidden />
                            Add service
                          </Button>
                        </header>

                        <div
                          id={servicesId}
                          role="region"
                          aria-labelledby={headingId}
                          aria-hidden={!isExpanded}
                          inert={!isExpanded}
                          className={cn(
                            'grid transition-[grid-template-rows,opacity] duration-300 ease-in-out motion-reduce:transition-none',
                            isExpanded
                              ? 'grid-rows-[1fr] opacity-100'
                              : 'grid-rows-[0fr] opacity-0',
                          )}
                        >
                          <div className="min-h-0 overflow-hidden">
                            <div className="border-t border-slate-100">
                              {items.length === 0 ? (
                                <div className="px-5 py-8 text-center">
                                  <p className="text-sm text-slate-500">
                                    No services in this category yet.
                                  </p>

                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    className="mt-3"
                                    onClick={() => openNewService(category.name)}
                                  >
                                    <Plus className="h-4 w-4" aria-hidden />
                                    Add the first service
                                  </Button>
                                </div>
                              ) : (
                                <div className="grid min-w-0 grid-cols-1 gap-3 p-3 sm:grid-cols-2 sm:p-4 xl:grid-cols-3">
                                  {items.map((service) => (
                                    <article
                                      key={service.id}
                                      className="flex min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5"
                                    >
                                      <div className="flex min-w-0 items-start gap-3">
                                        <ServiceIcon
                                          service={service}
                                          icon={metadata.serviceIcons[service.id]}
                                        />

                                        <div className="min-w-0 flex-1">
                                          <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
                                            <h3 className="min-w-0 break-words text-sm font-semibold text-slate-900">
                                              {service.name}
                                            </h3>

                                            <span className="shrink-0 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold tabular-nums text-emerald-700">
                                              {formatMoney(service.visitFee)}
                                            </span>
                                          </div>

                                          <p className="mt-1 line-clamp-2 min-h-9 text-xs leading-5 text-slate-500">
                                            {service.description}
                                          </p>
                                        </div>
                                      </div>

                                      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                                        <Badge
                                          tone={
                                            service.isActive
                                              ? 'success'
                                              : 'neutral'
                                          }
                                        >
                                          {service.isActive ? 'Active' : 'Hidden'}
                                        </Badge>

                                        <div className="flex items-center gap-1">
                                          <button
                                            type="button"
                                            onClick={() => openEditService(service)}
                                            aria-label={`Edit ${service.name}`}
                                            className="rounded-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                                          >
                                            <Pencil className="h-4 w-4" aria-hidden />
                                          </button>

                                          <button
                                            type="button"
                                            onClick={() => setDeleting(service)}
                                            aria-label={`Hide ${service.name}`}
                                            className="rounded-md p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                                          >
                                            <Trash2 className="h-4 w-4" aria-hidden />
                                          </button>
                                        </div>
                                      </div>
                                    </article>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </section>
                    );
                  })}
                </div>
              )}
            </section>
          ))}

          {categoriesWithOther.length > 0 && (
            <section className="space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <h2 className="text-xl font-bold text-slate-900">
                  Other Services
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Categories that have not been assigned to a standard service group.
                </p>
              </div>

              <div className="space-y-5">
                {categoriesWithOther.map((category) => {
                  const items = categoryServices(category);
                  const isExpanded = expandedCategory === category.id;
                  const headingId = `category-heading-${category.id}`;
                  const servicesId = `category-services-${category.id}`;

                  return (
                    <section
                      key={category.id}
                      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                    >
                      <header className="flex flex-col gap-3 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <button
                          type="button"
                          aria-expanded={isExpanded}
                          aria-controls={servicesId}
                          onClick={() => toggleCategory(category.id)}
                          className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left"
                        >
                          <span className="min-w-0">
                            <span
                              id={headingId}
                              role="heading"
                              aria-level={3}
                              className="block break-words font-semibold text-slate-900"
                            >
                              {category.name}
                            </span>
                            <span className="mt-1 block text-sm text-slate-500">
                              {items.length} service{items.length === 1 ? '' : 's'}
                            </span>
                          </span>
                          <ChevronDown
                            className={cn(
                              'h-4 w-4 shrink-0 transition-transform',
                              isExpanded && 'rotate-180',
                            )}
                          />
                        </button>

                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => openNewService(category.name)}
                        >
                          <Plus className="h-4 w-4" aria-hidden />
                          Add service
                        </Button>
                      </header>

                      {isExpanded && (
                        <div
                          id={servicesId}
                          className="grid grid-cols-1 gap-3 border-t border-slate-100 p-3 sm:grid-cols-2 xl:grid-cols-3"
                        >
                          {items.map((service) => (
                            <article
                              key={service.id}
                              className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-slate-200 p-4"
                            >
                              <div className="flex min-w-0 items-center gap-3">
                                <ServiceIcon
                                  service={service}
                                  icon={metadata.serviceIcons[service.id]}
                                />
                                <div className="min-w-0">
                                  <p className="break-words text-sm font-semibold">
                                    {service.name}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {formatMoney(service.visitFee)}
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => openEditService(service)}
                                aria-label={`Edit ${service.name}`}
                                className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                            </article>
                          ))}
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            </section>
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
        categories={categories}
        initialCategory={serviceCategory}
        icon={
          editing?.id
            ? metadata.serviceIcons[editing.id]
            : undefined
        }
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
