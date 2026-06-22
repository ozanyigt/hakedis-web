import { useCallback, useEffect, useState } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import {
  createProject,
  deleteProject,
  getProjectsByTenant,
  updateProject,
} from '@/api/projects';
import { getApiErrorMessage } from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import type { Project } from '@/types';
import { PROJECT_STATUS_LABELS } from '@/types';

const EMPTY_FORM = {
  name: '',
  code: '',
  location: '',
  clientName: '',
  contractAmount: '',
  startDate: '',
  endDate: '',
  status: '1',
  description: '',
};

function formatMoney(value: number) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value);
}

export function ProjectsPage() {
  const { isAdmin } = useAuth();
  const { tenantId, tenantName, tenants, setTenantId } = useTenant();
  const [projects, setProjects] = useState<Project[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    if (!tenantId) {
      setProjects([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const items = await getProjectsByTenant(tenantId);
      setProjects(items);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
  }

  async function handleSave() {
    if (!tenantId || !form.name.trim()) {
      setError('Proje adı zorunludur.');
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const payload = {
        tenantId,
        name: form.name.trim(),
        code: form.code.trim() || null,
        location: form.location.trim() || null,
        clientName: form.clientName.trim() || null,
        contractAmount: Number(form.contractAmount) || 0,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        status: Number(form.status),
        description: form.description.trim() || null,
      };

      if (editingId) {
        await updateProject({ id: editingId, ...payload });
        setMessage('Proje güncellendi.');
      } else {
        await createProject(payload);
        setMessage('Yeni proje oluşturuldu.');
      }

      resetForm();
      await loadProjects();
    } catch (saveError) {
      setError(getApiErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(project: Project) {
    const confirmed = window.confirm(`"${project.name}" projesini silmek istediğinize emin misiniz?`);
    if (!confirmed) return;

    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await deleteProject(project.id);
      setMessage(`"${project.name}" silindi.`);
      if (editingId === project.id) resetForm();
      await loadProjects();
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError));
    } finally {
      setSaving(false);
    }
  }

  function startEdit(project: Project) {
    setEditingId(project.id);
    setForm({
      name: project.name,
      code: project.code ?? '',
      location: project.location ?? '',
      clientName: project.clientName ?? '',
      contractAmount: String(project.contractAmount ?? 0),
      startDate: project.startDate ? project.startDate.slice(0, 10) : '',
      endDate: project.endDate ? project.endDate.slice(0, 10) : '',
      status: String(project.status),
      description: project.description ?? '',
    });
    setError(null);
    setMessage(null);
  }

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-2xl font-bold text-slate-900">Projeler</h2>
        <p className="mt-1 text-sm text-slate-600">
          Kurumunuza bağlı inşaat projelerini oluşturun ve yönetin.
        </p>
      </section>

      {isAdmin && tenants.length > 1 ? (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <label className="block text-sm font-medium text-slate-700">
            Kurum
            <select
              className="mt-1 w-full max-w-md rounded-lg border border-slate-300 px-3 py-2"
              value={tenantId ?? ''}
              onChange={(e) => setTenantId(e.target.value)}
            >
              <option value="">Kurum seçin</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </label>
        </section>
      ) : tenantName ? (
        <p className="text-sm text-slate-600">
          Kurum: <strong className="text-slate-900">{tenantName}</strong>
        </p>
      ) : null}

      {!tenantId ? (
        <p className="rounded-lg border border-dashed border-amber-300 bg-amber-50 px-4 py-6 text-center text-sm text-amber-800">
          Proje oluşturmak için önce bir kurum seçilmelidir.
        </p>
      ) : (
        <>
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-slate-900">
              {editingId ? 'Projeyi Düzenle' : 'Yeni Proje Oluştur'}
            </h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <input
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Proje adı *"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <input
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Proje kodu"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
              />
              <input
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="İşveren / müşteri"
                value={form.clientName}
                onChange={(e) => setForm({ ...form, clientName: e.target.value })}
              />
              <input
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Konum / şehir"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
              <input
                type="number"
                min="0"
                step="0.01"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Sözleşme bedeli (₺)"
                value={form.contractAmount}
                onChange={(e) => setForm({ ...form, contractAmount: e.target.value })}
              />
              <select
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                {Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <input
                type="date"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
              <input
                type="date"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
              <input
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2 lg:col-span-3"
                placeholder="Açıklama"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleSave()}
                className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
              >
                {saving ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                {editingId ? 'Güncelle' : 'Proje Oluştur'}
              </button>
              {editingId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700"
                >
                  İptal
                </button>
              ) : null}
            </div>
          </section>

          {message ? (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>
          ) : null}
          {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

          <section className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Proje</th>
                  <th className="px-4 py-3 font-medium">Kod</th>
                  <th className="px-4 py-3 font-medium">İşveren</th>
                  <th className="px-4 py-3 font-medium">Bedel</th>
                  <th className="px-4 py-3 font-medium">Durum</th>
                  <th className="px-4 py-3 font-medium">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-slate-500">Yükleniyor...</td>
                  </tr>
                ) : null}
                {!loading && projects.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                      Henüz proje yok. Yukarıdan yeni proje oluşturun.
                    </td>
                  </tr>
                ) : null}
                {projects.map((project) => (
                  <tr key={project.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{project.name}</p>
                      {project.location ? (
                        <p className="text-xs text-slate-500">{project.location}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{project.code ?? '-'}</td>
                    <td className="px-4 py-3 text-slate-600">{project.clientName ?? '-'}</td>
                    <td className="px-4 py-3 text-slate-700">{formatMoney(project.contractAmount ?? 0)}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                        {PROJECT_STATUS_LABELS[project.status] ?? project.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button
                          type="button"
                          className="rounded border border-slate-300 px-2 py-1 text-xs"
                          onClick={() => startEdit(project)}
                        >
                          Düzenle
                        </button>
                        <button
                          type="button"
                          disabled={saving}
                          className="inline-flex items-center gap-1 rounded border border-red-200 px-2 py-1 text-xs text-red-600"
                          onClick={() => void handleDelete(project)}
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
          </section>
        </>
      )}
    </div>
  );
}
