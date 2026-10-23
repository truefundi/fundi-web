'use client';

import { useState } from 'react';
import { Pencil, Plus, Tags, Trash2, Wrench } from 'lucide-react';
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
import { getServiceGroup, SERVICE_GROUPS, SERVICE_CATEGORY_STYLE, type ServiceCategory } from '@/config/services';
import { useDeleteService, useServices } from '@/hooks/useServices';
import { formatMoney } from '@/lib/jobs';
import { cn } from '@/lib/utils';
import type { Service } from '@/types/service';

/** Built-in services keep their icon and colour; new ones get a neutral wrench. */
function ServiceIcon({ name }: { name: string }) {
  const style = SERVICE_CATEGORY_STYLE[name as ServiceCategory];
  const Icon = style?.icon ?? Wrench;
  return (
    <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', style?.className ?? 'bg-slate-100 text-slate-600')}>
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

  const openForm = (service?: Service) => {
    setEditing(service);
    setFormOpen(true);
  };
  const groupedServices = SERVICE_GROUPS.map((category) => ({
    category,
    services: (data ?? []).filter((service) => (service.category ?? getServiceGroup(service.name)) === category),
  }));

  return (
    <>
      <PageHeader
        title="Service Categories"
        description="The services customers can request and technicians can offer."
        actions={
          <Button onClick={() => openForm()}>
            <Plus className="h-4 w-4" aria-hidden /> Add service
          </Button>
        }
      />

      <Card className="overflow-hidden">
        {isError ? (
          <ErrorState message={error.message} onRetry={() => refetch()} />
        ) : !isLoading && data?.length === 0 ? (
          <EmptyState
            icon={Tags}
            title="No services yet"
            description="Add the first service customers can request."
            action={<Button onClick={() => openForm()}>Add service</Button>}
          />
        ) : (
          <div className="divide-y divide-slate-200">
            {isLoading || !data ? (
              <Table>
                <tbody>
                  <TableSkeleton columns={5} rows={8} />
                </tbody>
              </Table>
            ) : (
              groupedServices.map(({ category, services }) => (
                <section key={category} aria-labelledby={`service-group-${category.replaceAll(' ', '-')}`}>
                  <h2
                    id={`service-group-${category.replaceAll(' ', '-')}`}
                    className="bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-700"
                  >
                    {category}
                    <span className="ml-2 font-normal text-slate-500">({services.length})</span>
                  </h2>
                  {services.length > 0 ? (
                    <Table>
                      <thead>
                        <tr>
                          <Th>Service</Th>
                          <Th>Visit fee</Th>
                          <Th>Emergency fee</Th>
                          <Th>Status</Th>
                          <Th><span className="sr-only">Actions</span></Th>
                        </tr>
                      </thead>
                      <tbody>
                        {services.map((service) => (
                          <Tr key={service.id}>
                            <Td>
                              <div className="flex items-center gap-3">
                                <ServiceIcon name={service.name} />
                                <div className="min-w-0">
                                  <p className="font-medium text-slate-900">{service.name}</p>
                                  <p className="max-w-md truncate text-xs text-slate-500">{service.description}</p>
                                </div>
                              </div>
                            </Td>
                            <Td className="whitespace-nowrap text-slate-700">{formatMoney(service.visitFee)}</Td>
                            <Td className="whitespace-nowrap text-slate-700">{formatMoney(service.emergencyVisitFee)}</Td>
                            <Td>
                              <Badge tone={service.isActive ? 'success' : 'neutral'}>{service.isActive ? 'Active' : 'Hidden'}</Badge>
                            </Td>
                            <Td className="text-right">
                              <div className="inline-flex gap-1">
                                <Button size="sm" variant="ghost" onClick={() => openForm(service)} aria-label={`Edit ${service.name}`}>
                                  <Pencil className="h-4 w-4" aria-hidden /> Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-600 hover:bg-red-50"
                                  onClick={() => setDeleting(service)}
                                  aria-label={`Delete ${service.name}`}
                                >
                                  <Trash2 className="h-4 w-4" aria-hidden /> Delete
                                </Button>
                              </div>
                            </Td>
                          </Tr>
                        ))}
                      </tbody>
                    </Table>
                  ) : (
                    <p className="px-5 py-4 text-sm text-slate-500">No services in this category yet.</p>
                  )}
                </section>
              ))
            )}
          </div>
        )}
      </Card>

      <ServiceFormDialog open={formOpen} onClose={() => setFormOpen(false)} service={editing} />
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
              toast(err.message || 'Could not delete the service', 'error');
              setDeleting(null);
            },
          });
        }}
      />
    </>
  );
}
