import { Suspense } from 'react';
import { PaymentsView } from '@/components/payments/PaymentsView';

export default function PaymentsPage() {
  return (
    <Suspense>
      <PaymentsView />
    </Suspense>
  );
}