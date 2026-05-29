import type { ApiResponse } from '@/types';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('sw-ipp-token') || sessionStorage.getItem('sw-ipp-token');
}

function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('sw-ipp-refresh-token') || sessionStorage.getItem('sw-ipp-refresh-token');
}

function clearTokens(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('sw-ipp-token');
  localStorage.removeItem('sw-ipp-refresh-token');
  sessionStorage.removeItem('sw-ipp-token');
  sessionStorage.removeItem('sw-ipp-refresh-token');
}

function cleanToken(token: string): string {
  return token.replace(/^Bearer\s+/i, '').trim();
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.data?.accessToken) {
        const storage = localStorage.getItem('sw-ipp-token') ? localStorage : sessionStorage;
        storage.setItem('sw-ipp-token', data.data.accessToken);
        if (data.data.refreshToken) {
          storage.setItem('sw-ipp-refresh-token', data.data.refreshToken);
        }
        return data.data.accessToken;
      }
    }
  } catch {
    // Refresh failed
  }
  return null;
}

class ApiError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
    this.name = 'ApiError';
  }
}

function buildHeaders(token?: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const t = token || getToken();
  if (t) {
    headers['Authorization'] = `Bearer ${cleanToken(t)}`;
  }
  return headers;
}

function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  return response.json().then((data) => {
    if (!response.ok) {
      const error = new ApiError(
        data.error?.message || 'An unexpected error occurred',
        data.error?.code || 'UNKNOWN_ERROR',
        response.status
      );
      throw error;
    }
    return data as ApiResponse<T>;
  });
}

async function requestWithRefresh<T>(
  url: string,
  options: RequestInit,
  token?: string | null
): Promise<ApiResponse<T>> {
  const headers = buildHeaders(token);
  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    // Try refreshing the token
    const newToken = await refreshAccessToken();
    if (newToken) {
      const retryHeaders = buildHeaders(newToken);
      const retryResponse = await fetch(url, { ...options, headers: retryHeaders });
      return handleResponse<T>(retryResponse);
    } else {
      clearTokens();
      // Trigger auth store logout
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:logout'));
      }
      throw new ApiError('Session expired. Please log in again.', 'UNAUTHORIZED', 401);
    }
  }

  return handleResponse<T>(response);
}

export async function apiGet<T>(url: string): Promise<ApiResponse<T>> {
  return requestWithRefresh<T>(url, { method: 'GET' });
}

export async function apiPost<T>(url: string, body?: unknown): Promise<ApiResponse<T>> {
  return requestWithRefresh<T>(url, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function apiPut<T>(url: string, body?: unknown): Promise<ApiResponse<T>> {
  return requestWithRefresh<T>(url, {
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function apiDelete<T>(url: string): Promise<ApiResponse<T>> {
  return requestWithRefresh<T>(url, { method: 'DELETE' });
}

export { ApiError };
