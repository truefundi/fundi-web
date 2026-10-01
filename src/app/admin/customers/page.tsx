import type { Metadata } from 'next';
import { Users } from 'lucide-react';
import { PlaceholderPage } from '@/components/layout/PlaceholderPage';

export const metadata: Metadata = { title: 'Customers' };

export default function CustomersPage() {
  return (
    <PlaceholderPage
      title="Customers"
      description="Manage customer accounts."
      icon={Users}
      actions={['Accounts', 'Service history', 'Support', 'Suspend']}
    />
  );
}
