import { useEffect, useState } from 'react';
import { getMetrajPoliciesByTenant, saveMetrajPolicies, type MetrajPolicyItemPayload } from '@/api/metrajPolicies';
import { getApiErrorMessage } from '@/api/client';
import { useTenant } from '@/contexts/TenantContext';
import type { MetrajPolicy } from '@/types';

const EMPTY_ROW: MetrajPolicyItemPayload = {
  code: '',
  title: '',
  body: '',
  isActive: true,
};

export function MetrajPolicyPanel() {
  const { tenantId } = useTenant();
  const [rows, setRows] = useState<MetrajPolicyItemPayload[]>([{ ...EMPTY_ROW }]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!tenantId) {
        setRows([{ ...EMPTY_ROW }]);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const policies: MetrajPolicy[] = await getMetrajPoliciesByTenant(tenantId);
        if (policies.length === 0) {
          setRows([
            {
              code: 'K-12',
              title: 'Kırık / kesik kiriş',
              body: 'Süreksiz veya hasarlı kiriş hatları sayılmaz.',
              isActive: true,
            },
            {
              code: 'K-01',
              title: 'Küçük niş ihmal',
              body: '0.50 m² altındaki nişler ihmal edilebilir.',
              isActive: true,
            },
            {
              code: 'K-20',
              title: 'Belirsizlikte inceleme',
              body: 'Belirsiz geometri/katmanda needs_review seçilir.',
              isActive: true,
            },
          ]);
        } else {
          setRows(
            policies.map((policy) => ({
              code: policy.code,
              title: policy.title,
              body: policy.body,
              isActive: policy.isActive,
            })),
          );
        }
      } catch (loadError) {
        setError(getApiErrorMessage(loadError));
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [tenantId]);

  async function handleSave() {
    if (!tenantId) {
      setError('Kurum seçimi zorunlu.');
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const cleaned = rows.filter((row) => row.code.trim() && row.title.trim());
      await saveMetrajPolicies(tenantId, cleaned);
      setMessage('Metraj politikaları kaydedildi. Yapay zeka hükümlerinde bu kurallar kullanılır.');
    } catch (saveError) {
      setError(getApiErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Firma Metraj Politikası</h3>
      <p className="mt-1 text-sm text-slate-600">
        Yapay zeka yalnızca bu kurallara göre say / sayma / incele önerisi üretir; m² uydurmaz.
      </p>

      {loading ? <p className="mt-3 text-sm text-slate-500">Yükleniyor...</p> : null}
      {message ? <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <div className="mt-4 space-y-3">
        {rows.map((row, index) => (
          <div key={`policy-${index}`} className="grid gap-2 rounded-lg border border-slate-100 bg-slate-50 p-3 md:grid-cols-12">
            <input
              className="rounded-md border border-slate-300 px-2 py-1.5 text-sm md:col-span-2"
              placeholder="Kod (K-12)"
              value={row.code}
              onChange={(event) => {
                const next = [...rows];
                next[index] = { ...row, code: event.target.value };
                setRows(next);
              }}
            />
            <input
              className="rounded-md border border-slate-300 px-2 py-1.5 text-sm md:col-span-3"
              placeholder="Başlık"
              value={row.title}
              onChange={(event) => {
                const next = [...rows];
                next[index] = { ...row, title: event.target.value };
                setRows(next);
              }}
            />
            <input
              className="rounded-md border border-slate-300 px-2 py-1.5 text-sm md:col-span-5"
              placeholder="Kural metni"
              value={row.body}
              onChange={(event) => {
                const next = [...rows];
                next[index] = { ...row, body: event.target.value };
                setRows(next);
              }}
            />
            <label className="flex items-center gap-2 text-sm text-slate-700 md:col-span-1">
              <input
                type="checkbox"
                checked={row.isActive}
                onChange={(event) => {
                  const next = [...rows];
                  next[index] = { ...row, isActive: event.target.checked };
                  setRows(next);
                }}
              />
              Aktif
            </label>
            <button
              type="button"
              className="rounded-md border border-red-200 px-2 py-1 text-xs text-red-600 md:col-span-1"
              onClick={() => setRows(rows.filter((_, i) => i !== index))}
            >
              Sil
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          onClick={() => setRows([...rows, { ...EMPTY_ROW }])}
        >
          Kural ekle
        </button>
        <button
          type="button"
          disabled={saving || !tenantId}
          className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          onClick={() => void handleSave()}
        >
          {saving ? 'Kaydediliyor...' : 'Politikaları kaydet'}
        </button>
      </div>
    </section>
  );
}
