/**
 * Typed access to public environment variables.
 *
 * Only NEXT_PUBLIC_* variables are available in the browser. Next.js inlines
 * them at build time, so each one must be referenced by its full literal name.
 */
export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1',
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'Fundi Platform',
  apiTimeoutMs: Number(process.env.NEXT_PUBLIC_API_TIMEOUT_MS) || 10000,
  /** Serve customers/technicians from src/mocks until the backend admin endpoints exist. */
  useMocks: process.env.NEXT_PUBLIC_USE_MOCKS === 'true',
} as const;
