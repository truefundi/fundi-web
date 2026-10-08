"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import {
  AccountStatusAction,
  AccountStatusBadge,
} from "@/components/accounts/AccountStatus";
import {
  Avatar,
  Card,
  ChipGroup,
  EmptyState,
  ErrorState,
  PageHeader,
  Pagination,
  SearchInput,
  Table,
  TableSkeleton,
  Td,
  Th,
  Tr,
} from "@/components/ui";
import { useUpdateUserStatus, useUsers } from "@/hooks/useUsers";
import { useDebouncedValue, useUrlFilters } from "@/hooks/useUrlFilters";
import { DEFAULT_PAGE_SIZE } from "@/lib/api/mock-utils";
import { cn, formatDate, formatPhone } from "@/lib/utils";
import {
  ACCOUNT_STATUSES,
  ACCOUNT_STATUS_LABEL,
  type AccountStatus,
} from "@/types/customer";
import { USER_ROLES } from "@/types/user";

const FILTER_KEYS = ["search", "role", "status"] as const;

export function UsersView() {
  const { values, page, setParams } = useUrlFilters(FILTER_KEYS);
  const [search, setSearch] = useState(values.search ?? "");
  const debouncedSearch = useDebouncedValue(search);

  useEffect(() => {
    if (debouncedSearch !== (values.search ?? ""))
      setParams({ search: debouncedSearch });
  }, [debouncedSearch, values.search, setParams]);

  const role = USER_ROLES.find((candidate) => candidate === values.role);
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

  return (
    <>
      <PageHeader
        title="Users"
        description="View and manage Fundi user accounts."
      />

      <div className="mb-4 space-y-3">
        <ChipGroup
          label="Role"
          options={USER_ROLES}
          value={role}
          onChange={(value) => setParams({ role: value })}
          getLabel={(value) => value[0] + value.slice(1).toLowerCase()}
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
        ) : role === "ADMIN" && !isLoading && data?.items.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Admin accounts are not available"
            description="The current backend API supports customer and technician account listings only."
          />
        ) : !isLoading && data?.items.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No users found"
            description={
              hasFilters
                ? "Try a different search or clear the filters."
                : "No users yet."
            }
          />
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>User</Th>
                  <Th>Contact</Th>
                  <Th>Role</Th>
                  <Th>Status</Th>
                  <Th>Joined</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {isLoading || !data ? (
                  <TableSkeleton columns={6} />
                ) : (
                  data.items.map((user) => (
                    <Tr key={`${user.role}-${user.id}`}>
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
                      <Td className="text-slate-600">{user.role}</Td>
                      <Td>
                        <AccountStatusBadge status={user.status} />
                      </Td>
                      <Td className="whitespace-nowrap text-slate-600">
                        {formatDate(user.createdAt)}
                      </Td>
                      <Td className="text-right">
                        {user.role === "ADMIN" ? (
                          <span className="text-slate-400">—</span>
                        ) : (
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
                        )}
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
                onPageChange={(nextPage) => setParams({ page: nextPage })}
              />
            )}
          </>
        )}
      </Card>
    </>
  );
}
