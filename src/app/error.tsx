'use client';

import { useEffect } from 'react';
import { Card, ErrorState } from '@/components/ui';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <Card>
        <ErrorState message={error.message || 'An unexpected error occurred.'} onRetry={reset} />
      </Card>
    </div>
  );
}
