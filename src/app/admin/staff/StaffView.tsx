"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Users,
  ShieldCheck,
  UserCheck,
  Headset,
  Calculator,
} from "lucide-react";
import { USER_ROLE_LABELS, type UserRole } from "@/types/user";
import {
  AccountStatusAction,
  AccountStatusBadge,
} from "@/components/accounts/AccountStatus";
import { UserFormDialog } from "@/components/users/UserFormDialog";
import {
  Avatar,
  Button,
  Card,
  ChipGroup,
  EmptyState,
  ErrorState,
  PageHeader,
  SearchInput,
  Table,
  TableSkeleton,
  Td,
  Th,
  Tr,
} from "@/components/ui";
import { DEFAULT_PAGE_SIZE } from "@/config/pagination";
import { useUpdateUserStatus, useUsers } from "@/hooks/useUsers";
import { useDebouncedValue, useUrlFilters } from "@/hooks/useUrlFilters";
import { cn, formatDate, formatPhone } from "@/lib/utils";
import {
  ACCOUNT_STATUSES,
  ACCOUNT_STATUS_LABEL,
  type AccountStatus,
} from "@/types/customer";

const FILTER_KEYS = ["search", "role", "status"] as const;
const STAFF_ROLES: UserRole[] = ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"];

export function StaffView() {
  const { values, page, setParams } = useUrlFilters(FILTER_KEYS);
  const [search, setSearch] = useState(values.search ?? "");
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const debouncedSearch = useDebouncedValue(search);

  useEffect(() => {
    if (debouncedSearch !== (values.search ?? ""))
      setParams({ search: debouncedSearch });
  }, [debouncedSearch, values.search, setParams]);

  const role = STAFF_ROLES.find((candidate) => candidate === values.role);
  const status = ACCOUNT_STATUSES.find(
    (candidate) => candidate === values.status,
  );

  const { data, isLoading, isError, error, refetch, isFetching } = useUsers({
    search: values.search,
    role,
    status,
    page,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const updateStatus = useUpdateUserStatus();
  const hasFilters = Boolean(values.search || role || status);

  const staffItems =
    data?.items.filter((u) => STAFF_ROLES.includes(u.role as UserRole)) ?? [];

  const activePage = data?.page ?? page;
  const activePageSize = data?.pageSize ?? DEFAULT_PAGE_SIZE;

  return (
    <>
      <PageHeader
        title="Staff Management"
        description="Manage internal administrative staff, support admins, and accountants."
        actions={
          <Button onClick={() => setIsAddUserOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add staff member
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Total Staff
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {isLoading ? "..." : staffItems.length}
            </p>
          </div>
          <div className="rounded-xl bg-purple-50 p-3 text-purple-600">
            <ShieldCheck className="h-6 w-6" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Super Admins
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {isLoading
                ? "..."
                : staffItems.filter((u) => u.role === "SUPER_ADMIN").length}
            </p>
          </div>
          <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
            <UserCheck className="h-6 w-6" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Admins (Support)
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {isLoading
                ? "..."
                : staffItems.filter((u) => u.role === "ADMIN").length}
            </p>
          </div>
          <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
            <Headset className="h-6 w-6" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Accountants
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {isLoading
                ? "..."
                : staffItems.filter((u) => u.role === "ACCOUNTANT").length}
            </p>
          </div>
          <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
            <Calculator className="h-6 w-6" />
          </div>
        </Card>
      </div>

      <div className="mb-4 space-y-3">
        <ChipGroup
          label="Role"
          options={STAFF_ROLES}
          value={role}
          onChange={(value) => setParams({ role: value })}
          getLabel={(value) => USER_ROLE_LABELS[value as UserRole]}
        />
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by name, phone or email"
            className="lg:w-96"
          />
          <ChipGroup
            label="Status"
            options={ACCOUNT_STATUSES}
            value={status}
            onChange={(value) => setParams({ status: value })}
            getLabel={(value: AccountStatus) => ACCOUNT_STATUS_LABEL[value]}
          />
        </div>
      </div>

      <Card
        className={cn(
          "overflow-hidden",
          isFetching && !isLoading && "opacity-70 transition-opacity",
        )}
      >
        {isError ? (
          <ErrorState message={error.message} onRetry={() => refetch()} />
        ) : !isLoading && staffItems.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No staff members found"
            description={
              hasFilters
                ? "Try a different search or clear the filters."
                : "No staff members added yet."
            }
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th className="w-12">#</Th>
                <Th>Staff Member</Th>
                <Th>Contact</Th>
                <Th>Role</Th>
                <Th>Status</Th>
                <Th>Joined</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {isLoading || !data ? (
                <TableSkeleton columns={7} />
              ) : (
                staffItems.map((user, index) => {
                  const rowNumber = (activePage - 1) * activePageSize + index + 1;

                  return (
                    <Tr key={`${user.role}-${user.id}`}>
                      <Td className="whitespace-nowrap text-xs font-medium text-slate-400">
                        {rowNumber}
                      </Td>
                      <Td>
                        <div className="flex items-center gap-3">
                          <Avatar name={user.name} />
                          <p className="truncate font-medium text-slate-900">
                            {user.name}
                          </p>
                        </div>
                      </Td>
                      <Td>
                        <p className="whitespace-nowrap text-slate-900">
                          {formatPhone(user.phone) || "No phone"}
                        </p>
                        <p className="whitespace-nowrap text-xs text-slate-500">
                          {user.email ?? "No email"}
                        </p>
                      </Td>
                      <Td className="text-slate-600 font-medium">
                        {USER_ROLE_LABELS[
                          user.role as keyof typeof USER_ROLE_LABELS
                        ] ?? user.role}
                      </Td>
                      <Td>
                        <AccountStatusBadge status={user.status} />
                      </Td>
                      <Td className="whitespace-nowrap text-slate-600">
                        {formatDate(user.createdAt)}
                      </Td>
                      <Td className="text-right">
                        <AccountStatusAction
                          name={user.name}
                          status={user.status}
                          loading={updateStatus.isPending}
                          onChange={(next) =>
                            updateStatus.mutateAsync({
                              id: user.id,
                              role: user.role,
                              status: next,
                            })
                          }
                        />
                      </Td>
                    </Tr>
                  );
                })
              )}
            </tbody>
          </Table>
        )}
      </Card>

      <UserFormDialog
        open={isAddUserOpen}
        onClose={() => setIsAddUserOpen(false)}
      />
    </>
  );
}