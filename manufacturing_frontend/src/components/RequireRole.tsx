import React from 'react';
import { useAuth } from '../auth/AuthContext';

// PUBLIC_INTERFACE
/**
 * Render children only when the user has required role(s).
 * - required: string | string[]
 * - requireAll: when true, all roles must be present
 */
const RequireRole: React.FC<{ required: string | string[]; requireAll?: boolean; children: React.ReactNode }> = ({
  required,
  requireAll = false,
  children,
}) => {
  const { hasRole } = useAuth();
  if (!hasRole(required, requireAll)) return null;
  return <>{children}</>;
};

export default RequireRole;
