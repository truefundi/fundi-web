const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  statusCode?: number;
}

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        error: data.message || 'An error occurred while fetching data',
        statusCode: response.status,
      };
    }

    return { data, statusCode: response.status };
  } catch (err: any) {
    return {
      error: err.message || 'Network error, failed to reach Fundi API server',
      statusCode: 500,
    };
  }
}
