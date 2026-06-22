import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { getTenants } from '@/api/tenants';
import { getSubscriptionPlan, getSubscriptionsByTenant } from '@/api/subscriptions';
import { useAuth } from '@/contexts/AuthContext';
import type { FeatureModuleName, Tenant } from '@/types';
import { STORAGE_KEYS } from '@/types';
import { parseEnabledModules } from '@/utils/jwt';

interface TenantContextValue {
  tenants: Tenant[];
  tenantId: string | null;
  tenantName: string | null;
  enabledModules: FeatureModuleName[];
  isLoading: boolean;
  setTenantId: (tenantId: string) => void;
  refreshTenantContext: () => Promise<void>;
  hasModule: (module: FeatureModuleName) => boolean;
}

const TenantContext = createContext<TenantContextValue | null>(null);

const ALL_MODULES: FeatureModuleName[] = ['Metraj', 'Puantaj', 'Hakedis'];

export function TenantProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isAdmin } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantId, setTenantIdState] = useState<string | null>(() =>
    localStorage.getItem(STORAGE_KEYS.tenantId),
  );
  const [enabledModules, setEnabledModules] = useState<FeatureModuleName[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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
      const tenantResponse = await getTenants();
      const tenantItems = tenantResponse.items ?? [];
      setTenants(tenantItems);

      const activeTenantId =
        tenantId && tenantItems.some((tenant) => tenant.id === tenantId)
          ? tenantId
          : tenantItems[0]?.id ?? null;

      if (activeTenantId && activeTenantId !== tenantId) {
        setTenantId(activeTenantId);
      }

      if (!activeTenantId) {
        setEnabledModules(isAdmin ? ALL_MODULES : []);
        return;
      }

      if (isAdmin) {
        setEnabledModules(ALL_MODULES);
        return;
      }

      const subscriptions = await getSubscriptionsByTenant(activeTenantId);
      const activeSubscription =
        subscriptions.find((item) => item.status === 1) ?? subscriptions[0];

      if (!activeSubscription) {
        setEnabledModules([]);
        return;
      }

      const plan = await getSubscriptionPlan(activeSubscription.subscriptionPlanId);
      const modules = parseEnabledModules(plan.enabledModules) as FeatureModuleName[];
      setEnabledModules(modules);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, isAdmin, tenantId, setTenantId]);

  useEffect(() => {
    void refreshTenantContext();
  }, [refreshTenantContext]);

  const tenantName = useMemo(() => {
    return tenants.find((tenant) => tenant.id === tenantId)?.name ?? null;
  }, [tenants, tenantId]);

  const hasModule = useCallback(
    (module: FeatureModuleName) => {
      if (isAdmin) {
        return true;
      }
      return enabledModules.includes(module);
    },
    [enabledModules, isAdmin],
  );

  const value = useMemo(
    () => ({
      tenants,
      tenantId,
      tenantName,
      enabledModules,
      isLoading,
      setTenantId,
      refreshTenantContext,
      hasModule,
    }),
    [
      tenants,
      tenantId,
      tenantName,
      enabledModules,
      isLoading,
      setTenantId,
      refreshTenantContext,
      hasModule,
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
