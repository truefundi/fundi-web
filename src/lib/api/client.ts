
import { env } from '@/config/env';
import type { ApiResponse } from '@/types/api';

let onUnauthorized: (() => void) | null = null;
let refreshing: Promise<boolean> | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

async function refreshSession(): Promise<boolean> {
  if (!refreshing) {
    refreshing = fetch(`${env.apiUrl.replace(/\/$/, '')}/auth/admin/refresh`, {
      method: 'POST', credentials: 'include',
      signal: AbortSignal.timeout(env.apiTimeoutMs),
    }).then((response) => response.ok).catch(() => false).finally(() => { refreshing = null; });
  }
  return refreshing;
}

type QueryValue = string | number | boolean | undefined | null;

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  query?: Record<string, QueryValue>;
  timeoutMs?: number;
}

function buildUrl(endpoint: string, query?: RequestOptions['query']): string {
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${env.apiUrl.replace(/\/$/, '')}${path}`;
  if (!query) return url;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
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

/** Combine a query's cancellation signal with the client's own timeout. */
function combineSignals(
  signals: Array<AbortSignal | null | undefined>,
): AbortSignal {
  const active = signals.filter((signal): signal is AbortSignal => Boolean(signal));
  if (active.length === 0) return new AbortController().signal;

  const anySignal = (
    AbortSignal as unknown as {
      any?: (items: AbortSignal[]) => AbortSignal;
    }
  ).any;
  if (anySignal) return anySignal(active);

  const combined = new AbortController();
  for (const signal of active) {
    if (signal.aborted) {
      combined.abort(signal.reason);
      break;
    }
    signal.addEventListener('abort', () => combined.abort(signal.reason), { once: true });
  }
  return combined.signal;
}

export async function request<T>(
  endpoint: string,
  options: RequestOptions = {},
  retried = false,
): Promise<ApiResponse<T>> {
  const { body, query, timeoutMs = env.apiTimeoutMs, headers, ...init } = options;

  const controller = new AbortController();
  const externalSignal = init.signal;
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const signal = combineSignals([controller.signal, externalSignal]);

  try {
    const response = await fetch(buildUrl(endpoint, query), {
      ...init,
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'ngrok-skip-browser-warning': 'true',
        ...(body !== undefined && !(body instanceof FormData) && { 'Content-Type': 'application/json' }),
        ...headers,
      },
      body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });

    // Some fetch implementations resolve even when a signal aborts mid-flight.
    if (externalSignal?.aborted) {
      throw externalSignal.reason ?? new DOMException('Request cancelled', 'AbortError');
    }

    if (response.status === 401 && (!endpoint.startsWith('/auth/admin/') || endpoint === '/auth/admin/me')) {
      if (!retried && await refreshSession()) return request<T>(endpoint, options, true);
      onUnauthorized?.();
    }

    const data = await parseBody(response);

    if (!response.ok) {
      return {
        error: errorMessage(data, `Request failed with status ${response.status}`),
        statusCode: response.status,
      };
    }

    return { data: data as T, statusCode: response.status };
  } catch (err) {
    // Query cancellation is not a server failure. Propagate it so TanStack
    // Query can discard the result instead of treating it as an error/retry.
    if (externalSignal?.aborted) {
      throw externalSignal.reason ?? new DOMException('Request cancelled', 'AbortError');
    }

    const aborted =
      timedOut || (err instanceof DOMException && err.name === 'AbortError');

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
  constructor(message: string, public statusCode: number) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function unwrap<T>(response: Promise<ApiResponse<T>>): Promise<T> {
  const res = await response;
  if (res.error) throw new ApiError(res.error, res.statusCode);
  return res.data as T;
}

export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'POST', body }),

  put: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'PUT', body }),

  patch: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'PATCH', body }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),
};
