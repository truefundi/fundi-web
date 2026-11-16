"use client";

import { useState } from "react";
import { History } from "lucide-react";
import {
  Avatar,
  Badge,
  Card,
  EmptyState,
  PageHeader,
  SearchInput,
  Table,
  Td,
  Th,
  Tr,
} from "@/components/ui";
import { USER_ROLE_LABELS, type UserRole } from "@/types/user";

export function AuditLogsView() {
  const [search, setSearch] = useState("");

  // In a full implementation, you would fetch this from your backend audit logs query hook.
  // This shows sample logged entries for testing.
  const logs = [
    {
      id: "log-1",
      actorName: "Finance Officer",
      actorRole: "ACCOUNTANT" as UserRole,
      action: "DISBURSED_TECHNICIAN_PAYOUT",
      target: "Transaction TXN-9021",
      details: "Disbursed technician payout for Plumbing Repair (25,000 RWF)",
      createdAt: new Date().toISOString(),
    },
  ];

  const filtered = logs.filter(
    (log) =>
      log.actorName.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.target.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
      <PageHeader
        title="System Activity & Audit Logs"
        description="Monitor all actions performed by staff members with exact timestamps."
      />

      <div className="mb-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search audit logs..."
          className="lg:w-96"
        />
      </div>

      <Card className="overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            icon={History}
            title="No activity recorded yet"
            description="Actions performed by staff members will appear here."
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Staff Member</Th>
                <Th>Role</Th>
                <Th>Action</Th>
                <Th>Target / Record</Th>
                <Th>Details</Th>
                <Th>Date & Time</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => (
                <Tr key={log.id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <Avatar name={log.actorName} />
                      <span className="font-medium text-slate-900">
                        {log.actorName}
                      </span>
                    </div>
                  </Td>
<Td>
  <Badge tone="neutral">
    {USER_ROLE_LABELS[log.actorRole] ?? log.actorRole}
  </Badge>
</Td>
                  <Td className="font-medium text-slate-800">{log.action}</Td>
                  <Td className="text-slate-600">{log.target}</Td>
                  <Td className="text-slate-500 max-w-xs truncate">
                    {log.details}
                  </Td>
                  <Td className="whitespace-nowrap text-slate-600">
                    {new Date(log.createdAt).toLocaleString("en-RW", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}