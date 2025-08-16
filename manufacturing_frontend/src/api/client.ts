 /* eslint-env browser */
import { AuthResponse, MeResponse } from '../types/auth';
import { getStoredAuth } from '../utils/storage';

/**
 * Lightweight API client built on fetch with:
 *  - JSON handling
 *  - Authorization header with Bearer token (when available)
 *  - Multi-tenant header X-Tenant-ID
 *  - Global 401 handler hook for session cleanup/redirect
 */

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '';

type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;

// PUBLIC_INTERFACE
export function setUnauthorizedHandler(handler: UnauthorizedHandler) {
  /** Register a callback to be invoked on 401 responses. */
  onUnauthorized = handler;
}

type ApiOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  auth?: boolean; // when false, omit Authorization header
};

async function handleJson(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text as unknown as any;
  }
}

async function baseFetch<T = unknown>(path: string, options: ApiOptions = {}): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const { method = 'GET', body, headers = {}, auth = true } = options;

  // Pull token & tenant from storage (so this works even before context fully mounts)
  const stored = getStoredAuth();
  const finalHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...headers,
  };

  if (!(body instanceof FormData)) {
    finalHeaders['Content-Type'] = finalHeaders['Content-Type'] || 'application/json';
  }

  if (auth && stored?.token) {
    finalHeaders.Authorization = `Bearer ${stored.token}`;
  }
  if (stored?.tenantId) {
    finalHeaders['X-Tenant-ID'] = stored.tenantId;
  }

  const response = await globalThis.fetch(url, {
    method,
    headers: finalHeaders,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    credentials: 'include', // allow cookie-based flows if backend sets any
  });

  if (response.status === 401) {
    if (onUnauthorized) onUnauthorized();
    throw new Error('Unauthorized');
  }
  if (!response.ok) {
    const errData = await handleJson(response);
    const message =
      (errData && (errData.message || errData.detail || errData.error?.message)) ||
      `Request failed with status ${response.status}`;
    const error = new Error(message) as Error & { status?: number; data?: any };
    error.status = response.status;
    error.data = errData;
    throw error;
  }
  return (await handleJson(response)) as T;
}

// PUBLIC_INTERFACE
export async function apiGet<T = unknown>(path: string, headers?: Record<string, string>): Promise<T> {
  /** Perform an authenticated GET request. */
  return baseFetch<T>(path, { method: 'GET', headers });
}

// PUBLIC_INTERFACE
export async function apiPost<T = unknown>(
  path: string,
  body?: any,
  headers?: Record<string, string>,
  opts?: Partial<ApiOptions>,
): Promise<T> {
  /** Perform a POST request (authenticated by default). */
  return baseFetch<T>(path, { method: 'POST', body, headers, auth: opts?.auth ?? true });
}

// PUBLIC_INTERFACE
export async function apiPut<T = unknown>(path: string, body?: any, headers?: Record<string, string>): Promise<T> {
  /** Perform a PUT request (authenticated). */
  return baseFetch<T>(path, { method: 'PUT', body, headers, auth: true });
}

// PUBLIC_INTERFACE
export async function apiPatch<T = unknown>(path: string, body?: any, headers?: Record<string, string>): Promise<T> {
  /** Perform a PATCH request (authenticated). */
  return baseFetch<T>(path, { method: 'PATCH', body, headers, auth: true });
}

// PUBLIC_INTERFACE
export async function apiDelete<T = unknown>(path: string, headers?: Record<string, string>): Promise<T> {
  /** Perform a DELETE request (authenticated). */
  return baseFetch<T>(path, { method: 'DELETE', headers, auth: true });
}

// PUBLIC_INTERFACE
export async function downloadFile(
  path: string,
  filename: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
  body?: any,
  headers?: Record<string, string>,
): Promise<void> {
  /**
   * Download a file (blob) from an authenticated endpoint and trigger a browser download.
   * Automatically attaches Authorization and X-Tenant-ID headers from storage.
   */
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const stored = getStoredAuth();

  const finalHeaders: Record<string, string> = {
    ...headers,
  };
  if (stored?.token) finalHeaders.Authorization = `Bearer ${stored.token}`;
  if (stored?.tenantId) finalHeaders['X-Tenant-ID'] = stored.tenantId;

  const resp = await globalThis.fetch(url, {
    method,
    headers: finalHeaders,
    body: body ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined,
    credentials: 'include',
  });
  if (resp.status === 401) {
    if (onUnauthorized) onUnauthorized();
    throw new Error('Unauthorized');
  }
  if (!resp.ok) {
    throw new Error(`Failed to download file (${resp.status})`);
  }
  const blob = await resp.blob();
  const dlName = filename || guessFilenameFromResponse(resp) || 'download';
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = dlName;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  globalThis.setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
    document.body.removeChild(a);
  }, 100);
}

function guessFilenameFromResponse(resp: Response): string | null {
  const cd = resp.headers.get('Content-Disposition') || '';
  const match = /filename\*?=([^;]+)/i.exec(cd);
  if (match && match[1]) {
    return decodeURIComponent(match[1].replace(/UTF-8''/i, '').replace(/["']/g, '').trim());
  }
  return null;
}

// PUBLIC_INTERFACE
export async function loginApi(username: string, password: string, tenantId?: string): Promise<AuthResponse> {
  /** Call the backend login endpoint to exchange credentials for a JWT. */
  const headers: Record<string, string> = {};
  if (tenantId) headers['X-Tenant-ID'] = tenantId;
  // Typical FastAPI OAuth2 password flow
  return apiPost<AuthResponse>('/api/v1/auth/login', { username, password }, headers, { auth: false });
}

// PUBLIC_INTERFACE
export async function logoutApi(): Promise<{ status: string } | null> {
  /** Optional backend logout endpoint (ignore errors if not available). */
  try {
    return await apiPost<{ status: string }>('/api/v1/auth/logout', {});
  } catch {
    return null;
  }
}

// PUBLIC_INTERFACE
export async function meApi(): Promise<MeResponse> {
  /** Fetch the current authenticated user, their roles, and tenants. */
  // Try preferred endpoint, fall back if necessary
  try {
    return await apiGet<MeResponse>('/api/v1/auth/me');
  } catch {
    return await apiGet<MeResponse>('/api/v1/users/me');
  }
}
