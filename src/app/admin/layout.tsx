import type { Metadata } from 'next';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { DashboardPrefetch } from '@/components/dashboard/DashboardPrefetch';
import { AppShell } from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: {
    default: 'Fundi Admin',
    template: '%s | Fundi Admin',
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DashboardPrefetch />
      <RequireAuth>
        <AppShell>{children}</AppShell>
      </RequireAuth>
    </>
  );
}
