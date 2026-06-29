import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { createTenant, type TenantPayload } from '@/api/tenants';
import { createSubscription, type SubscriptionPayload } from '@/api/subscriptions';
import { getSubscriptionPlans } from '@/api/subscriptionPlans';
import { createUser } from '@/api/users';
import { getApiErrorMessage } from '@/api/client';
import { BILLING_CYCLE_LABELS, SUBSCRIPTION_STATUS_LABELS } from '@/config/platformLabels';
import type { SubscriptionPlanDetail } from '@/types';

const STEPS = ['Firma', 'Abonelik', 'Yönetici'] as const;

function addDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function PlatformNewTenantWizardPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [plans, setPlans] = useState<SubscriptionPlanDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [tenantForm, setTenantForm] = useState<TenantPayload>({
    name: '',
    taxNumber: '',
    taxOffice: '',
    email: '',
    phone: '',
    isActive: true,
  });

  const [subscriptionForm, setSubscriptionForm] = useState({
    subscriptionPlanId: '',
    billingCycle: 1,
    status: 1,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: addDays(14),
    notes: 'Platform admin — yeni firma',
  });

  const [adminForm, setAdminForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });

  useEffect(() => {
    async function loadPlans() {
      try {
        const response = await getSubscriptionPlans(0, 50);
        const items = response.items ?? [];
        setPlans(items);
        if (items[0]) {
          setSubscriptionForm((prev) => ({ ...prev, subscriptionPlanId: items[0].id }));
        }
      } catch (loadError) {
        setError(getApiErrorMessage(loadError));
      }
    }

    void loadPlans();
  }, []);

  function goNext() {
    if (step === 0 && !tenantForm.name.trim()) {
      setError('Firma adı zorunludur.');
      return;
    }
    if (step === 1 && !subscriptionForm.subscriptionPlanId) {
      setError('Abonelik planı seçin.');
      return;
    }
    setError(null);
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!adminForm.firstName.trim() || !adminForm.email.trim() || !adminForm.password.trim()) {
      setError('Yönetici bilgileri eksik.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const tenant = await createTenant(tenantForm);

      const subscriptionPayload: SubscriptionPayload = {
        tenantId: tenant.id,
        subscriptionPlanId: subscriptionForm.subscriptionPlanId,
        billingCycle: subscriptionForm.billingCycle,
        status: subscriptionForm.status,
        startDate: new Date(subscriptionForm.startDate).toISOString(),
        endDate: subscriptionForm.endDate
          ? new Date(subscriptionForm.endDate).toISOString()
          : null,
        isManualAssignment: true,
        notes: subscriptionForm.notes,
      };
      await createSubscription(subscriptionPayload);

      await createUser({
        firstName: adminForm.firstName.trim(),
        lastName: adminForm.lastName.trim(),
        email: adminForm.email.trim(),
        password: adminForm.password,
        tenantId: tenant.id,
        firmRole: 1,
      });

      navigate(`/platform/tenants/${tenant.id}`);
    } catch (submitError) {
      setError(getApiErrorMessage(submitError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        to="/platform/tenants"
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft size={16} />
        Firmalara dön
      </Link>

      <section>
        <h2 className="text-2xl font-bold text-slate-900">Yeni firma sihirbazı</h2>
        <p className="mt-1 text-sm text-slate-600">
          Firma, abonelik ve ilk firma yöneticisini tek akışta oluşturun.
        </p>
      </section>

      <ol className="flex gap-2">
        {STEPS.map((label, index) => (
          <li
            key={label}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
              index === step
                ? 'bg-amber-500 text-slate-950'
                : index < step
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-100 text-slate-500'
            }`}
          >
            {index < step ? <Check size={14} /> : null}
            {label}
          </li>
        ))}
      </ol>

      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <form
        onSubmit={step === STEPS.length - 1 ? handleSubmit : (e) => e.preventDefault()}
        className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        {step === 0 ? (
          <>
            <h3 className="font-semibold text-slate-900">1. Firma bilgileri</h3>
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Firma adı *</span>
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
              <span className="font-medium text-slate-700">İletişim e-posta</span>
              <input
                type="email"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                value={tenantForm.email ?? ''}
                onChange={(e) => setTenantForm({ ...tenantForm, email: e.target.value })}
              />
            </label>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <h3 className="font-semibold text-slate-900">2. Abonelik planı</h3>
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Plan *</span>
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
                    {plan.name} — {plan.enabledModules}
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
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  value={subscriptionForm.startDate}
                  onChange={(e) =>
                    setSubscriptionForm({ ...subscriptionForm, startDate: e.target.value })
                  }
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium text-slate-700">Bitiş</span>
                <input
                  type="date"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  value={subscriptionForm.endDate}
                  onChange={(e) =>
                    setSubscriptionForm({ ...subscriptionForm, endDate: e.target.value })
                  }
                />
              </label>
            </div>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <h3 className="font-semibold text-slate-900">3. Firma yöneticisi</h3>
            <p className="text-sm text-slate-600">
              İlk kullanıcı <strong>Firma Yöneticisi</strong> rolüyle oluşturulur.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="font-medium text-slate-700">Ad *</span>
                <input
                  required
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  value={adminForm.firstName}
                  onChange={(e) => setAdminForm({ ...adminForm, firstName: e.target.value })}
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium text-slate-700">Soyad</span>
                <input
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  value={adminForm.lastName}
                  onChange={(e) => setAdminForm({ ...adminForm, lastName: e.target.value })}
                />
              </label>
            </div>
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Giriş e-postası *</span>
              <input
                type="email"
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                value={adminForm.email}
                onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Geçici şifre *</span>
              <input
                type="password"
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                value={adminForm.password}
                onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
              />
            </label>
          </>
        ) : null}

        <div className="flex justify-between pt-2">
          <button
            type="button"
            disabled={step === 0}
            onClick={() => setStep((current) => Math.max(current - 1, 0))}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-50"
          >
            Geri
          </button>
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={goNext}
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400"
            >
              İleri
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-60"
            >
              {loading ? 'Oluşturuluyor...' : 'Firmayı oluştur'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
