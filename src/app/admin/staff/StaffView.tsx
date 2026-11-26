"use client";

import { useEffect, useRef, useState } from "react";
import {
  Plus,
  Users,
  ShieldCheck,
  UserCheck,
  Headset,
  Calculator,
  Pencil,
  Trash2,
  ChevronDown,
  Ban,
  CheckCircle2,
} from "lucide-react";
import { USER_ROLE_LABELS, type UserRole } from "@/types/user";
import { AccountStatusBadge } from "@/components/accounts/AccountStatus";
import { UserFormDialog } from "@/components/users/UserFormDialog";
import {
  Avatar,
  Button,
  Modal,
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
  useToast,
} from "@/components/ui";
import { DEFAULT_PAGE_SIZE } from "@/config/pagination";
import {
  isProtectedSuperAdmin,
  useDeleteUser,
  useUpdateUserStatus,
  useUsers,
  type ManagedStaffRecord,
} from "@/hooks/useUsers";
import { useDebouncedValue, useUrlFilters } from "@/hooks/useUrlFilters";
import { cn, formatDate, formatPhone } from "@/lib/utils";
import {
  ACCOUNT_STATUSES,
  ACCOUNT_STATUS_LABEL,
  type AccountStatus,
} from "@/types/customer";

const FILTER_KEYS = ["search", "role", "status"] as const;
const STAFF_ROLES: UserRole[] = ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"];

function StaffRowActionsDropdown({
  user,
  disabled,
  onEdit,
  onToggleStatus,
  onDelete,
}: {
  user: ManagedStaffRecord;
  disabled: boolean;
  onEdit: () => void;
  onToggleStatus: (nextStatus: AccountStatus) => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    const btn = buttonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const menuWidth = 176;
    const menuHeight = 132;
    const padding = 12;

    const left = Math.min(
      Math.max(padding, rect.right - menuWidth),
      window.innerWidth - menuWidth - padding,
    );

    const spaceBelow = window.innerHeight - rect.bottom - padding;
    const top =
      spaceBelow < menuHeight && rect.top > menuHeight + padding
        ? Math.max(padding, rect.top - menuHeight - 6)
        : Math.min(rect.bottom + 6, window.innerHeight - menuHeight - padding);

    setMenuPos({ top, left });
  };

  useEffect(() => {
    if (!open) return;
    updatePosition();

    const handleOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const handleReposition = () => updatePosition();

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("scroll", handleReposition, true);
    window.addEventListener("resize", handleReposition);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("scroll", handleReposition, true);
      window.removeEventListener("resize", handleReposition);
    };
  }, [open]);

  const protectedUser = isProtectedSuperAdmin(user);
  const isSuspended = user.status === ("suspended" as AccountStatus);
  const nextStatus: AccountStatus = isSuspended
    ? ("active" as AccountStatus)
    : ("suspended" as AccountStatus);

  return (
    <div className="relative inline-block text-left">
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => {
          if (!open) updatePosition();
          setOpen((prev) => !prev);
        }}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-2xs transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span>Manage</span>
        <ChevronDown className="h-4 w-4 text-slate-500" />
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          style={{ top: `${menuPos.top}px`, left: `${menuPos.left}px` }}
          className="fixed z-50 w-44 rounded-xl border border-slate-200 bg-white py-1 shadow-xl ring-1 ring-black/5"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
            className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
          >
            <Pencil className="h-4 w-4 text-slate-500" />
            Edit
          </button>

          <button
            type="button"
            role="menuitem"
            disabled={protectedUser}
            onClick={() => {
              if (protectedUser) return;
              setOpen(false);
              onToggleStatus(nextStatus);
            }}
            className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSuspended ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Activate
              </>
            ) : (
              <>
                <Ban className="h-4 w-4 text-amber-600" />
                Suspend
              </>
            )}
          </button>

          <div className="my-1 border-t border-slate-100" />

          <button
            type="button"
            role="menuitem"
            disabled={protectedUser}
            onClick={() => {
              if (protectedUser) return;
              setOpen(false);
              onDelete();
            }}
            className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Trash2 className="h-4 w-4 text-red-600" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

export function StaffView() {
  const toast = useToast();
  const { values, page, setParams } = useUrlFilters(FILTER_KEYS);
  const [search, setSearch] = useState(values.search ?? "");
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<ManagedStaffRecord | null>(
    null,
  );
  const [deletingStaff, setDeletingStaff] = useState<ManagedStaffRecord | null>(
    null,
  );
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
  const deleteUser = useDeleteUser();
  const hasFilters = Boolean(values.search || role || status);

  const staffItems = (
    (data?.items ?? []) as unknown as ManagedStaffRecord[]
  ).filter((u) => STAFF_ROLES.includes(u.role as UserRole));

  const activePage = data?.page ?? page;
  const activePageSize = data?.pageSize ?? DEFAULT_PAGE_SIZE;

  const handleToggleStatus = async (
    user: ManagedStaffRecord,
    nextStatus: AccountStatus,
  ) => {
    try {
      await updateStatus.mutateAsync({
        id: user.id,
        role: user.role,
        status: nextStatus,
      });
      toast(
        `${user.name} ${nextStatus === "suspended" as AccountStatus ? "suspended" : "activated"}`,
        "success",
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Could not update staff status";
      toast(message, "error");
    }
  };

  const confirmDeleteStaff = async () => {
    if (!deletingStaff) return;
    if (isProtectedSuperAdmin(deletingStaff)) {
      toast("The primary Super Admin account cannot be deleted.", "error");
      setDeletingStaff(null);
      return;
    }
    try {
      await deleteUser.mutateAsync(deletingStaff.id);
      toast(`${deletingStaff.name} removed from staff`, "success");
      setDeletingStaff(null);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Could not delete staff member";
      toast(message, "error");
    }
  };

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
                  const rowNumber =
                    (activePage - 1) * activePageSize + index + 1;

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
                          {formatPhone(user.phone) || user.phone || "No phone"}
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
                        <StaffRowActionsDropdown
                          user={user}
                          disabled={updateStatus.isPending || deleteUser.isPending}
                          onEdit={() => setEditingStaff(user)}
                          onToggleStatus={(nextStatus) =>
                            handleToggleStatus(user, nextStatus)
                          }
                          onDelete={() => setDeletingStaff(user)}
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

      <UserFormDialog
        open={Boolean(editingStaff)}
        staff={editingStaff}
        onClose={() => setEditingStaff(null)}
      />

      <Modal
        open={Boolean(deletingStaff)}
        onClose={() => setDeletingStaff(null)}
        title="Delete staff member"
        description="Are you sure you want to remove this staff member? This action cannot be undone."
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              disabled={deleteUser.isPending}
              onClick={() => setDeletingStaff(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              loading={deleteUser.isPending}
              disabled={deleteUser.isPending}
              onClick={confirmDeleteStaff}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete staff
            </Button>
          </>
        }
      >
        {deletingStaff && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
            <p className="font-medium text-slate-900">{deletingStaff.name}</p>
            <p className="text-xs text-slate-500">{deletingStaff.email}</p>
          </div>
        )}
      </Modal>
    </>
  );
}
