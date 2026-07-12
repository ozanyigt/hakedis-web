import { Navigate, Outlet } from 'react-router-dom';
import { hasAnyClaim, hasClaim, hasModuleClaim } from '@/config/permissions';
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

export function PlatformRoute() {
  const { isAuthenticated, isAdmin } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/app" replace />;
  }

  return <Outlet />;
}

interface FeatureGateProps {
  module?: FeatureModuleName;
  adminOnly?: boolean;
  claim?: string;
  anyClaim?: string[];
  children: React.ReactNode;
}

export function FeatureGate({ module, adminOnly, claim, anyClaim, children }: FeatureGateProps) {
  const { isAdmin, roles } = useAuth();
  const { isReady, hasModule } = useTenant();

  if (!isReady && module) {
    return null;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/app" replace />;
  }

  if (anyClaim && !hasAnyClaim(roles, anyClaim)) {
    return <Navigate to="/app" replace />;
  }

  if (claim && !hasClaim(roles, claim)) {
    return <Navigate to="/app" replace />;
  }

  if (module) {
    if (!isReady) {
      return null;
    }

    if (!hasModule(module) || !hasModuleClaim(roles, module)) {
      return <Navigate to="/app" replace />;
    }
  }

  return <>{children}</>;
}
