'use client';

// Catches errors thrown in the root layout itself, so it must render its own <html>.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', textAlign: 'center', padding: '4rem 1rem' }}>
        <h2>Something went wrong</h2>
        <p style={{ color: '#64748b' }}>The Fundi admin portal failed to load.</p>
        <button onClick={reset} style={{ marginTop: '1rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>
          Try again
        </button>
      </body>
    </html>
  );
}
