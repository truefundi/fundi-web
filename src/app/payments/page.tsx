import type { Metadata } from 'next';
import { CreditCard } from 'lucide-react';
import { PlaceholderPage } from '@/components/layout/PlaceholderPage';

export const metadata: Metadata = { title: 'Payments' };

export default function PaymentsPage() {
  return (
    <PlaceholderPage
      title="Payments"
      description="Commission and repair settlements."
      icon={CreditCard}
      actions={['Commission split', 'Settlements', 'Technician earnings']}
    />
  );
}
