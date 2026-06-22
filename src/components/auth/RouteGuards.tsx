import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { FeatureModuleName } from '@/types';
import { useTenant } from '@/contexts/TenantContext';

export function ProtectedRoute() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

interface FeatureGateProps {
  module?: FeatureModuleName;
  adminOnly?: boolean;
  children: React.ReactNode;
}

export function FeatureGate({ module, adminOnly, children }: FeatureGateProps) {
  const { isAdmin } = useAuth();
  const { hasModule } = useTenant();

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (module && !hasModule(module)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
