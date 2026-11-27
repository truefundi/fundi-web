import { request, setUnauthorizedHandler } from './api/client';
export { setUnauthorizedHandler };
export type { ApiResponse } from '@/types/api';

// Compatibility entry point for authentication; all requests share session handling.
export function fetchApi<T>(endpoint: string, options: RequestInit = {}) {
  const { body, ...init } = options;
  return request<T>(endpoint, {
    ...init,
    body: typeof body === 'string' ? JSON.parse(body) : body,
  });
}
