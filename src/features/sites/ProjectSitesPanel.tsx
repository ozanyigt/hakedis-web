import { useCallback, useEffect, useState } from 'react';
import { Loader2, Plus, Trash2, X } from 'lucide-react';
import { FormField, formInputClass } from '@/components/FormField';
import { getApiErrorMessage } from '@/api/client';
import { useDialog } from '@/contexts/DialogContext';
import { createSite, deleteSite, getSitesByProject, updateSite } from '@/api/sites';
import type { Site } from '@/types';
import { SITE_STATUS_LABELS } from '@/types';

const EMPTY_SITE_FORM = {
  name: '',
  code: '',
  location: '',
  status: '1',
  description: '',
};

interface ProjectSitesPanelProps {
  tenantId: string;
  projectId: string;
  projectName?: string;
  compact?: boolean;
  onSitesChange?: (sites: Site[]) => void;
  onSiteCreated?: (site: Site) => void;
  onClose?: () => void;
}

export function ProjectSitesPanel({
  tenantId,
  projectId,
  projectName,
  compact = false,
  onSitesChange,
  onSiteCreated,
  onClose,
}: ProjectSitesPanelProps) {
  const { confirm } = useDialog();
  const [sites, setSites] = useState<Site[]>([]);
  const [form, setForm] = useState(EMPTY_SITE_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const publishSites = useCallback(
    (items: Site[]) => {
      setSites(items);
      onSitesChange?.(items);
    },
    [onSitesChange],
  );

  const loadSites = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await getSitesByProject(projectId);
      publishSites(items);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [projectId, publishSites]);

  useEffect(() => {
    void loadSites();
  }, [loadSites]);

  function resetForm() {
    setForm(EMPTY_SITE_FORM);
    setEditingId(null);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setError('Şantiye adı zorunludur.');
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const payload = {
        tenantId,
        projectId,
        name: form.name.trim(),
        code: form.code.trim() || null,
        location: form.location.trim() || null,
        status: Number(form.status),
        description: form.description.trim() || null,
      };

      if (editingId) {
        await updateSite({ id: editingId, ...payload });
        setMessage('Şantiye güncellendi.');
      } else {
        const created = await createSite(payload);
        setMessage('Şantiye eklendi.');
        onSiteCreated?.(created);
      }

      resetForm();
      await loadSites();
    } catch (saveError) {
      setError(getApiErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(site: Site) {
    const confirmed = await confirm({
      title: 'Şantiyeyi sil',
      message: `"${site.name}" şantiyesini silmek istediğinize emin misiniz?`,
      variant: 'danger',
      confirmLabel: 'Sil',
    });
    if (!confirmed) return;

    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await deleteSite(site.id);
      setMessage(`"${site.name}" silindi.`);
      if (editingId === site.id) resetForm();
      await loadSites();
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError));
    } finally {
      setSaving(false);
    }
  }

  function startEdit(site: Site) {
    setEditingId(site.id);
    setForm({
      name: site.name,
      code: site.code ?? '',
      location: site.location ?? '',
      status: String(site.status),
      description: site.description ?? '',
    });
    setError(null);
    setMessage(null);
  }

  return (
    <section className={`rounded-xl border border-slate-200 bg-white shadow-sm ${compact ? 'p-4' : 'p-5'}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-slate-900">
            {compact ? 'Proje Şantiyeleri' : 'Şantiyeler'}
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            {projectName ? `${projectName} — ` : ''}
            Puantaj ve metraj kayıtlarında şantiye seçimi için tanımlayın.
          </p>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-slate-300 p-1 text-slate-500 hover:bg-slate-50"
            aria-label="Kapat"
          >
            <X size={16} />
          </button>
        ) : null}
      </div>

      <div className={`mt-4 grid gap-4 ${compact ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
        <FormField label="Şantiye adı" required>
          <input
            className={formInputClass}
            placeholder="Örn. A Blok"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </FormField>
        <FormField label="Kod" hint="Opsiyonel">
          <input
            className={formInputClass}
            placeholder="Örn. A-BLK"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
          />
        </FormField>
        <FormField label="Konum" hint="Opsiyonel">
          <input
            className={formInputClass}
            placeholder="Saha adresi"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
        </FormField>
        <FormField label="Durum" required>
          <select
            className={formInputClass}
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            {Object.entries(SITE_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </FormField>
        {!compact ? (
          <FormField label="Açıklama" className="sm:col-span-2 lg:col-span-3" hint="Opsiyonel">
            <input
              className={formInputClass}
              placeholder="Şantiye notu"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </FormField>
        ) : null}
      </div>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={saving}
          onClick={() => void handleSave()}
          className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {saving ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}
          {editingId ? 'Güncelle' : 'Şantiye Ekle'}
        </button>
        {editingId ? (
          <button
            type="button"
            onClick={resetForm}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
          >
            İptal
          </button>
        ) : null}
      </div>

      {message ? (
        <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>
      ) : null}
      {error ? (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      {!compact ? (
        <div className="mt-4 overflow-x-auto rounded-lg border border-slate-100">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-2 font-medium">Şantiye</th>
                <th className="px-3 py-2 font-medium">Kod</th>
                <th className="px-3 py-2 font-medium">Konum</th>
                <th className="px-3 py-2 font-medium">Durum</th>
                <th className="px-3 py-2 font-medium">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-3 py-4 text-center text-slate-500">Yükleniyor...</td>
                </tr>
              ) : null}
              {!loading && sites.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-4 text-center text-slate-500">
                    Henüz şantiye yok. Yukarıdan ekleyin.
                  </td>
                </tr>
              ) : null}
              {sites.map((site) => (
                <tr key={site.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-3 py-2 font-medium text-slate-900">{site.name}</td>
                  <td className="px-3 py-2 text-slate-600">{site.code ?? '-'}</td>
                  <td className="px-3 py-2 text-slate-600">{site.location ?? '-'}</td>
                  <td className="px-3 py-2">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                      {SITE_STATUS_LABELS[site.status] ?? site.status}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      <button
                        type="button"
                        className="rounded border border-slate-300 px-2 py-0.5 text-xs"
                        onClick={() => startEdit(site)}
                      >
                        Düzenle
                      </button>
                      <button
                        type="button"
                        disabled={saving}
                        className="inline-flex items-center gap-1 rounded border border-red-200 px-2 py-0.5 text-xs text-red-600"
                        onClick={() => void handleDelete(site)}
                      >
                        <Trash2 size={12} />
                        Sil
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : sites.length > 0 ? (
        <p className="mt-3 text-xs text-slate-600">
          Tanımlı şantiyeler: {sites.map((s) => s.name).join(', ')}
        </p>
      ) : !loading ? (
        <p className="mt-3 text-xs text-amber-700">Henüz şantiye yok — yukarıdan ekleyin.</p>
      ) : null}
    </section>
  );
}
