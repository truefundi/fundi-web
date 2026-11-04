'use client';

import { PageHeader } from '@/components/ui';
import { PrivilegeChart } from '@/components/approvals/PrivilegeChart';

export function ApprovalsView() {
  return (
    <>
      <PageHeader
        title="Administrator Permissions"
        description="All administrators have full access to administrative features and actions."
      />

      <PrivilegeChart />
    </>
  );
}