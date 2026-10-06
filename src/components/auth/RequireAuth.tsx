'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';

/** Sends visitors who are not signed in to /login; shows nothing sensitive while checking. */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login');
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return <>{children}</>;
}
