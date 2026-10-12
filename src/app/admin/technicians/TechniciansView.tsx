'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Ban, CircleCheck, Eye, FileX, HardHat, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { AccountStatusBadge } from '@/components/accounts/AccountStatus';
import { EditTechnicianDrawer } from '@/components/technicians/EditTechnicianDrawer';
import { VerificationBadge } from '@/components/technicians/VerificationBadge';
import {
  ActionMenu,
  Avatar,
  Button,
  Card,
  ChipGroup,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  PageHeader,
  Pagination,
  SearchInput,
  SegmentedTabs,
  Select,
  Table,
  TableSkeleton,
  Td,
  Th,
  Tr,
  useToast,
} from '@/components/ui';
import { SERVICE_CATEGORIES, type ServiceCategory } from '@/config/services';
import { useAdminStats } from '@/hooks/useCustomers';
import {
  useDeleteTechnician,
  useRejectVerification,
  useTechnicians,
  useUpdateTechnicianStatus,
} from '@/hooks/useTechnicians';
import { useDebouncedValue, useUrlFilters } from '@/hooks/useUrlFilters';
import { DEFAULT_PAGE_SIZE } from '@/lib/api/mock-utils';
import { cn, formatDate } from '@/lib/utils';
import { ACCOUNT_STATUSES, ACCOUNT_STATUS_LABEL, type AccountStatus } from '@/types/customer';
import type { Technician, VerificationStatus } from '@/types/technician';

const FILTER_KEYS = ['search', 'verification', 'status', 'trade', 'available'] as const;
const AVAILABILITY = ['online', 'offline'] as const;
type Tab = 'all' | VerificationStatus;

