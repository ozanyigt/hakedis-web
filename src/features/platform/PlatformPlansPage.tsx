import { useEffect, useState, type FormEvent } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import {
  createSubscriptionPlan,
  deleteSubscriptionPlan,
  getSubscriptionPlans,
  updateSubscriptionPlan,
  type SubscriptionPlanPayload,
} from '@/api/subscriptionPlans';
import { getApiErrorMessage } from '@/api/client';
import {
  PLATFORM_MODULES,
  formatEnabledModules,
  modulesToCsv,
  parseModulesCsv,
} from '@/config/platformLabels';
import type { SubscriptionPlanDetail } from '@/types';

const EMPTY_FORM: SubscriptionPlanPayload = {
  code: '',
  name: '',
  description: '',
  monthlyPrice: 0,
  yearlyPrice: 0,
  enabledModules: 'Metraj',
  maxSiteCount: 10,
  isActive: true,
};

export function PlatformPlansPage() {
  const [plans, setPlans] = useState<SubscriptionPlanDetail[]>([]);
  const [form, setForm] = useState<SubscriptionPlanPayload>(EMPTY_FORM);
  const [selectedModules, setSelectedModules] = useState<string[]>(['Metraj']);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function loadPlans() {
    setLoading(true);
    setError(null);
    try {
      const response = await getSubscriptionPlans(0, 50);
      setPlans(response.items ?? []);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPlans();
  }, []);

  function resetForm() {
    setForm(EMPTY_FORM);
    setSelectedModules(['Metraj']);
    setEditingId(null);
  }

  function startEdit(plan: SubscriptionPlanDetail) {
    setEditingId(plan.id);
    setForm({
      code: plan.code,
      name: plan.name,
      description: plan.description ?? '',
      monthlyPrice: plan.monthlyPrice,
      yearlyPrice: plan.yearlyPrice,
      enabledModules: plan.enabledModules,
      maxSiteCount: plan.maxSiteCount,
      isActive: plan.isActive,
    });
    setSelectedModules(parseModulesCsv(plan.enabledModules));
  }

  function toggleModule(module: string) {
    setSelectedModules((prev) => {
      const next = prev.includes(module)
        ? prev.filter((item) => item !== module)
        : [...prev, module];
      setForm((current) => ({ ...current, enabledModules: modulesToCsv(next) }));
      return next;
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (selectedModules.length === 0) {
      setError('En az bir modül seçin.');
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    const payload = { ...form, enabledModules: modulesToCsv(selectedModules) };

    try {
      if (editingId) {
        await updateSubscriptionPlan(editingId, payload);
        setMessage('Plan güncellendi.');
      } else {
        await createSubscriptionPlan(payload);
        setMessage('Plan oluşturuldu.');
      }
      resetForm();
      await loadPlans();
    } catch (saveError) {
      setError(getApiErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Bu planı silmek istediğinize emin misiniz?')) {
      return;
    }

    try {
      await deleteSubscriptionPlan(id);
      setMessage('Plan silindi.');
      if (editingId === id) {
        resetForm();
      }
      await loadPlans();
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError));
    }
  }

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-2xl font-bold text-slate-900">Abonelik Planları</h2>
        <p className="mt-1 text-sm text-slate-600">
          Modül paketlerini tanımlayın; firmalara bu planlar atanır.
        </p>
      </section>

      {message ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>
      ) : null}
      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Kod</th>
                <th className="px-4 py-3 font-medium">Ad</th>
                <th className="px-4 py-3 font-medium">Modüller</th>
                <th className="px-4 py-3 font-medium">Durum</th>
                <th className="px-4 py-3 font-medium">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                    Yükleniyor...
                  </td>
                </tr>
              ) : null}
              {!loading && plans.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                    Henüz plan yok.
                  </td>
                </tr>
              ) : null}
              {plans.map((plan) => (
                <tr key={plan.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-medium">{plan.code}</td>
                  <td className="px-4 py-3">{plan.name}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatEnabledModules(plan.enabledModules)}
                  </td>
                  <td className="px-4 py-3">
                    {plan.isActive ? 'Aktif' : 'Pasif'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="text-amber-700 hover:underline"
                        onClick={() => startEdit(plan)}
                      >
                        Düzenle
                      </button>
                      <button
                        type="button"
                        className="text-red-600 hover:underline"
                        onClick={() => void handleDelete(plan.id)}
                      >
                        <Trash2 size={14} className="inline" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h3 className="flex items-center gap-2 font-semibold text-slate-900">
            <Plus size={18} />
            {editingId ? 'Planı düzenle' : 'Yeni plan'}
          </h3>
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Kod</span>
            <input
              required
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="METRAJ_PRO"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Ad</span>
            <input
              required
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>
          <div>
            <p className="text-sm font-medium text-slate-700">Modüller</p>
            <div className="mt-2 flex flex-wrap gap-3">
              {PLATFORM_MODULES.map((module) => (
                <label key={module} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedModules.includes(module)}
                    onChange={() => toggleModule(module)}
                  />
                  {module}
                </label>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Aylık (₺)</span>
              <input
                type="number"
                min={0}
                step="0.01"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                value={form.monthlyPrice}
                onChange={(e) =>
                  setForm({ ...form, monthlyPrice: Number(e.target.value) })
                }
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Yıllık (₺)</span>
              <input
                type="number"
                min={0}
                step="0.01"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                value={form.yearlyPrice}
                onChange={(e) =>
                  setForm({ ...form, yearlyPrice: Number(e.target.value) })
                }
              />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            Plan aktif
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-60"
            >
              {saving ? 'Kaydediliyor...' : editingId ? 'Güncelle' : 'Oluştur'}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
              >
                İptal
              </button>
            ) : null}
          </div>
        </form>
      </div>
    </div>
  );
}
