"use client";

// useState stores the input; useEffect syncs its debounced value with the URL.
import { useEffect, useState } from "react";
// Users is the icon shown when the list has no available results.
import { Users } from "lucide-react";
// Shared account controls display status and request supported status changes.
import {
  AccountStatusAction,
  AccountStatusBadge,
} from "@/components/accounts/AccountStatus";
// Shared UI primitives keep the page consistent with the rest of the admin area.
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
// These hooks fetch users and mutate their account status.
import { useUpdateUserStatus, useUsers } from "@/hooks/useUsers";
// These hooks keep filters in the URL and delay search updates while typing.
import { useDebouncedValue, useUrlFilters } from "@/hooks/useUrlFilters";
// Use the same list page size as other admin tables.
import { DEFAULT_PAGE_SIZE } from "@/lib/api/mock-utils";
// Helpers format CSS classes, dates, and phone numbers for display.
import { cn, formatDate, formatPhone } from "@/lib/utils";
// These constants define valid account statuses and their readable labels.
import {
  ACCOUNT_STATUSES,
  ACCOUNT_STATUS_LABEL,
  type AccountStatus,
} from "@/types/customer";
// Supported account roles provide the role filter options.
import { USER_ROLES } from "@/types/user";

// Restrict URL filter management to these user-list query parameters.
const FILTER_KEYS = ["search", "role", "status"] as const;

export function UsersView() {
  // Read current filters/page from the URL and use setParams to update them.
  const { values, page, setParams } = useUrlFilters(FILTER_KEYS);
  // Keep immediate input state separate from the delayed search sent to the API.
  const [search, setSearch] = useState(values.search ?? "");
  // Wait for typing to pause before applying a new search term.
  const debouncedSearch = useDebouncedValue(search);

  // Copy the settled input into the URL so filters survive refreshes and can be shared.
  useEffect(() => {
    // Skip a URL update when the value is already current.
    if (debouncedSearch !== (values.search ?? ""))
      setParams({ search: debouncedSearch });
    // Re-check when typing settles, the URL changes, or the updater changes.
  }, [debouncedSearch, values.search, setParams]);

  // Accept the URL role only if it matches a supported role constant.
  const role = USER_ROLES.find((candidate) => candidate === values.role);
  // Accept the URL status only if it matches a supported status constant.
  const status = ACCOUNT_STATUSES.find(
    (candidate) => candidate === values.status,
  );
  // Fetch the filtered page and retain request state for the UI below.
  const { data, isLoading, isError, error, refetch, isFetching } = useUsers({
    // Search uses the debounced URL value.
    search: values.search,
    // Apply only validated role and status filters.
    role,
    status,
    // Use URL-backed pagination so the current page can be restored.
    page,
    // Keep the number of rows per page consistent with other lists.
    pageSize: DEFAULT_PAGE_SIZE,
  });
  // Expose the status mutation and its pending state to each row action.
  const updateStatus = useUpdateUserStatus();
  // Empty-state text depends on whether any filters are currently active.
  const hasFilters = Boolean(values.search || role || status);

  return (
    // Group the page contents without adding another layout element.
    <>
      {/* Page title and supporting description identify the users management view. */}
      <PageHeader
        title="Users"
        description="View and manage Fundi user accounts."
      />

      {/* Keep the role, search, and status controls above the results table. */}
      <div className="mb-4 space-y-3">
        {/* Role chips list supported roles, show the current selection, and update the URL. */}
        <ChipGroup
          label="Role"
          options={USER_ROLES}
          value={role}
          onChange={(value) => setParams({ role: value })}
          getLabel={(value) => value[0] + value.slice(1).toLowerCase()}
        />
        {/* Stack search and status controls on narrow screens; align them on wide screens. */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          {/* Search by name, phone, or email; input updates are debounced above. */}
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by name, phone or email"
            className="lg:w-96"
          />
          {/* Status chips display readable labels and update the URL filter. */}
          <ChipGroup
            label="Status"
            options={ACCOUNT_STATUSES}
            value={status}
            onChange={(value) => setParams({ status: value })}
            getLabel={(value: AccountStatus) => ACCOUNT_STATUS_LABEL[value]}
          />
        </div>
      </div>

      {/* Frame the results and dim them while a background refresh is running. */}
      <Card
        className={cn(
          "overflow-hidden",
          isFetching && !isLoading && "opacity-70 transition-opacity",
        )}
      >
        {/* Errors take precedence so a failed request is not shown as an empty list. */}
        {isError ? (
          // Show the backend message and allow the administrator to retry.
          <ErrorState message={error.message} onRetry={() => refetch()} />
        ) : // The backend currently does not provide an admin-account listing endpoint.
        role === "ADMIN" && !isLoading && data?.items.length === 0 ? (
          // Explain the API limitation instead of implying that no admins exist.
          <EmptyState
            icon={Users}
            title="Admin accounts are not available"
            description="The current backend API supports customer and technician account listings only."
          />
        ) : // Wait for loading to finish before treating an empty result as meaningful.
        !isLoading && data?.items.length === 0 ? (
          // Explain whether there are no accounts or the selected filters matched none.
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
          // Show the user table and pagination for a successful non-empty response.
          <>
            {/* Shared table primitives provide consistent layout and typography. */}
            <Table>
              {/* Header labels describe each user field and the available row actions. */}
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
              {/* Render placeholders while loading, then show one row per returned user. */}
              <tbody>
                {/* Keep the table structure stable while the first request is pending. */}
                {isLoading || !data ? (
                  <TableSkeleton columns={6} />
                ) : (
                  // Role plus ID makes row keys unique even if separate APIs reuse IDs.
                  data.items.map((user) => (
                    <Tr key={`${user.role}-${user.id}`}>
                      {/* Show the user's avatar and name together. */}
                      <Td>
                        <div className="flex items-center gap-3">
                          <Avatar name={user.name} />
                          <p className="truncate font-medium text-slate-900">
                            {user.name}
                          </p>
                        </div>
                      </Td>
                      {/* Format the phone and show email, with a fallback when absent. */}
                      <Td>
                        <p className="whitespace-nowrap text-slate-900">
                          {formatPhone(user.phone) || "No phone"}
                        </p>
                        <p className="whitespace-nowrap text-xs text-slate-500">
                          {user.email ?? "No email"}
                        </p>
                      </Td>
                      {/* Show the account role exactly as represented by the API. */}
                      <Td className="text-slate-600">{user.role}</Td>
                      {/* Display the current account status with the shared badge. */}
                      <Td>
                        <AccountStatusBadge status={user.status} />
                      </Td>
                      {/* Format the account creation date for quick scanning. */}
                      <Td className="whitespace-nowrap text-slate-600">
                        {formatDate(user.createdAt)}
                      </Td>
                      {/* Place the supported status management control at the row's end. */}
                      <Td className="text-right">
                        {/* Pass account identity and status; disable the action while saving. */}
                        {user.role === "ADMIN" ? (
                          <span className="text-slate-400">—</span>
                        ) : (
                          <AccountStatusAction
                            name={user.name}
                            status={user.status}
                            loading={updateStatus.isPending}
                            onChange={(next) =>
                              updateStatus.mutateAsync({
                                // The ID identifies which account the backend should update.
                                id: user.id,
                                // Role selects the matching account-specific API operation.
                                role: user.role,
                                // Send the status selected by the administrator.
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
            {/* Only show pagination after data supplies the server's page metadata. */}
            {data && (
              // Reflect the current page and total count; page changes update the URL.
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