export function TechniciansView() {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  // Row actions from the Manage menu: the technician being edited, or the confirmation that is open.
  const [editing, setEditing] = useState<Technician | null>(null);
  const [confirm, setConfirm] = useState<{ action: 'status' | 'reject' | 'delete'; technician: Technician } | null>(null);
  const toast = useToast();
  const updateStatus = useUpdateTechnicianStatus();
  const reject = useRejectVerification();
  const remove = useDeleteTechnician();

  const run = async (action: () => Promise<unknown>, success: string) => {
    try {
      await action();
      toast(success);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Something went wrong', 'error');
    } finally {
      setConfirm(null);
    }
  };
  const { values, page, setParams } = useUrlFilters(FILTER_KEYS);
  const [search, setSearch] = useState(values.search ?? '');
  const debouncedSearch = useDebouncedValue(search);

  useEffect(() => {
    if (debouncedSearch !== (values.search ?? '')) setParams({ search: debouncedSearch });
  }, [debouncedSearch, values.search, setParams]);

  const verification = values.verification as VerificationStatus | undefined;
  const status = values.status as AccountStatus | undefined;
  const trade = values.trade as ServiceCategory | undefined;
  const availability = values.available as (typeof AVAILABILITY)[number] | undefined;

  const { data, isLoading, isError, error, refetch, isFetching } = useTechnicians({
    search: values.search,
    verification,
    status,
    trade,
    available: availability ? availability === 'online' : undefined,
    page,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const { data: stats } = useAdminStats();

  const tabs: { value: Tab; label: string; count?: number }[] = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending review', count: stats?.pendingVerifications },
    { value: 'verified', label: 'Verified' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'not_submitted', label: 'Not submitted' },
  ];
  const hasFilters = Boolean(values.search || verification || status || trade || availability);

  return (
    <>
      <PageHeader
        title="Technicians"
        description="Verify and manage technicians."
        actions={
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden /> Add technician
          </Button>
        }
      />

      <div className="mb-4 space-y-3">
        <SegmentedTabs
          label="Verification status"
          tabs={tabs}
          value={verification ?? 'all'}
          onChange={(tab) => setParams({ verification: tab === 'all' ? undefined : tab })}
        />
        <div className="flex flex-col gap-3 md:flex-row">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by name, phone or email"
            className="md:flex-1"
          />
          <Select
            value={trade ?? ''}
            onChange={(e) => setParams({ trade: e.target.value || undefined })}
            aria-label="Filter by service"
            className="md:w-56"
          >
            <option value="">All services</option>
            {SERVICE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-3 xl:flex-row xl:gap-6">
          <ChipGroup
            label="Account"
            options={ACCOUNT_STATUSES}
            value={status}
            onChange={(v) => setParams({ status: v })}
            getLabel={(v) => ACCOUNT_STATUS_LABEL[v]}
          />
          <ChipGroup
            label="Availability"
            options={AVAILABILITY}
            value={availability}
            onChange={(v) => setParams({ available: v })}
            getLabel={(v) => (v === 'online' ? 'Online' : 'Offline')}
          />
        </div>
      </div>

      <Card className={cn('overflow-hidden', isFetching && !isLoading && 'opacity-70 transition-opacity')}>
        {isError ? (
          <ErrorState message={error.message} onRetry={() => refetch()} />
        ) : !isLoading && data?.items.length === 0 ? (
          <EmptyState
            icon={HardHat}
            title="No technicians found"
            description={hasFilters ? 'Try a different search or clear the filters.' : 'No technicians have signed up yet.'}
          />
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>Technician</Th>
                  <Th>Verification</Th>
                  <Th>Account</Th>
                  <Th>Rating</Th>
                  <Th>Jobs</Th>
                  <Th>Experience</Th>
                  <Th>Joined</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {isLoading || !data ? (
                  <TableSkeleton columns={8} />
                ) : (
                  data.items.map((t) => (
                    <Tr key={t.id} onClick={() => router.push(`/admin/technicians/${t.id}`)} label={`Open ${t.name}`}>
                      <Td>
                        <div className="flex items-center gap-3">
                          <span className="relative">
                            <Avatar name={t.name} />
                            {t.isAvailable && (
                              <span
                                className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-green-500"
                                title="Online"
                              />
                            )}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-900">{t.name}</p>
                            <p className="truncate text-xs text-slate-500">{t.trades.join(' · ')}</p>
                          </div>
                        </div>
                      </Td>
                      <Td>
                        <VerificationBadge status={t.verification.status} />
                      </Td>
                      <Td>
                        <AccountStatusBadge status={t.status} />
                      </Td>
                      <Td>
                        {t.jobsCompleted > 0 ? (
                          <span className="inline-flex items-center gap-1 font-medium text-slate-900">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />
                            {t.rating.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </Td>
                      <Td className="text-slate-600">{t.jobsCompleted}</Td>
                      <Td className="whitespace-nowrap text-slate-600">{t.yearsExperience} yrs</Td>
                      <Td className="whitespace-nowrap text-slate-600">{formatDate(t.createdAt)}</Td>
                      <Td>
                        <ActionMenu
                          ariaLabel={`Manage ${t.name}`}
                          items={[
                            { label: 'View profile', icon: Eye, onSelect: () => router.push(`/admin/technicians/${t.id}`) },
                            { label: 'Edit', icon: Pencil, onSelect: () => setEditing(t) },
                            {
                              label: t.status === 'suspended' ? 'Reactivate' : 'Suspend',
                              icon: t.status === 'suspended' ? CircleCheck : Ban,
                              onSelect: () => setConfirm({ action: 'status', technician: t }),
                            },
                            {
                              label: 'Reject documents',
                              icon: FileX,
                              danger: true,
                              hidden: t.verification.status !== 'pending',
                              onSelect: () => setConfirm({ action: 'reject', technician: t }),
                            },
                            {
                              label: 'Delete',
                              icon: Trash2,
                              danger: true,
                              onSelect: () => setConfirm({ action: 'delete', technician: t }),
                            },
                          ]}
                        />
                      </Td>
                    </Tr>
                  ))
                )}
              </tbody>
            </Table>
            {data && (
              <Pagination
                page={data.page}
                pageSize={data.pageSize}
                total={data.total}
                onPageChange={(p) => setParams({ page: p })}
              />
            )}
          </>
        )}
      </Card>

      <EditTechnicianDrawer open={addOpen} onClose={() => setAddOpen(false)} />
      {editing && <EditTechnicianDrawer technician={editing} open onClose={() => setEditing(null)} />}

      {/* Same wording as on the technician profile (AccountStatus, VerificationPanel). */}
      {confirm?.action === 'status' &&
        (confirm.technician.status === 'suspended' ? (
          <ConfirmDialog
            open
            onClose={() => setConfirm(null)}
            loading={updateStatus.isPending}
            title={`Reactivate ${confirm.technician.name}?`}
            description="They will regain access to Fundi immediately."
            confirmLabel="Reactivate"
            onConfirm={() =>
              run(
                () => updateStatus.mutateAsync({ id: confirm.technician.id, status: 'active' }),
                `${confirm.technician.name} reactivated`,
              )
            }
          />
        ) : (
          <ConfirmDialog
            open
            onClose={() => setConfirm(null)}
            loading={updateStatus.isPending}
            destructive
            title={`Suspend ${confirm.technician.name}?`}
            description="They will be signed out and cannot use Fundi until reactivated. You can undo this at any time."
            confirmLabel="Suspend account"
            onConfirm={() =>
              run(
                () => updateStatus.mutateAsync({ id: confirm.technician.id, status: 'suspended' }),
                `${confirm.technician.name} suspended`,
              )
            }
          />
        ))}
      {confirm?.action === 'reject' && (
        <ConfirmDialog
          open
          onClose={() => setConfirm(null)}
          loading={reject.isPending}
          destructive
          title={`Reject ${confirm.technician.name}?`}
          description="Use this when the ID or certificates are not valid. The technician will not receive jobs until they resubmit and are approved."
          confirmLabel="Reject"
          reasonLabel="Why are the documents not valid?"
          onConfirm={(reason) =>
            run(
              () => reject.mutateAsync({ id: confirm.technician.id, reason }),
              `Verification rejected for ${confirm.technician.name}`,
            )
          }
        />
      )}
      {confirm?.action === 'delete' && (
        <ConfirmDialog
          open
          onClose={() => setConfirm(null)}
          loading={remove.isPending}
          destructive
          title={`Delete ${confirm.technician.name}?`}
          description="Their profile and account are removed permanently. To keep their history, suspend the account instead."
          confirmLabel="Delete technician"
          onConfirm={() =>
            run(() => remove.mutateAsync(confirm.technician.id), `${confirm.technician.name} deleted`)
          }
        />
      )}
    </>
  );
}
