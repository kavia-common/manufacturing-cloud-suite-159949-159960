import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from './client';
import type { Tenant, User } from '../types/auth';

// Simple in-memory fallback state for demo mode
let DEMO_USERS: User[] = [
  { id: 'u-1', email: 'admin@example.com', name: 'Admin User', roles: ['admin'], tenants: [{ id: 'demo', name: 'Demo' }] },
  { id: 'u-2', email: 'buyer@example.com', name: 'Buyer', roles: ['purchasing'], tenants: [{ id: 'demo', name: 'Demo' }] },
];
let DEMO_ROLES: string[] = ['admin', 'inventory', 'production', 'quality', 'scheduler', 'purchasing', 'reports'];
let DEMO_TENANTS: Tenant[] = [{ id: 'demo', name: 'Demo' }];

/**
 * Try an ordered list of endpoints until one succeeds.
 */
async function tryEndpoints<T>(candidates: Array<{ method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'; path: string; body?: any }>, fallback: () => T | Promise<T>): Promise<T> {
  for (const c of candidates) {
    try {
      switch (c.method) {
        case 'GET':
          return await apiGet<T>(c.path);
        case 'POST':
          return await apiPost<T>(c.path, c.body || {});
        case 'PUT':
          return await apiPut<T>(c.path, c.body || {});
        case 'PATCH':
          return await apiPatch<T>(c.path, c.body || {});
        case 'DELETE':
          return await apiDelete<T>(c.path);
      }
    } catch {
      // try next
    }
  }
  return await fallback();
}

// PUBLIC_INTERFACE
export async function getUsers(): Promise<User[]> {
  /** List users. */
  return tryEndpoints<User[]>(
    [{ method: 'GET', path: '/api/v1/admin/users' }, { method: 'GET', path: '/api/v1/users' }],
    async () => DEMO_USERS,
  );
}

// PUBLIC_INTERFACE
export async function createUser(input: Partial<User> & { email: string; name?: string | null; roles?: string[] }): Promise<User> {
  /** Create a new user. */
  return tryEndpoints<User>(
    [{ method: 'POST', path: '/api/v1/admin/users', body: input }, { method: 'POST', path: '/api/v1/users', body: input }],
    async () => {
      const u: User = { id: `u-${Date.now()}`, email: input.email, name: input.name || input.email, roles: input.roles || [], tenants: [] };
      DEMO_USERS = [u, ...DEMO_USERS];
      return u;
    },
  );
}

// PUBLIC_INTERFACE
export async function updateUser(id: string, input: Partial<User>): Promise<User> {
  /** Update an existing user. */
  return tryEndpoints<User>(
    [{ method: 'PUT', path: `/api/v1/admin/users/${encodeURIComponent(id)}`, body: input }, { method: 'PATCH', path: `/api/v1/admin/users/${encodeURIComponent(id)}`, body: input }],
    async () => {
      DEMO_USERS = DEMO_USERS.map((u) => (u.id === id ? { ...u, ...input } : u));
      return DEMO_USERS.find((u) => u.id === id)!;
    },
  );
}

// PUBLIC_INTERFACE
export async function deleteUser(id: string): Promise<{ success: boolean }> {
  /** Delete a user. */
  return tryEndpoints<{ success: boolean }>(
    [{ method: 'DELETE', path: `/api/v1/admin/users/${encodeURIComponent(id)}` }, { method: 'DELETE', path: `/api/v1/users/${encodeURIComponent(id)}` }],
    async () => {
      DEMO_USERS = DEMO_USERS.filter((u) => u.id !== id);
      return { success: true };
    },
  );
}

// PUBLIC_INTERFACE
export async function getRoles(): Promise<string[]> {
  /** List roles. */
  return tryEndpoints<string[]>(
    [{ method: 'GET', path: '/api/v1/admin/roles' }, { method: 'GET', path: '/api/v1/roles' }],
    async () => DEMO_ROLES,
  );
}

// PUBLIC_INTERFACE
export async function createRole(input: { name: string }): Promise<{ success: boolean }> {
  /** Create a new role. */
  return tryEndpoints<{ success: boolean }>(
    [{ method: 'POST', path: '/api/v1/admin/roles', body: input }, { method: 'POST', path: '/api/v1/roles', body: input }],
    async () => {
      if (!DEMO_ROLES.includes(input.name)) DEMO_ROLES.push(input.name);
      return { success: true };
    },
  );
}

// PUBLIC_INTERFACE
export async function deleteRole(name: string): Promise<{ success: boolean }> {
  /** Delete a role. */
  return tryEndpoints<{ success: boolean }>(
    [{ method: 'DELETE', path: `/api/v1/admin/roles/${encodeURIComponent(name)}` }, { method: 'DELETE', path: `/api/v1/roles/${encodeURIComponent(name)}` }],
    async () => {
      DEMO_ROLES = DEMO_ROLES.filter((r) => r !== name);
      return { success: true };
    },
  );
}

// PUBLIC_INTERFACE
export async function getTenants(): Promise<Tenant[]> {
  /** List tenants. */
  return tryEndpoints<Tenant[]>(
    [{ method: 'GET', path: '/api/v1/admin/tenants' }, { method: 'GET', path: '/api/v1/tenants' }],
    async () => DEMO_TENANTS,
  );
}

// PUBLIC_INTERFACE
export async function createTenant(input: { id: string; name?: string | null }): Promise<Tenant> {
  /** Create a tenant. */
  return tryEndpoints<Tenant>(
    [{ method: 'POST', path: '/api/v1/admin/tenants', body: input }, { method: 'POST', path: '/api/v1/tenants', body: input }],
    async () => {
      const t: Tenant = { id: input.id, name: input.name || input.id };
      DEMO_TENANTS = [t, ...DEMO_TENANTS];
      return t;
    },
  );
}

// PUBLIC_INTERFACE
export async function deleteTenant(id: string): Promise<{ success: boolean }> {
  /** Delete a tenant. */
  return tryEndpoints<{ success: boolean }>(
    [{ method: 'DELETE', path: `/api/v1/admin/tenants/${encodeURIComponent(id)}` }, { method: 'DELETE', path: `/api/v1/tenants/${encodeURIComponent(id)}` }],
    async () => {
      DEMO_TENANTS = DEMO_TENANTS.filter((t) => t.id !== id);
      return { success: true };
    },
  );
}
