/* eslint-disable no-unused-vars */
import type { ReactNode } from 'react';

export type Tenant = {
  id: string;
  name?: string | null;
};

export type User = {
  id: string;
  email?: string | null;
  name?: string | null;
  roles?: string[];
  tenants?: Tenant[];
};

export type AuthResponse = {
  access_token: string;
  token_type?: string;
  expires_in?: number;
  refresh_token?: string | null;
  user?: User;
  roles?: string[];
  tenants?: Tenant[];
};

export type MeResponse = {
  user?: User;
  roles?: string[];
  tenants?: Tenant[];
  // Some APIs might inline user fields, keep as open type
  [key: string]: any;
};

export type AuthState = {
  token: string | null;
  user: User | null;
  roles: string[];
  tenantId: string | null;
  tenants: Tenant[];
  initialized: boolean;
};

export type AuthContextValue = {
  token: string | null;
  user: User | null;
  roles: string[];
  tenants: Tenant[];
  tenantId: string | null;
  initialized: boolean;
  isAuthenticated: boolean;

  // PUBLIC_INTERFACE
  login: (username: string, password: string, tenantId?: string | null) => Promise<void>;

  // PUBLIC_INTERFACE
  logout: (callApi?: boolean) => Promise<void>;

  // PUBLIC_INTERFACE
  setTenant: (tenantId: string) => void;

  // PUBLIC_INTERFACE
  hasRole: (required: string | string[], requireAll?: boolean) => boolean;
};

export type AuthProviderProps = {
  children: ReactNode;
};
