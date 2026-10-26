
'use client';

import { useMemo, useState } from 'react';
import {
  ChevronDown,
  Pencil,
  Plus,
  Tags,
  Trash2,
  Wrench,
} from 'lucide-react';
import { ServiceFormDialog } from '@/components/services/ServiceFormDialog';
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  PageHeader,
  Table,
  TableSkeleton,
  Td,
  Th,
  Tr,
  useToast,
} from '@/components/ui';
import {
  getServiceGroup,
  SERVICE_GROUPS,
  SERVICE_CATEGORY_STYLE,
  type ServiceCategory,
  type ServiceGroup,
} from '@/config/services';
import { useDeleteService, useServices } from '@/hooks/useServices';
import { formatMoney } from '@/lib/jobs';
import { cn } from '@/lib/utils';
import type { Service } from '@/types/service';

type ServiceFilter = 'All Services' | ServiceGroup;

function getDisplayGroup(service: Service): ServiceGroup {
  const category = String(service.category ?? '');

  if (
    [
      'Car Services',
      'Car Repairment',
      'Car & Garage',
      'Truck & Mechanical',
    ].includes(category)
  ) {
    return 'Car Services';
  }

  if (
    ['Home Services', 'Service Repairment'].includes(category)
  ) {
    return 'Home Services';
  }

  return getServiceGroup(category || service.name);
}

function ServiceIcon({ name }: { name: string }) {
  const style = SERVICE_CATEGORY_STYLE[name as ServiceCategory];
  const Icon = style?.icon ?? Wrench;

  return (
    <span
      className={cn(
        'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
        style?.className ?? 'bg-slate-100 text-slate-600',
      )}
    >
      <Icon className="h-5 w-5" aria-hidden />
    </span>
  );
}

