import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

// PUBLIC_INTERFACE
/**
 * Route guard that requires an authenticated session.
 * Redirects to /login with next=<original-path> if not authenticated or if auth not initialized yet.
 */
const ProtectedRoute: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { isAuthenticated, initialized } = useAuth();
  const location = useLocation();

  if (!initialized) {
    return null; // Could be a splash/loading indicator
  }

  if (!isAuthenticated) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
