import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, CreditCard, Package, Users } from 'lucide-react';
import { getDemoRequests } from '@/api/demoRequests';
import { getSubscriptionPlans } from '@/api/subscriptionPlans';
import { getSubscriptions } from '@/api/subscriptions';
import { getTenants } from '@/api/tenants';
import { getUsers } from '@/api/users';
import { getApiErrorMessage } from '@/api/client';
import { SUBSCRIPTION_STATUS_LABELS } from '@/config/platformLabels';

export function PlatformDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tenantCount, setTenantCount] = useState(0);
  const [activeTenantCount, setActiveTenantCount] = useState(0);
  const [planCount, setPlanCount] = useState(0);
  const [userCount, setUserCount] = useState(0);
  const [newDemoRequestCount, setNewDemoRequestCount] = useState(0);
  const [subscriptions, setSubscriptions] = useState<
    Array<{ status: number; tenantId: string }>
  >([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [tenantsRes, plansRes, usersRes, subsRes, demoRes] = await Promise.all([
          getTenants(0, 200),
          getSubscriptionPlans(0, 50),
          getUsers(0, 1),
          getSubscriptions(0, 200),
          getDemoRequests(0, 200),
        ]);

        const tenants = tenantsRes.items ?? [];
        setTenantCount(tenants.length);
        setActiveTenantCount(tenants.filter((tenant) => tenant.isActive).length);
        setPlanCount(plansRes.items?.length ?? 0);
        setUserCount(usersRes.count ?? 0);
        setSubscriptions(subsRes.items ?? []);
        const demoItems = demoRes.items ?? [];
        setNewDemoRequestCount(demoItems.filter((item) => item.status === 1).length);
      } catch (loadError) {
        setError(getApiErrorMessage(loadError));
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  const subscriptionStats = useMemo(() => {
    const counts = new Map<number, number>();
    for (const subscription of subscriptions) {
      counts.set(subscription.status, (counts.get(subscription.status) ?? 0) + 1);
    }
    return counts;
  }, [subscriptions]);

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-2xl font-bold text-slate-900">Platform Özeti</h2>
        <p className="mt-1 text-sm text-slate-600">
          Firmalar, abonelik planları ve atamaların genel görünümü.
        </p>
      </section>

      {loading ? <p className="text-slate-600">Yükleniyor...</p> : null}
      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <Building2 className="text-amber-600" size={22} />
            <div>
              <p className="text-sm text-slate-500">Firmalar</p>
              <p className="text-2xl font-bold text-slate-900">{tenantCount}</p>
              <p className="text-xs text-slate-500">{activeTenantCount} aktif</p>
            </div>
          </div>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <Package className="text-amber-600" size={22} />
            <div>
              <p className="text-sm text-slate-500">Abonelik planları</p>
              <p className="text-2xl font-bold text-slate-900">{planCount}</p>
            </div>
          </div>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <CreditCard className="text-amber-600" size={22} />
            <div>
              <p className="text-sm text-slate-500">Abonelik kayıtları</p>
              <p className="text-2xl font-bold text-slate-900">{subscriptions.length}</p>
            </div>
          </div>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <Users className="text-amber-600" size={22} />
            <div>
              <p className="text-sm text-slate-500">Kullanıcılar</p>
              <p className="text-2xl font-bold text-slate-900">{userCount}</p>
            </div>
          </div>
        </article>
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-slate-900">Abonelik durumları</h3>
          <ul className="mt-4 space-y-2 text-sm">
            {Object.entries(SUBSCRIPTION_STATUS_LABELS).map(([status, label]) => (
              <li key={status} className="flex justify-between text-slate-600">
                <span>{label}</span>
                <span className="font-medium text-slate-900">
                  {subscriptionStats.get(Number(status)) ?? 0}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-slate-900">Hızlı işlemler</h3>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              to="/platform/tenants/new"
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400"
            >
              Yeni firma aç
            </Link>
            <Link
              to="/platform/plans"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Plan yönetimi
            </Link>
            <Link
              to="/platform/demo-requests"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Demo talepleri ({newDemoRequestCount} yeni)
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
