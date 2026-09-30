'use client';

import { useEffect } from 'react';
import { Card, ErrorState } from '@/components/ui';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Card>
      <ErrorState message={error.message || 'An unexpected error occurred.'} onRetry={reset} />
    </Card>
  );
}
