'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-16 text-center">
      <h2 className="text-2xl font-bold text-slate-900">Something went wrong!</h2>
      <p className="mt-2 text-slate-600 text-sm">{error.message || 'An unexpected error occurred.'}</p>
      <button
        onClick={() => reset()}
        className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
      >
        Try again
      </button>
    </div>
  );
}
