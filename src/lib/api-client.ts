import { tokenStorage } from "./token-storage";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  statusCode?: number;
}

let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  const token = tokenStorage.get();

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });

    const data = await response.json().catch(() => ({}));

    if (response.status === 401 && token) {
      onUnauthorized?.();
    }

    if (!response.ok) {
      return {
        error: data.message || "An error occurred while fetching data",
        statusCode: response.status,
      };
    }

    return { data, statusCode: response.status };
  } catch (err: any) {
    return {
      error: err.message || "Network error, failed to reach Fundi API server",
      statusCode: 500,
    };
  }
}
