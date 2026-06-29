import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { getTenantById, updateTenant, type TenantPayload } from '@/api/tenants';
import {
  createSubscription,
  getSubscriptionsByTenant,
  updateSubscription,
  type SubscriptionPayload,
} from '@/api/subscriptions';
import { getSubscriptionPlans } from '@/api/subscriptionPlans';
import { getUsers } from '@/api/users';
import { getApiErrorMessage } from '@/api/client';
import {
  BILLING_CYCLE_LABELS,
  SUBSCRIPTION_STATUS_LABELS,
  formatEnabledModules,
} from '@/config/platformLabels';
import { getFirmRoleLabel } from '@/config/firmRoles';
import type { AppUser, Subscription, SubscriptionPlanDetail, TenantDetail } from '@/types';

export function PlatformTenantDetailPage() {
  const { tenantId = '' } = useParams();
  const [tenant, setTenant] = useState<TenantDetail | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlanDetail[]>([]);
  const [planNames, setPlanNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [tenantForm, setTenantForm] = useState<TenantPayload>({
    name: '',
    isActive: true,
  });

  const [subscriptionForm, setSubscriptionForm] = useState<SubscriptionPayload>({
    tenantId: '',
    subscriptionPlanId: '',
    billingCycle: 1,
    status: 1,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: null,
    isManualAssignment: true,
    notes: '',
  });

  const loadData = useCallback(async () => {
    if (!tenantId) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [tenantData, subscriptionItems, usersRes, plansRes] = await Promise.all([
        getTenantById(tenantId),
        getSubscriptionsByTenant(tenantId),
        getUsers(0, 50, tenantId),
        getSubscriptionPlans(0, 50),
      ]);

      setTenant(tenantData);
      setTenantForm({
        name: tenantData.name,
        taxNumber: tenantData.taxNumber ?? '',
        taxOffice: tenantData.taxOffice ?? '',
        address: tenantData.address ?? '',
        phone: tenantData.phone ?? '',
        email: tenantData.email ?? '',
        isActive: tenantData.isActive,
      });
      setSubscriptions(subscriptionItems);
      setUsers(usersRes.items ?? []);
      setPlans(plansRes.items ?? []);

      const names: Record<string, string> = {};
      for (const plan of plansRes.items ?? []) {
        names[plan.id] = plan.name;
      }
      setPlanNames(names);

      const latest = subscriptionItems[0];
      if (latest) {
        setSubscriptionForm({
          tenantId,
          subscriptionPlanId: latest.subscriptionPlanId,
          billingCycle: latest.billingCycle,
          status: latest.status,
          startDate: latest.startDate.slice(0, 10),
          endDate: latest.endDate?.slice(0, 10) ?? null,
          isManualAssignment: latest.isManualAssignment ?? true,
          notes: latest.notes ?? '',
        });
      } else {
        setSubscriptionForm((prev) => ({
          ...prev,
          tenantId,
          subscriptionPlanId: plansRes.items?.[0]?.id ?? '',
        }));
      }
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleTenantSave(event: FormEvent) {
    event.preventDefault();
    if (!tenant) {
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await updateTenant(tenant.id, tenantForm);
      setMessage('Firma bilgileri güncellendi.');
      await loadData();
    } catch (saveError) {
      setError(getApiErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  async function handleSubscriptionSave(event: FormEvent) {
    event.preventDefault();
    if (!tenantId || !subscriptionForm.subscriptionPlanId) {
      setError('Abonelik planı seçin.');
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const payload: SubscriptionPayload = {
        ...subscriptionForm,
        tenantId,
        startDate: new Date(subscriptionForm.startDate).toISOString(),
        endDate: subscriptionForm.endDate
          ? new Date(subscriptionForm.endDate).toISOString()
          : null,
      };

      const existing = subscriptions[0];
      if (existing) {
        await updateSubscription(existing.id, payload);
      } else {
        await createSubscription(payload);
      }

      setMessage('Abonelik kaydedildi.');
      await loadData();
    } catch (saveError) {
      setError(getApiErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-slate-600">Yükleniyor...</p>;
  }

  if (!tenant) {
    return <p className="text-red-700">Firma bulunamadı.</p>;
  }

  return (
    <div className="space-y-6">
      <Link
        to="/platform/tenants"
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft size={16} />
        Firmalara dön
      </Link>

      <section>
        <h2 className="text-2xl font-bold text-slate-900">{tenant.name}</h2>
        <p className="mt-1 text-sm text-slate-600">Firma detayı, abonelik ve kullanıcılar</p>
      </section>

      {message ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>
      ) : null}
      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <form
          onSubmit={handleTenantSave}
          className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h3 className="font-semibold text-slate-900">Firma bilgileri</h3>
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Firma adı</span>
            <input
              required
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              value={tenantForm.name}
              onChange={(e) => setTenantForm({ ...tenantForm, name: e.target.value })}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Vergi no</span>
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                value={tenantForm.taxNumber ?? ''}
                onChange={(e) => setTenantForm({ ...tenantForm, taxNumber: e.target.value })}
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Vergi dairesi</span>
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                value={tenantForm.taxOffice ?? ''}
                onChange={(e) => setTenantForm({ ...tenantForm, taxOffice: e.target.value })}
              />
            </label>
          </div>
          <label className="block text-sm">
            <span className="font-medium text-slate-700">E-posta</span>
            <input
              type="email"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              value={tenantForm.email ?? ''}
              onChange={(e) => setTenantForm({ ...tenantForm, email: e.target.value })}
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Telefon</span>
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              value={tenantForm.phone ?? ''}
              onChange={(e) => setTenantForm({ ...tenantForm, phone: e.target.value })}
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={tenantForm.isActive}
              onChange={(e) => setTenantForm({ ...tenantForm, isActive: e.target.checked })}
            />
            Firma aktif
          </label>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-60"
          >
            Kaydet
          </button>
        </form>

        <form
          onSubmit={handleSubscriptionSave}
          className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h3 className="font-semibold text-slate-900">Abonelik</h3>
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Plan</span>
            <select
              required
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              value={subscriptionForm.subscriptionPlanId}
              onChange={(e) =>
                setSubscriptionForm({ ...subscriptionForm, subscriptionPlanId: e.target.value })
              }
            >
              <option value="">Plan seçin</option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} ({formatEnabledModules(plan.enabledModules)})
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Durum</span>
              <select
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                value={subscriptionForm.status}
                onChange={(e) =>
                  setSubscriptionForm({ ...subscriptionForm, status: Number(e.target.value) })
                }
              >
                {Object.entries(SUBSCRIPTION_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Faturalama</span>
              <select
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                value={subscriptionForm.billingCycle}
                onChange={(e) =>
                  setSubscriptionForm({ ...subscriptionForm, billingCycle: Number(e.target.value) })
                }
              >
                {Object.entries(BILLING_CYCLE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Başlangıç</span>
              <input
                type="date"
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                value={subscriptionForm.startDate}
                onChange={(e) =>
                  setSubscriptionForm({ ...subscriptionForm, startDate: e.target.value })
                }
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Bitiş (opsiyonel)</span>
              <input
                type="date"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                value={subscriptionForm.endDate ?? ''}
                onChange={(e) =>
                  setSubscriptionForm({
                    ...subscriptionForm,
                    endDate: e.target.value || null,
                  })
                }
              />
            </label>
          </div>
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Not</span>
            <textarea
              rows={2}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              value={subscriptionForm.notes ?? ''}
              onChange={(e) => setSubscriptionForm({ ...subscriptionForm, notes: e.target.value })}
            />
          </label>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-60"
          >
            Aboneliği kaydet
          </button>
        </form>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-slate-900">Kullanıcılar</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-600">
              <tr>
                <th className="px-3 py-2 font-medium">Ad Soyad</th>
                <th className="px-3 py-2 font-medium">E-posta</th>
                <th className="px-3 py-2 font-medium">Rol</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-3 py-4 text-slate-500">
                    Bu firmada kullanıcı yok.
                  </td>
                </tr>
              ) : null}
              {users.map((user) => (
                <tr key={user.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-3 py-2">
                    {user.firstName} {user.lastName}
                  </td>
                  <td className="px-3 py-2">{user.email}</td>
                  <td className="px-3 py-2">
                    {user.firmRole ? getFirmRoleLabel(user.firmRole) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {subscriptions.length > 0 ? (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-slate-900">Abonelik geçmişi</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {subscriptions.map((subscription) => (
              <li key={subscription.id}>
                {planNames[subscription.subscriptionPlanId] ?? subscription.subscriptionPlanId} —{' '}
                {SUBSCRIPTION_STATUS_LABELS[subscription.status]} (
                {subscription.startDate.slice(0, 10)}
                {subscription.endDate ? ` → ${subscription.endDate.slice(0, 10)}` : ''})
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
