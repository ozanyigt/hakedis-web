import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { getTenants } from '@/api/tenants';
import { getSubscriptionsByTenant } from '@/api/subscriptions';
import { getSubscriptionPlan } from '@/api/subscriptions';
import { getApiErrorMessage } from '@/api/client';
import { SUBSCRIPTION_STATUS_LABELS } from '@/config/platformLabels';
import type { Tenant } from '@/types';

interface TenantRow extends Tenant {
  activePlanName?: string;
  subscriptionStatus?: number;
}

export function PlatformTenantsPage() {
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await getTenants(0, 200);
        const items = response.items ?? [];

        const enriched = await Promise.all(
          items.map(async (tenant) => {
            const subscriptions = await getSubscriptionsByTenant(tenant.id);
            const active = subscriptions.find((item) => item.status === 1 || item.status === 2);
            if (!active) {
              return tenant;
            }

            try {
              const plan = await getSubscriptionPlan(active.subscriptionPlanId);
              return {
                ...tenant,
                activePlanName: plan.name,
                subscriptionStatus: active.status,
              };
            } catch {
              return {
                ...tenant,
                subscriptionStatus: active.status,
              };
            }
          }),
        );

        setTenants(enriched);
      } catch (loadError) {
        setError(getApiErrorMessage(loadError));
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Firmalar</h2>
          <p className="mt-1 text-sm text-slate-600">Platforma kayıtlı kurumlar</p>
        </div>
        <Link
          to="/platform/tenants/new"
          className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400"
        >
          <Plus size={16} />
          Yeni firma
        </Link>
      </div>

      {loading ? <p className="text-slate-600">Yükleniyor...</p> : null}
      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">Firma</th>
              <th className="px-4 py-3 font-medium">Vergi No</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <th className="px-4 py-3 font-medium">Abonelik</th>
              <th className="px-4 py-3 font-medium">Durum</th>
              <th className="px-4 py-3 font-medium">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {!loading && tenants.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  Henüz firma yok. Yeni firma sihirbazı ile başlayın.
                </td>
              </tr>
            ) : null}
            {tenants.map((tenant) => (
              <tr key={tenant.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 font-medium text-slate-900">{tenant.name}</td>
                <td className="px-4 py-3 text-slate-600">{tenant.taxNumber ?? '—'}</td>
                <td className="px-4 py-3 text-slate-600">{tenant.activePlanName ?? '—'}</td>
                <td className="px-4 py-3 text-slate-600">
                  {tenant.subscriptionStatus
                    ? SUBSCRIPTION_STATUS_LABELS[tenant.subscriptionStatus]
                    : '—'}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      tenant.isActive
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tenant.isActive ? 'Aktif' : 'Pasif'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link
                    to={`/platform/tenants/${tenant.id}`}
                    className="font-medium text-amber-700 hover:text-amber-800"
                  >
                    Detay
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
