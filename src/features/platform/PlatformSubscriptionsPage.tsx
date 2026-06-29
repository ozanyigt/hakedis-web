import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSubscriptions } from '@/api/subscriptions';
import { getTenants } from '@/api/tenants';
import { getSubscriptionPlans } from '@/api/subscriptionPlans';
import { getApiErrorMessage } from '@/api/client';
import { SUBSCRIPTION_STATUS_LABELS } from '@/config/platformLabels';
import type { Subscription, Tenant } from '@/types';

export function PlatformSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [planNames, setPlanNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [subsRes, tenantsRes, plansRes] = await Promise.all([
          getSubscriptions(0, 200),
          getTenants(0, 200),
          getSubscriptionPlans(0, 50),
        ]);
        setSubscriptions(subsRes.items ?? []);
        setTenants(tenantsRes.items ?? []);
        const names: Record<string, string> = {};
        for (const plan of plansRes.items ?? []) {
          names[plan.id] = plan.name;
        }
        setPlanNames(names);
      } catch (loadError) {
        setError(getApiErrorMessage(loadError));
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  const tenantNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const tenant of tenants) {
      map.set(tenant.id, tenant.name);
    }
    return map;
  }, [tenants]);

  return (
    <div className="space-y-4">
      <section>
        <h2 className="text-2xl font-bold text-slate-900">Abonelikler</h2>
        <p className="mt-1 text-sm text-slate-600">Firmalara atanmış tüm abonelik kayıtları</p>
      </section>

      {loading ? <p className="text-slate-600">Yükleniyor...</p> : null}
      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">Firma</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <th className="px-4 py-3 font-medium">Durum</th>
              <th className="px-4 py-3 font-medium">Başlangıç</th>
              <th className="px-4 py-3 font-medium">Bitiş</th>
              <th className="px-4 py-3 font-medium">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {!loading && subscriptions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  Abonelik kaydı yok.
                </td>
              </tr>
            ) : null}
            {subscriptions.map((subscription) => (
              <tr key={subscription.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 font-medium text-slate-900">
                  {tenantNames.get(subscription.tenantId) ?? subscription.tenantId}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {planNames[subscription.subscriptionPlanId] ?? '—'}
                </td>
                <td className="px-4 py-3">
                  {SUBSCRIPTION_STATUS_LABELS[subscription.status] ?? subscription.status}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {subscription.startDate.slice(0, 10)}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {subscription.endDate?.slice(0, 10) ?? '—'}
                </td>
                <td className="px-4 py-3">
                  <Link
                    to={`/platform/tenants/${subscription.tenantId}`}
                    className="font-medium text-amber-700 hover:text-amber-800"
                  >
                    Firma
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
