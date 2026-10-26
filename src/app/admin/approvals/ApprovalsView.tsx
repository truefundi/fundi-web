'use client';

import { useState } from 'react';
import { PageHeader, SegmentedTabs } from '@/components/ui';
import { ApprovalQueue } from '@/components/approvals/ApprovalQueue';
import { PrivilegeChart } from '@/components/approvals/PrivilegeChart';
import { useAuth } from '@/context/AuthContext';
import { ADMIN_ROLES } from '@/types/approval';

export function ApprovalsView() {
  const [tab, setTab] = useState<'queue' | 'chart'>('queue');
  const { user } = useAuth();
  const roleLabel = ADMIN_ROLES.find((role) => role.value === user?.role)?.label ?? user?.role;

  return (
    <>
      <PageHeader
        title="Approvals"
        description={`Privilege chart and requests that need a senior admin. You are acting as ${roleLabel}.`}
      />
      <div className="mb-4">
        <SegmentedTabs
          label="Approvals sections"
          value={tab}
          onChange={setTab}
          tabs={[
            { value: 'queue', label: 'Request queue' },
            { value: 'chart', label: 'Privilege chart' },
          ]}
        />
      </div>
      {tab === 'queue' ? <ApprovalQueue /> : <PrivilegeChart />}
    </>
  );
}
