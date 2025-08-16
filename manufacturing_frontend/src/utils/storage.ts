 /* eslint-env browser */
import { Tenant, User } from '../types/auth';

export const storageKeys = {
  token: 'mfg-suite:token',
  user: 'mfg-suite:user',
  roles: 'mfg-suite:roles',
  tenantId: 'mfg-suite:tenant-id',
  tenants: 'mfg-suite:tenants',
} as const;

export function getStoredAuth():
  | {
      token: string | null;
      tenantId: string | null;
      user: User | null;
      roles: string[];
      tenants: Tenant[];
    }
  | null {
  try {
    const ls = (globalThis as any).localStorage as Storage | undefined;
    const token = ls?.getItem(storageKeys.token) ?? null;
    const tenantId = ls?.getItem(storageKeys.tenantId) ?? null;
    const rawUser = ls?.getItem(storageKeys.user) ?? null;
    const rawRoles = ls?.getItem(storageKeys.roles) ?? null;
    const rawTenants = ls?.getItem(storageKeys.tenants) ?? null;
    return {
      token,
      tenantId,
      user: rawUser ? (JSON.parse(rawUser) as User) : null,
      roles: rawRoles ? (JSON.parse(rawRoles) as string[]) : [],
      tenants: rawTenants ? (JSON.parse(rawTenants) as Tenant[]) : [],
    };
  } catch {
    return null;
  }
}
