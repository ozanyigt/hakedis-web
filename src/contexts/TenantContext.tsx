import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { getAppContext, parseAppModules } from '@/api/appContext';
import { canAccessModule } from '@/config/permissions';
import { useAuth } from '@/contexts/AuthContext';
import type { FeatureModuleName, FirmRoleValue, Tenant } from '@/types';
import { STORAGE_KEYS } from '@/types';

interface TenantContextValue {
  tenants: Tenant[];
  tenantId: string | null;
  tenantName: string | null;
  enabledModules: FeatureModuleName[];
  firmRole: FirmRoleValue | null;
  secondaryFirmRole: FirmRoleValue | null;
  isLoading: boolean;
  isReady: boolean;
  setTenantId: (tenantId: string) => void;
  refreshTenantContext: () => Promise<void>;
  hasModule: (module: FeatureModuleName) => boolean;
  canSwitchTenant: boolean;
}

const TenantContext = createContext<TenantContextValue | null>(null);

export function TenantProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isAdmin } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantId, setTenantIdState] = useState<string | null>(() =>
    localStorage.getItem(STORAGE_KEYS.tenantId),
  );
  const [enabledModules, setEnabledModules] = useState<FeatureModuleName[]>([]);
  const [firmRole, setFirmRole] = useState<FirmRoleValue | null>(null);
  const [secondaryFirmRole, setSecondaryFirmRole] = useState<FirmRoleValue | null>(null);
  const [canSwitchTenant, setCanSwitchTenant] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const resetTenantState = useCallback(() => {
    setTenants([]);
    setTenantIdState(null);
    setEnabledModules([]);
    setFirmRole(null);
    setSecondaryFirmRole(null);
    setCanSwitchTenant(false);
    setIsReady(false);
    localStorage.removeItem(STORAGE_KEYS.tenantId);
  }, []);

  const setTenantId = useCallback((id: string) => {
    localStorage.setItem(STORAGE_KEYS.tenantId, id);
    setTenantIdState(id);
  }, []);

  const refreshTenantContext = useCallback(async () => {
    if (!isAuthenticated) {
      return;
    }

    setIsLoading(true);
    try {
      const context = await getAppContext(tenantId ?? undefined);
      const tenantItems: Tenant[] = (context.tenants ?? []).map((tenant) => ({
        id: tenant.id,
        name: tenant.name,
        isActive: true,
      }));

      setTenants(tenantItems);
      setCanSwitchTenant(context.canSwitchTenant && context.isGlobalAdmin);
      setEnabledModules(parseAppModules(context.enabledModules ?? []));
      setFirmRole(context.firmRole ?? null);
      setSecondaryFirmRole(context.secondaryFirmRole ?? null);

      const activeTenantId = context.tenantId ?? tenantItems[0]?.id ?? null;
      if (activeTenantId && activeTenantId !== tenantId) {
        setTenantId(activeTenantId);
      } else if (!activeTenantId) {
        setTenantIdState(null);
        localStorage.removeItem(STORAGE_KEYS.tenantId);
      }

      setIsReady(true);
    } catch {
      resetTenantState();
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, resetTenantState, setTenantId, tenantId]);

  useEffect(() => {
    if (!isAuthenticated) {
      resetTenantState();
      return;
    }

    void refreshTenantContext();
  }, [isAuthenticated, refreshTenantContext, resetTenantState]);

  const tenantName = useMemo(() => {
    return tenants.find((tenant) => tenant.id === tenantId)?.name ?? null;
  }, [tenants, tenantId]);

  const hasModule = useCallback(
    (module: FeatureModuleName) => {
      if (!isReady) {
        return false;
      }

      return canAccessModule(enabledModules, module, isAdmin);
    },
    [enabledModules, isAdmin, isReady],
  );

  const value = useMemo(
    () => ({
      tenants,
      tenantId,
      tenantName,
      enabledModules,
      firmRole,
      secondaryFirmRole,
      isLoading,
      isReady,
      setTenantId,
      refreshTenantContext,
      hasModule,
      canSwitchTenant,
    }),
    [
      tenants,
      tenantId,
      tenantName,
      enabledModules,
      firmRole,
      secondaryFirmRole,
      isLoading,
      isReady,
      setTenantId,
      refreshTenantContext,
      hasModule,
      canSwitchTenant,
    ],
  );

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant yalnızca TenantProvider içinde kullanılabilir.');
  }
  return context;
}
