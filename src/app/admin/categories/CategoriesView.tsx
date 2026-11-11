'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Layers,
  Pencil,
  Plus,
  Trash2,
  Wrench,
} from 'lucide-react';
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
import { SERVICE_CATEGORY_STYLE, type ServiceCategory } from '@/config/services';
import { useDeleteService, useServices } from '@/hooks/useServices';
import {
  readCatalogAdminMetadata,
  writeCatalogAdminMetadata,
  type AdminCategory,
  type CatalogAdminMetadata,
} from '@/lib/catalog-admin-metadata';
import { formatMoney } from '@/lib/jobs';
import { cn } from '@/lib/utils';
import type { Service } from '@/types/service';

const EMPTY_METADATA: CatalogAdminMetadata = {
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
  const style = SERVICE_CATEGORY_STYLE[service.name as ServiceCategory];
  const Icon = style?.icon ?? Wrench;

  return (
    <span
      className={cn(
        'flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl',
        icon ? 'bg-slate-100' : style?.className ?? 'bg-slate-100 text-slate-600',
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
  const { data, isLoading, isError, error, refetch } = useServices();
  const remove = useDeleteService();

  const [metadata, setMetadata] = useState(EMPTY_METADATA);
  const [metadataError, setMetadataError] = useState('');
  const [metadataLoaded, setMetadataLoaded] = useState(false);
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [serviceFormOpen, setServiceFormOpen] = useState(false);
  const [serviceCategory, setServiceCategory] = useState<string>();
  const [editing, setEditing] = useState<Service>();
  const [deleting, setDeleting] = useState<Service | null>(null);

  const services = useMemo(() => data ?? [], [data]);

  const loadMetadata = () => {
    try {
      setMetadata(readCatalogAdminMetadata());
      setMetadataError('');
    } catch (cause) {
      const message = cause instanceof Error
        ? cause.message
        : 'Could not load saved category details.';
      setMetadataError(message);
    } finally {
      setMetadataLoaded(true);
    }
  };

  useEffect(() => {
    loadMetadata();
  }, []);

  const categories = useMemo(() => {
    const names = new Set([
      ...metadata.categories.map((category) => category.name),
      ...services.map((service) => service.category),
    ]);
    return [...names].filter(Boolean).sort((a, b) => a.localeCompare(b));
  }, [metadata.categories, services]);

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

  const saveCategory = (category: AdminCategory) => {
    const nextMetadata: CatalogAdminMetadata = {
      ...metadata,
      categories: [...metadata.categories, category],
    };
    try {
      writeCatalogAdminMetadata(nextMetadata);
      setMetadata(nextMetadata);
      setCategoryFormOpen(false);
      toast(`${category.name} added`);
    } catch (cause) {
      toast(
        cause instanceof Error ? cause.message : 'Could not save the category.',
        'error',
      );
    }
  };

  const saveServiceIcon = (serviceId: string, icon: string | null) => {
    const serviceIcons = { ...metadata.serviceIcons };
    if (icon) serviceIcons[serviceId] = icon;
    else delete serviceIcons[serviceId];

    const nextMetadata = { ...metadata, serviceIcons };
    try {
      writeCatalogAdminMetadata(nextMetadata);
      setMetadata(nextMetadata);
      return true;
    } catch (cause) {
      toast(
        cause instanceof Error ? cause.message : 'Could not save the service icon.',
        'error',
      );
      return false;
    }
  };

  return (
    <>
      <PageHeader
        title="Categories & Services"
        description="Organize service offerings into categories and manage their booking fees."
        actions={
          <Button onClick={() => setCategoryFormOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            Add category
          </Button>
        }
      />

      {isError ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <ErrorState message={error.message} onRetry={() => refetch()} />
        </div>
      ) : metadataError ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <ErrorState message={metadataError} onRetry={loadMetadata} />
        </div>
      ) : isLoading || !data || !metadataLoaded ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5">
          <TableSkeleton columns={4} rows={5} />
        </div>
      ) : categories.length === 0 ? (
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
        <div className="space-y-5">
          {categories.map((category) => {
            const categoryServices = services.filter(
              (service) => service.category === category,
            );
            const description = metadata.categories.find(
              (item) => item.name === category,
            )?.description;

            return (
              <section
                key={category}
                aria-labelledby={`category-${category}`}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
              >
                <header className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand-100 bg-brand-50 text-brand-600">
                      <Layers className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2
                          id={`category-${category}`}
                          className="truncate text-base font-semibold text-slate-900"
                        >
                          {category}
                        </h2>
                        <Badge tone={categoryServices.some((service) => service.isActive) ? 'success' : 'neutral'}>
                          {categoryServices.some((service) => service.isActive) ? 'Active' : 'No active services'}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        {description || `${categoryServices.length} service${categoryServices.length === 1 ? '' : 's'} in this category`}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => openNewService(category)}
                  >
                    <Plus className="h-4 w-4" aria-hidden />
                    Add service
                  </Button>
                </header>

                {categoryServices.length === 0 ? (
                  <div className="px-5 py-8 text-center">
                    <p className="text-sm text-slate-500">No services in this category yet.</p>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="mt-3"
                      onClick={() => openNewService(category)}
                    >
                      <Plus className="h-4 w-4" aria-hidden />
                      Add the first service
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
                    {categoryServices.map((service) => (
                      <article
                        key={service.id}
                        className="rounded-xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-sm"
                      >
                        <div className="flex items-start gap-3">
                          <ServiceIcon
                            service={service}
                            icon={metadata.serviceIcons[service.id]}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="min-w-0 text-sm font-semibold text-slate-900">
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
                          <Badge tone={service.isActive ? 'success' : 'neutral'}>
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
                              aria-label={`Delete ${service.name}`}
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
              </section>
            );
          })}
        </div>
      )}

      <CategoryFormDialog
        open={categoryFormOpen}
        onClose={() => setCategoryFormOpen(false)}
        existingNames={categories}
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
        icon={editing ? metadata.serviceIcons[editing.id] : undefined}
        onIconChange={saveServiceIcon}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title={`Delete ${deleting?.name ?? 'service'}?`}
        description="Customers will no longer be able to request it. Services with open jobs cannot be deleted: hide them instead."
        confirmLabel="Delete service"
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
                  ? `${serviceName} deleted`
                  : `${serviceName} deleted, but its saved icon could not be removed`,
                iconRemoved ? 'success' : 'error',
              );
            },
            onError: (err) => {
              toast(err.message || 'Could not delete the service', 'error');
              setDeleting(null);
            },
          });
        }}
      />
    </>
  );
}