export function CategoriesView() {
  const toast = useToast();
  const { data, isLoading, isError, error, refetch } = useServices();
  const remove = useDeleteService();

  const [editing, setEditing] = useState<Service | undefined>();
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Service | null>(null);
  const [selectedFilter, setSelectedFilter] =
    useState<ServiceFilter>('All Services');
  const [manageOpenFor, setManageOpenFor] = useState<
    Service['id'] | null
  >(null);

  const services = data ?? [];

  const groupedServices = useMemo(
    () =>
      SERVICE_GROUPS.map((category) => ({
        category,
        services: services.filter(
          (service) => getDisplayGroup(service) === category,
        ),
      })),
    [services],
  );

  const visibleServices =
    selectedFilter === 'All Services'
      ? services
      : services.filter(
          (service) => getDisplayGroup(service) === selectedFilter,
        );

  const openForm = (service?: Service) => {
    setEditing(service);
    setFormOpen(true);
    setManageOpenFor(null);
  };

  return (
    <>
      <PageHeader
        title="Service Management"
        description="Manage Home Services and Car Services, their booking fees, and availability."
        actions={
          <Button onClick={() => openForm()}>
            <Plus className="h-4 w-4" aria-hidden />
            Add service
          </Button>
        }
      />

      {/* Category summary and quick filters */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => setSelectedFilter('All Services')}
          aria-pressed={selectedFilter === 'All Services'}
          className={cn(
            'rounded-xl border bg-white p-4 text-left transition hover:border-slate-400',
            selectedFilter === 'All Services'
              ? 'border-slate-900 ring-1 ring-slate-900'
              : 'border-slate-200',
          )}
        >
          <p className="text-sm text-slate-500">All Services</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {services.length}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            View all services
          </p>
        </button>

        {SERVICE_GROUPS.map((group) => {
          const count =
            groupedServices.find((item) => item.category === group)
              ?.services.length ?? 0;

          return (
            <button
              key={group}
              type="button"
              onClick={() => setSelectedFilter(group)}
              aria-pressed={selectedFilter === group}
              className={cn(
                'rounded-xl border bg-white p-4 text-left transition hover:border-slate-400',
                selectedFilter === group
                  ? 'border-slate-900 ring-1 ring-slate-900'
                  : 'border-slate-200',
              )}
            >
              <p className="text-sm text-slate-500">{group}</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {count}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                View category
              </p>
            </button>
          );
        })}
      </div>

      {/* Table heading and filter */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            {selectedFilter}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {visibleServices.length} service
            {visibleServices.length === 1 ? '' : 's'}
          </p>
        </div>

        <label className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-700">
            Category
          </span>
          <select
            value={selectedFilter}
            onChange={(event) =>
              setSelectedFilter(event.target.value as ServiceFilter)
            }
            className="w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 sm:w-52"
          >
            <option value="All Services">All Services</option>
            {SERVICE_GROUPS.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* One compact table for all services or the selected category */}
      <Card className="relative overflow-visible">
        {isError ? (
          <ErrorState
            message={error.message}
            onRetry={() => refetch()}
          />
        ) : isLoading || !data ? (
          <div className="overflow-hidden rounded-xl">
            <Table>
              <tbody>
                <TableSkeleton columns={5} rows={6} />
              </tbody>
            </Table>
          </div>
        ) : visibleServices.length === 0 ? (
          <EmptyState
            icon={Tags}
            title="No services found"
            description="Add a service or choose another category."
            action={
              <Button onClick={() => openForm()}>
                <Plus className="h-4 w-4" aria-hidden />
                Add service
              </Button>
            }
          />
        ) : (
          <div className="w-full overflow-x-auto rounded-xl">
            <Table>
              <thead>
                <tr className="bg-slate-50">
                  <Th className="w-[34%] whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Service
                  </Th>
                  <Th className="w-[22%] whitespace-nowrap px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Category
                  </Th>
                  <Th className="w-[15%] whitespace-nowrap px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Booking Fee
                  </Th>
                  <Th className="w-[12%] whitespace-nowrap px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </Th>
                  <Th className="w-[17%] whitespace-nowrap px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Manage
                  </Th>
                </tr>
              </thead>

              <tbody>
                {visibleServices.map((service) => (
                  <Tr key={service.id}>
                    <Td className="px-4 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <ServiceIcon name={service.name} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {service.name}
                          </p>
                          <p className="mt-1 max-w-[220px] truncate text-xs text-slate-500">
                            {service.description}
                          </p>
                        </div>
                      </div>
                    </Td>

                    <Td className="px-3 py-3">
                      <span className="text-sm text-slate-600">
                        {getDisplayGroup(service)}
                      </span>
                    </Td>

                    <Td className="whitespace-nowrap px-3 py-3 text-right">
                      <span className="text-sm font-semibold tabular-nums text-slate-900">
                        {formatMoney(service.visitFee)}
                      </span>
                    </Td>

                    <Td className="px-3 py-3">
                      <Badge
                        tone={service.isActive ? 'success' : 'neutral'}
                      >
                        {service.isActive ? 'Active' : 'Hidden'}
                      </Badge>
                    </Td>

                    <Td className="px-4 py-3 text-right">
                      <div className="relative inline-block text-left">
                        <button
                          type="button"
                          aria-haspopup="menu"
                          aria-expanded={manageOpenFor === service.id}
                          aria-label={`Manage ${service.name}`}
                          onClick={() =>
                            setManageOpenFor((current) =>
                              current === service.id ? null : service.id,
                            )
                          }
                          className={cn(
                            'inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition',
                            manageOpenFor === service.id
                              ? 'border-slate-400 bg-slate-100 text-slate-900'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
                          )}
                        >
                          Manage
                          <ChevronDown
                            className={cn(
                              'h-4 w-4 transition-transform',
                              manageOpenFor === service.id && 'rotate-180',
                            )}
                            aria-hidden
                          />
                        </button>

                        {manageOpenFor === service.id && (
                          <div
                            role="menu"
                            className="absolute right-0 top-full z-50 mt-2 w-40 rounded-xl border border-slate-200 bg-white p-1.5 text-left shadow-lg"
                          >
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => openForm(service)}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-100"
                            >
                              <Pencil
                                className="h-4 w-4 text-slate-500"
                                aria-hidden
                              />
                              Edit service
                            </button>

                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                setDeleting(service);
                                setManageOpenFor(null);
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-red-600 transition hover:bg-red-50"
                            >
                              <Trash2
                                className="h-4 w-4"
                                aria-hidden
                              />
                              Delete service
                            </button>
                          </div>
                        )}
                      </div>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Card>

      <ServiceFormDialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(undefined);
        }}
        service={editing}
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
              toast(`${deleting.name} deleted`);
              setDeleting(null);
            },
            onError: (err) => {
              toast(
                err.message || 'Could not delete the service',
                'error',
              );
              setDeleting(null);
            },
          });
        }}
      />
    </>
  );
}
