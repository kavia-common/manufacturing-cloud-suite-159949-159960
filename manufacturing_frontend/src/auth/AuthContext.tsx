 /* eslint-env browser */
import React from 'react';
import { loginApi, logoutApi, meApi, setUnauthorizedHandler } from '../api/client';
import { AuthContextValue, AuthProviderProps, AuthState, MeResponse, Tenant, User } from '../types/auth';
import { getStoredAuth, storageKeys } from '../utils/storage';

// PUBLIC_INTERFACE
export const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

function rolesFromMe(me?: MeResponse | null): string[] {
  if (!me) return [];
  if (Array.isArray((me as any).roles)) return (me as any).roles as string[];
  if (Array.isArray(me.user?.roles)) return (me.user?.roles as string[]);
  return [];
}

function tenantsFromMe(me?: MeResponse | null): Tenant[] {
  if (!me) return [];
  if (Array.isArray((me as any).tenants)) return (me as any).tenants as Tenant[];
  if (Array.isArray(me.user?.tenants)) return (me.user?.tenants as Tenant[]);
  return [];
}

function userFromMe(me?: MeResponse | null): User | null {
  if (!me) return null;
  if ((me as any).user) return (me as any).user as User;
  // Some APIs return user fields at root
  const { id, email, name, full_name } = me as any;
  if (id || email) {
    return { id, email, name: name || full_name || email, roles: rolesFromMe(me), tenants: tenantsFromMe(me) };
  }
  return null;
}

// PUBLIC_INTERFACE
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = React.useState<AuthState>(() => {
    const stored = getStoredAuth();
    return {
      token: stored?.token || null,
      user: stored?.user || null,
      roles: stored?.roles || [],
      tenantId: stored?.tenantId || null,
      tenants: stored?.tenants || [],
      initialized: false,
    };
  });

  const isAuthenticated = !!state.token;

  // Sync across tabs
  React.useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (!e.key || !e.key.startsWith('mfg-suite:')) return;
      const stored = getStoredAuth();
      setState((s) => ({
        ...s,
        token: stored?.token || null,
        user: stored?.user || null,
        roles: stored?.roles || [],
        tenantId: stored?.tenantId || null,
        tenants: stored?.tenants || [],
      }));
    };
    globalThis.addEventListener?.('storage', onStorage);
    return () => globalThis.removeEventListener?.('storage', onStorage);
  }, []);

  // Global 401 -> logout
  React.useEffect(() => {
    setUnauthorizedHandler(() => {
      // Clear and reload to login
      void logout(false);
    });
    // no deps
  }, [logout]);

  // On mount or token change, fetch /me
  React.useEffect(() => {
    const bootstrap = async () => {
      if (!state.token) {
        setState((s) => ({ ...s, initialized: true }));
        return;
      }
      try {
        const me = await meApi();
        const user = userFromMe(me);
        const roles = rolesFromMe(me);
        const tenants = tenantsFromMe(me);
        // If no tenant chosen yet, pick first available
        const chosenTenantId = state.tenantId || tenants?.[0]?.id || null;

        // Persist
        const ls = (globalThis as any).localStorage as Storage | undefined;
        ls?.setItem(storageKeys.token, state.token!);
        if (user) ls?.setItem(storageKeys.user, JSON.stringify(user));
        if (roles) ls?.setItem(storageKeys.roles, JSON.stringify(roles));
        if (tenants) ls?.setItem(storageKeys.tenants, JSON.stringify(tenants));
        if (chosenTenantId) ls?.setItem(storageKeys.tenantId, chosenTenantId);

        setState((s) => ({
          ...s,
          user,
          roles,
          tenants,
          tenantId: chosenTenantId,
          initialized: true,
        }));
      } catch {
        // Token is invalid -> logout
        await logout(false);
      }
    };
    void bootstrap();
  }, [state.token, state.tenantId, logout]);

  // PUBLIC_INTERFACE
  const login = React.useCallback<AuthContextValue['login']>(async (username, password, tenantId) => {
    const result = await loginApi(username, password, tenantId || undefined);
    const token = (result as any).access_token || (result as any).token || null;

    if (!token) {
      throw new Error('Login did not return a token');
    }

    const me = await meApi();
    const user = userFromMe(me);
    const roles = rolesFromMe(me);
    const tenants = tenantsFromMe(me);

    const chosenTenantId =
      tenantId ||
      state.tenantId ||
      tenants?.[0]?.id ||
      (Array.isArray((result as any).tenants) ? (result as any).tenants[0]?.id : null) ||
      null;

    // persist
    const ls = (globalThis as any).localStorage as Storage | undefined;
    ls?.setItem(storageKeys.token, token);
    if (chosenTenantId) ls?.setItem(storageKeys.tenantId, chosenTenantId);
    if (user) ls?.setItem(storageKeys.user, JSON.stringify(user));
    if (roles) ls?.setItem(storageKeys.roles, JSON.stringify(roles));
    if (tenants) ls?.setItem(storageKeys.tenants, JSON.stringify(tenants));

    setState((s) => ({
      ...s,
      token,
      user,
      roles,
      tenants,
      tenantId: chosenTenantId,
      initialized: true,
    }));
  }, [state.tenantId]);

  // PUBLIC_INTERFACE
  const logout = React.useCallback<AuthContextValue['logout']>(async (callApi = true) => {
    try {
      if (callApi) await logoutApi();
    } catch {
      // ignore
    }
    const ls = (globalThis as any).localStorage as Storage | undefined;
    ls?.removeItem(storageKeys.token);
    ls?.removeItem(storageKeys.user);
    ls?.removeItem(storageKeys.roles);
    ls?.removeItem(storageKeys.tenantId);
    ls?.removeItem(storageKeys.tenants);
    setState({
      token: null,
      user: null,
      roles: [],
      tenantId: null,
      tenants: [],
      initialized: true,
    });
  }, []);

  // PUBLIC_INTERFACE
  const setTenant = React.useCallback<AuthContextValue['setTenant']>((tenantId) => {
    const ls = (globalThis as any).localStorage as Storage | undefined;
    ls?.setItem(storageKeys.tenantId, tenantId);
    setState((s) => ({ ...s, tenantId }));
  }, []);

  // PUBLIC_INTERFACE
  const hasRole = React.useCallback<AuthContextValue['hasRole']>(
    (required, requireAll = false) => {
      const toCheck = Array.isArray(required) ? required : [required];
      if (!toCheck.length) return true;
      if (!state.roles || !state.roles.length) return false;
      return requireAll ? toCheck.every((r) => state.roles.includes(r)) : toCheck.some((r) => state.roles.includes(r));
    },
    [state.roles],
  );

  const value: AuthContextValue = {
    token: state.token,
    user: state.user,
    roles: state.roles,
    tenants: state.tenants,
    tenantId: state.tenantId,
    initialized: state.initialized,
    isAuthenticated,
    login,
    logout,
    setTenant,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// PUBLIC_INTERFACE
export function useAuth(): AuthContextValue {
  /** Hook for accessing the AuthContext */
  const ctx = React.useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
