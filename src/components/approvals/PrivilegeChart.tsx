'use client';

import { Badge, Card, CardBody, CardHeader } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import {
  ADMIN_ROLES,
  PERMISSION_LABEL,
  PRIVILEGE_MATRIX,
  type PermissionLevel,
} from '@/types/approval';

const CELL: Record<PermissionLevel, { className: string; label: string }> = {
  DIRECT: { className: 'bg-green-50 text-green-800', label: 'Direct' },
  REQUIRES_APPROVAL: { className: 'bg-amber-50 text-amber-900', label: 'Request' },
  RESTRICTED: { className: 'bg-slate-100 text-slate-500', label: 'No access' },
};

const RISK: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  LOW: 'success',
  MEDIUM: 'warning',
  HIGH: 'danger',
  CRITICAL: 'danger',
};

export function PrivilegeChart() {
  const { user } = useAuth();
  const categories = [...new Set(PRIVILEGE_MATRIX.map((item) => item.category))];

  return (
    <Card className="overflow-hidden">
      <CardHeader
        title="Privilege chart"
        description="Who can take an action immediately, who must request approval, and who cannot act."
      />
      <CardBody className="overflow-x-auto p-0">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Action</th>
              {ADMIN_ROLES.map((role) => (
                <th key={role.value} className="px-4 py-3 font-semibold">
                  <span className={cn(user?.role === role.value && 'text-brand-700')}>{role.label}</span>
                  {user?.role === role.value && (
                    <span className="ml-2 rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] font-semibold normal-case tracking-normal text-brand-800">
                      You
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <>
                <tr key={category} className="bg-slate-50/80">
                  <td colSpan={1 + ADMIN_ROLES.length} className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {category}
                  </td>
                </tr>
                {PRIVILEGE_MATRIX.filter((item) => item.category === category).map((item) => (
                  <tr key={item.actionType} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{item.title}</p>
                      <p className="mt-0.5 max-w-md text-xs text-slate-500">{item.description}</p>
                      <Badge tone={RISK[item.riskLevel]} className="mt-2">
                        {item.riskLevel} risk
                      </Badge>
                    </td>
                    {ADMIN_ROLES.map((role) => {
                      const level = item.permissions[role.value];
                      const cell = CELL[level];
                      return (
                        <td key={role.value} className="px-4 py-3">
                          <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-semibold', cell.className)}>
                            {cell.label}
                          </span>
                          <span className="sr-only">{PERMISSION_LABEL[level]}</span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </>
            ))}
          </tbody>
        </table>
      </CardBody>
    </Card>
  );
}
