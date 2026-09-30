import { env } from '@/config/env';
import type { ApiResponse } from '@/types/api';

type QueryValue = string | number | boolean | undefined | null;

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  /** Serialised as JSON. */
  body?: unknown;
  /** Appended to the URL as a query string; undefined/null values are skipped. */
  query?: Record<string, QueryValue>;
  timeoutMs?: number;
}

function buildUrl(endpoint: string, query?: RequestOptions['query']): string {
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${env.apiUrl}${path}`;
  if (!query) return url;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null) params.append(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

async function parseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function errorMessage(body: unknown, fallback: string): string {
  if (body && typeof body === 'object' && 'message' in body) {
    const message = (body as { message: unknown }).message;
    if (Array.isArray(message)) return message.join(', ');
    if (typeof message === 'string') return message;
  }
  return fallback;
}

/**
 * Low-level request helper. Never throws: failures are returned as
 * `{ error, statusCode }` so callers can render them directly.
 */
export async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
  const { body, query, timeoutMs = env.apiTimeoutMs, headers, ...init } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(buildUrl(endpoint, query), {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: init.signal ?? controller.signal,
    });

    const data = await parseBody(response);

    if (!response.ok) {
      return {
        error: errorMessage(data, `Request failed with status ${response.status}`),
        statusCode: response.status,
      };
    }

    return { data: data as T, statusCode: response.status };
  } catch (err) {
    const aborted = err instanceof DOMException && err.name === 'AbortError';
    return {
      error: aborted
        ? `Request timed out after ${timeoutMs / 1000}s`
        : 'Network error: could not reach the Fundi API server',
      statusCode: 0,
    };
  } finally {
    clearTimeout(timer);
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Turns an ApiResponse into data-or-throw, for callers like React Query that expect rejections. */
export async function unwrap<T>(response: Promise<ApiResponse<T>>): Promise<T> {
  const res = await response;
  if (res.error) throw new ApiError(res.error, res.statusCode);
  return res.data as T;
}

export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) => request<T>(endpoint, { ...options, method: 'GET' }),
  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'POST', body }),
  put: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'PUT', body }),
  patch: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'PATCH', body }),
  delete: <T>(endpoint: string, options?: RequestOptions) => request<T>(endpoint, { ...options, method: 'DELETE' }),
};
