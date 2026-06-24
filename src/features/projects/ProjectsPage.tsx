import { useCallback, useEffect, useState } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import {
  createProject,
  deleteProject,
  getProjectsByTenant,
  updateProject,
} from '@/api/projects';
import { exportProjectsExcel } from '@/api/exports';
import { getApiErrorMessage } from '@/api/client';
import { ExportExcelButton } from '@/components/ExportExcelButton';
import { FormField, formInputClass } from '@/components/FormField';
import { useDialog } from '@/contexts/DialogContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { canManageProjects, hasClaim } from '@/config/permissions';
import type { Project } from '@/types';
import { PROJECT_STATUS_LABELS } from '@/types';
import { ProjectSitesPanel } from '@/features/sites/ProjectSitesPanel';

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
  const { isAdmin, roles } = useAuth();
  const { confirm } = useDialog();
  const { tenantId, tenantName, tenants, setTenantId } = useTenant();
  const manageProjects = canManageProjects(roles);
  const manageSites = hasClaim(roles, 'Sites.Read');
  const [projects, setProjects] = useState<Project[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sitesProjectId, setSitesProjectId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

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
    const confirmed = await confirm({
      title: 'Projeyi sil',
      message: `"${project.name}" projesini silmek istediğinize emin misiniz?`,
      variant: 'danger',
      confirmLabel: 'Sil',
    });
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

  async function handleExportExcel() {
    if (!tenantId) return;
    setExporting(true);
    setError(null);
    try {
      await exportProjectsExcel(tenantId);
      setMessage('Proje listesi Excel olarak indirildi.');
    } catch (exportError) {
      setError(getApiErrorMessage(exportError));
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Projeler</h2>
          <p className="mt-1 text-sm text-slate-600">
            {manageProjects
              ? 'Kurumunuza bağlı inşaat projelerini oluşturun ve yönetin.'
              : 'Projeleri görüntüleyin ve şantiye kayıtlarını yönetin.'}
          </p>
        </div>
        {tenantId && manageProjects ? (
          <ExportExcelButton
            disabled={projects.length === 0}
            loading={exporting}
            onClick={() => void handleExportExcel()}
          />
        ) : null}
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
          {manageProjects ? (
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-slate-900">
              {editingId ? 'Projeyi Düzenle' : 'Yeni Proje Oluştur'}
            </h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <FormField label="Proje adı" required>
                <input
                  className={formInputClass}
                  placeholder="Örn. Merkez Konut"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </FormField>
              <FormField label="Proje kodu" hint="Opsiyonel">
                <input
                  className={formInputClass}
                  placeholder="Örn. MK-2026"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                />
              </FormField>
              <FormField label="İşveren / müşteri" hint="Opsiyonel">
                <input
                  className={formInputClass}
                  placeholder="Firma adı"
                  value={form.clientName}
                  onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                />
              </FormField>
              <FormField label="Konum / şehir" hint="Opsiyonel">
                <input
                  className={formInputClass}
                  placeholder="Örn. İstanbul"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
              </FormField>
              <FormField label="Sözleşme bedeli (₺)" hint="Opsiyonel">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={formInputClass}
                  placeholder="0,00"
                  value={form.contractAmount}
                  onChange={(e) => setForm({ ...form, contractAmount: e.target.value })}
                />
              </FormField>
              <FormField label="Durum" required>
                <select
                  className={formInputClass}
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  {Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Başlangıç tarihi" hint="Opsiyonel">
                <input
                  type="date"
                  className={formInputClass}
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                />
              </FormField>
              <FormField label="Bitiş tarihi" hint="Opsiyonel">
                <input
                  type="date"
                  className={formInputClass}
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                />
              </FormField>
              <FormField label="Açıklama" className="sm:col-span-2 lg:col-span-3" hint="Opsiyonel">
                <input
                  className={formInputClass}
                  placeholder="Proje notu"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </FormField>
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
          ) : null}

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
                      {manageProjects
                        ? 'Henüz proje yok. Yukarıdan yeni proje oluşturun.'
                        : 'Henüz proje bulunmuyor.'}
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
                        {manageSites ? (
                        <button
                          type="button"
                          className="rounded border border-brand-300 px-2 py-1 text-xs text-brand-700"
                          onClick={() => setSitesProjectId(
                            sitesProjectId === project.id ? null : project.id,
                          )}
                        >
                          Şantiyeler
                        </button>
                        ) : null}
                        {manageProjects ? (
                        <>
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
                        </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {sitesProjectId && tenantId ? (
            <ProjectSitesPanel
              tenantId={tenantId}
              projectId={sitesProjectId}
              projectName={projects.find((p) => p.id === sitesProjectId)?.name}
              onClose={() => setSitesProjectId(null)}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
