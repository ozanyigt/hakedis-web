import { useCallback, useEffect, useState } from 'react';
import { Loader2, Plus, Trash2, Pencil, UserPlus } from 'lucide-react';
import { getApiErrorMessage } from '@/api/client';
import { exportPuantajExcel } from '@/api/exports';
import { getProjectsByTenant } from '@/api/projects';
import {
  createPuantajRecord,
  deletePuantajRecord,
  getPuantajRecordsByProject,
  updatePuantajRecord,
} from '@/api/puantajRecords';
import { getSitesByProject } from '@/api/sites';
import { createWorker, deleteWorker, getWorkersByTenant, updateWorker } from '@/api/workers';
import { FormField, formInputClass } from '@/components/FormField';
import { ExportExcelButton } from '@/components/ExportExcelButton';
import { ProjectSitesPanel } from '@/features/sites/ProjectSitesPanel';
import { useDialog } from '@/contexts/DialogContext';
import { useTenant } from '@/contexts/TenantContext';
import { buildPuantajRecordForm } from '@/utils/formDefaults';
import type { Project, PuantajRecord, Site, Worker } from '@/types';
import { PUANTAJ_STATUS_COLORS, PUANTAJ_STATUS_LABELS, WORK_TYPE_LABELS } from '@/types';
import { useSearchParams } from 'react-router-dom';

type Tab = 'records' | 'workers';

const GUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const EMPTY_WORKER_FORM = {
  fullName: '',
  trade: '',
  phone: '',
  identityNumber: '',
  isActive: true,
};

export function PuantajPage() {
  const [searchParams] = useSearchParams();
  const linkedProjectId = searchParams.get('projectId') ?? '';
  const linkedSiteId = searchParams.get('siteId') ?? '';
  const linkedWorkDate = searchParams.get('workDate') ?? '';
  const { tenantId } = useTenant();
  const { confirm } = useDialog();
  const [tab, setTab] = useState<Tab>('records');
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState('');
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [records, setRecords] = useState<PuantajRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [workerForm, setWorkerForm] = useState(EMPTY_WORKER_FORM);
  const [editingWorkerId, setEditingWorkerId] = useState<string | null>(null);

  const [recordForm, setRecordForm] = useState(buildPuantajRecordForm);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const loadData = useCallback(async (activeProjectId: string) => {
    if (!tenantId) return;

    setLoading(true);
    setError(null);
    try {
      const workerItems = await getWorkersByTenant(tenantId);
      setWorkers(workerItems);

      if (!activeProjectId || !GUID_PATTERN.test(activeProjectId)) {
        setRecords([]);
        setSites([]);
        return;
      }

      const [recordItems, siteItems] = await Promise.all([
        getPuantajRecordsByProject(activeProjectId),
        getSitesByProject(activeProjectId),
      ]);
      setRecords(recordItems.sort((a, b) => b.workDate.localeCompare(a.workDate)));
      setSites(siteItems);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    async function loadProjects() {
      if (!tenantId) {
        setProjects([]);
        setProjectId('');
        return;
      }
      try {
        const items = await getProjectsByTenant(tenantId);
        setProjects(items);
        setProjectId(items.some((item) => item.id === linkedProjectId) ? linkedProjectId : (items[0]?.id ?? ''));
      } catch (loadError) {
        setError(getApiErrorMessage(loadError));
      }
    }
    void loadProjects();
  }, [linkedProjectId, tenantId]);

  useEffect(() => {
    void loadData(projectId);
  }, [projectId, loadData]);

  useEffect(() => {
    if (!linkedSiteId && !linkedWorkDate) return;
    setRecordForm((current) => ({
      ...current,
      siteId: linkedSiteId || current.siteId,
      workDate: linkedWorkDate || current.workDate,
    }));
  }, [linkedSiteId, linkedWorkDate]);

  function workerName(id?: string | null) {
    if (!id) return '-';
    return workers.find((w) => w.id === id)?.fullName ?? id.slice(0, 8);
  }

  function siteName(id?: string | null) {
    if (!id) return '-';
    return sites.find((s) => s.id === id)?.name ?? '-';
  }

  async function handleSaveWorker() {
    if (!tenantId || !workerForm.fullName.trim()) {
      setError('İşçi adı zorunludur.');
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const payload = {
        tenantId,
        fullName: workerForm.fullName.trim(),
        trade: workerForm.trade.trim() || undefined,
        phone: workerForm.phone.trim() || undefined,
        identityNumber: workerForm.identityNumber.trim() || undefined,
        isActive: workerForm.isActive,
      };
      if (editingWorkerId) {
        await updateWorker({ id: editingWorkerId, ...payload });
        setMessage('İşçi güncellendi.');
      } else {
        await createWorker(payload);
        setMessage('İşçi eklendi.');
      }
      setWorkerForm(EMPTY_WORKER_FORM);
      setEditingWorkerId(null);
      await loadData(projectId);
    } catch (saveError) {
      setError(getApiErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveRecord() {
    if (!tenantId || !projectId) {
      setError('Proje seçimi zorunludur.');
      return;
    }
    if (!recordForm.workerId) {
      setError('İşçi seçimi zorunludur.');
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const payload = {
        tenantId,
        projectId,
        siteId: recordForm.siteId || null,
        workerId: recordForm.workerId || null,
        workDate: new Date(recordForm.workDate).toISOString(),
        workType: Number(recordForm.workType),
        dayCount: Number(recordForm.dayCount),
        overtimeHours: Number(recordForm.overtimeHours) || 0,
        status: editingRecordId
          ? (records.find((r) => r.id === editingRecordId)?.status ?? 1)
          : 1,
        notes: recordForm.notes.trim() || null,
      };
      if (editingRecordId) {
        await updatePuantajRecord({ id: editingRecordId, ...payload });
        setMessage('Puantaj kaydı güncellendi.');
      } else {
        await createPuantajRecord(payload);
        setMessage('Puantaj kaydı eklendi.');
      }
      setRecordForm(buildPuantajRecordForm());
      setEditingRecordId(null);
      await loadData(projectId);
    } catch (saveError) {
      setError(getApiErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  async function changeRecordStatus(record: PuantajRecord, newStatus: number) {
    if (!tenantId) return;
    setSaving(true);
    setError(null);
    try {
      await updatePuantajRecord({
        id: record.id,
        tenantId,
        projectId: record.projectId,
        siteId: record.siteId,
        workerId: record.workerId,
        workDate: record.workDate,
        workType: record.workType,
        dayCount: record.dayCount,
        overtimeHours: record.overtimeHours,
        status: newStatus,
        notes: record.notes,
      });
      setMessage(`Durum: ${PUANTAJ_STATUS_LABELS[newStatus]}`);
      await loadData(projectId);
    } catch (statusError) {
      setError(getApiErrorMessage(statusError));
    } finally {
      setSaving(false);
    }
  }

  function canModifyPuantajRecord(status: number) {
    return status !== 3;
  }

  function startEditRecord(record: PuantajRecord) {
    setEditingRecordId(record.id);
    setRecordForm({
      workerId: record.workerId ?? '',
      siteId: record.siteId ?? '',
      workDate: record.workDate.slice(0, 10),
      workType: String(record.workType),
      dayCount: String(record.dayCount),
      overtimeHours: record.overtimeHours ? String(record.overtimeHours) : '',
      notes: record.notes ?? '',
    });
    setError(null);
    setMessage(null);
  }

  async function handleDeleteRecord(record: PuantajRecord) {
    const label = `${new Date(record.workDate).toLocaleDateString('tr-TR')} — ${workerName(record.workerId)}`;
    const confirmed = await confirm({
      title: 'Puantaj kaydını sil',
      message: `"${label}" puantaj kaydını silmek istediğinize emin misiniz?`,
      variant: 'danger',
      confirmLabel: 'Sil',
    });
    if (!confirmed) {
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await deletePuantajRecord(record.id);
      if (editingRecordId === record.id) {
        setEditingRecordId(null);
        setRecordForm(buildPuantajRecordForm());
      }
      setMessage('Puantaj kaydı silindi.');
      await loadData(projectId);
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError));
    } finally {
      setSaving(false);
    }
  }

  const totalDays = records.reduce((sum, r) => sum + Number(r.dayCount), 0);
  const totalOvertime = records.reduce((sum, r) => sum + Number(r.overtimeHours), 0);

  async function handleExportExcel() {
    if (!tenantId || !projectId || !GUID_PATTERN.test(projectId)) return;
    setExporting(true);
    setError(null);
    try {
      await exportPuantajExcel(tenantId, projectId);
      setMessage('Puantaj listesi Excel olarak indirildi.');
    } catch (exportError) {
      setError(getApiErrorMessage(exportError));
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-2xl font-bold text-slate-900">Puantaj</h2>
        <p className="mt-1 text-sm text-slate-600">
          İşçi tanımları, günlük puantaj kayıtları ve onay akışı.
        </p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <label className="block text-sm font-medium text-slate-700">
            Proje
            <select
              className="mt-1 w-full max-w-md rounded-lg border border-slate-300 px-3 py-2"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            >
              <option value="">Proje seçin</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </label>
          <ExportExcelButton
            disabled={!projectId || records.length === 0}
            loading={exporting}
            onClick={() => void handleExportExcel()}
          />
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-slate-50 px-4 py-3">
            <p className="text-xs text-slate-500">Kayıt sayısı</p>
            <p className="text-xl font-semibold text-slate-900">{records.length}</p>
          </div>
          <div className="rounded-lg bg-slate-50 px-4 py-3">
            <p className="text-xs text-slate-500">Toplam iş günü</p>
            <p className="text-xl font-semibold text-slate-900">{totalDays.toFixed(1)}</p>
          </div>
          <div className="rounded-lg bg-slate-50 px-4 py-3">
            <p className="text-xs text-slate-500">Toplam mesai (saat)</p>
            <p className="text-xl font-semibold text-slate-900">{totalOvertime.toFixed(1)}</p>
          </div>
        </div>
      </section>

      <div className="flex gap-2 border-b border-slate-200">
        {(['records', 'workers'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium ${
              tab === t
                ? 'border-b-2 border-brand-600 text-brand-700'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t === 'records' ? 'Puantaj Kayıtları' : 'İşçiler'}
          </button>
        ))}
      </div>

      {message ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>
      ) : null}
      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      {tab === 'workers' ? (
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="flex items-center gap-2 font-semibold text-slate-900">
              <UserPlus size={18} />
              {editingWorkerId ? 'İşçi Düzenle' : 'Yeni İşçi'}
            </h3>
            <div className="mt-4 space-y-4">
              <FormField label="Ad Soyad" required>
                <input
                  className={formInputClass}
                  placeholder="Örn. Ahmet Yılmaz"
                  value={workerForm.fullName}
                  onChange={(e) => setWorkerForm({ ...workerForm, fullName: e.target.value })}
                />
              </FormField>
              <FormField label="Meslek" hint="Opsiyonel">
                <input
                  className={formInputClass}
                  placeholder="Örn. Kalıpçı"
                  value={workerForm.trade}
                  onChange={(e) => setWorkerForm({ ...workerForm, trade: e.target.value })}
                />
              </FormField>
              <FormField label="Telefon" hint="Opsiyonel">
                <input
                  className={formInputClass}
                  placeholder="05xx xxx xx xx"
                  value={workerForm.phone}
                  onChange={(e) => setWorkerForm({ ...workerForm, phone: e.target.value })}
                />
              </FormField>
              <FormField label="TC Kimlik No" hint="Opsiyonel">
                <input
                  className={formInputClass}
                  placeholder="11 haneli"
                  value={workerForm.identityNumber}
                  onChange={(e) => setWorkerForm({ ...workerForm, identityNumber: e.target.value })}
                />
              </FormField>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={workerForm.isActive}
                  onChange={(e) => setWorkerForm({ ...workerForm, isActive: e.target.checked })}
                />
                Aktif
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void handleSaveWorker()}
                  className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
                >
                  {saving ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}
                  {editingWorkerId ? 'Güncelle' : 'Ekle'}
                </button>
                {editingWorkerId ? (
                  <button
                    type="button"
                    onClick={() => { setEditingWorkerId(null); setWorkerForm(EMPTY_WORKER_FORM); }}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
                  >
                    İptal
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Ad Soyad</th>
                  <th className="px-4 py-3 font-medium">Meslek</th>
                  <th className="px-4 py-3 font-medium">Telefon</th>
                  <th className="px-4 py-3 font-medium">Durum</th>
                  <th className="px-4 py-3 font-medium">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {workers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-slate-500">Henüz işçi yok.</td>
                  </tr>
                ) : null}
                {workers.map((w) => (
                  <tr key={w.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 font-medium text-slate-900">{w.fullName}</td>
                    <td className="px-4 py-3 text-slate-600">{w.trade ?? '-'}</td>
                    <td className="px-4 py-3 text-slate-600">{w.phone ?? '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${w.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                        {w.isActive ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button
                          type="button"
                          className="rounded border border-slate-300 px-2 py-1 text-xs"
                          onClick={() => {
                            setEditingWorkerId(w.id);
                            setWorkerForm({
                              fullName: w.fullName,
                              trade: w.trade ?? '',
                              phone: w.phone ?? '',
                              identityNumber: w.identityNumber ?? '',
                              isActive: w.isActive,
                            });
                          }}
                        >
                          Düzenle
                        </button>
                        <button
                          type="button"
                          className="rounded border border-red-200 px-2 py-1 text-xs text-red-600"
                          onClick={() => void deleteWorker(w.id).then(() => loadData(projectId))}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {projectId && tenantId ? (
            <ProjectSitesPanel
              compact
              tenantId={tenantId}
              projectId={projectId}
              projectName={projects.find((p) => p.id === projectId)?.name}
              onSitesChange={setSites}
              onSiteCreated={(site) => setRecordForm((prev) => ({ ...prev, siteId: site.id }))}
            />
          ) : null}

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-slate-900">
              {editingRecordId ? 'Kayıt Düzenle' : 'Yeni Puantaj Kaydı'}
            </h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <FormField label="İşçi" required>
                <select
                  className={formInputClass}
                  value={recordForm.workerId}
                  onChange={(e) => setRecordForm({ ...recordForm, workerId: e.target.value })}
                >
                  <option value="">Seçin</option>
                  {workers.filter((w) => w.isActive || w.id === recordForm.workerId).map((w) => (
                    <option key={w.id} value={w.id}>{w.fullName}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Şantiye" hint="Opsiyonel">
                <select
                  className={formInputClass}
                  value={recordForm.siteId}
                  onChange={(e) => setRecordForm({ ...recordForm, siteId: e.target.value })}
                >
                  <option value="">Seçilmedi</option>
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Çalışma tarihi" required>
                <input
                  type="date"
                  className={formInputClass}
                  value={recordForm.workDate}
                  onChange={(e) => setRecordForm({ ...recordForm, workDate: e.target.value })}
                />
              </FormField>
              <FormField label="İş tipi" required>
                <select
                  className={formInputClass}
                  value={recordForm.workType}
                  onChange={(e) => setRecordForm({ ...recordForm, workType: e.target.value })}
                >
                  {Object.entries(WORK_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Gün" required hint="Tam gün için 1">
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  className={formInputClass}
                  value={recordForm.dayCount}
                  onChange={(e) => setRecordForm({ ...recordForm, dayCount: e.target.value })}
                />
              </FormField>
              <FormField label="Mesai (saat)" hint="Boş bırakılırsa 0">
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  className={formInputClass}
                  placeholder="0"
                  value={recordForm.overtimeHours}
                  onChange={(e) => setRecordForm({ ...recordForm, overtimeHours: e.target.value })}
                />
              </FormField>
              <FormField label="Not" className="sm:col-span-2" hint="Opsiyonel">
                <input
                  className={formInputClass}
                  placeholder="Açıklama"
                  value={recordForm.notes}
                  onChange={(e) => setRecordForm({ ...recordForm, notes: e.target.value })}
                />
              </FormField>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                disabled={saving || !projectId}
                onClick={() => void handleSaveRecord()}
                className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
              >
                {saving ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}
                {editingRecordId ? 'Güncelle' : 'Kaydet'}
              </button>
              {editingRecordId ? (
                <button
                  type="button"
                  onClick={() => { setEditingRecordId(null); setRecordForm(buildPuantajRecordForm()); }}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
                >
                  İptal
                </button>
              ) : null}
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Tarih</th>
                  <th className="px-4 py-3 font-medium">İşçi</th>
                  <th className="px-4 py-3 font-medium">Şantiye</th>
                  <th className="px-4 py-3 font-medium">İş Tipi</th>
                  <th className="px-4 py-3 font-medium">Gün</th>
                  <th className="px-4 py-3 font-medium">Mesai</th>
                  <th className="px-4 py-3 font-medium">Durum</th>
                  <th className="px-4 py-3 font-medium">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="px-4 py-6 text-center text-slate-500">Yükleniyor...</td></tr>
                ) : null}
                {!loading && records.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-6 text-center text-slate-500">Kayıt yok.</td></tr>
                ) : null}
                {records.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3">{new Date(r.workDate).toLocaleDateString('tr-TR')}</td>
                    <td className="px-4 py-3 font-medium">{workerName(r.workerId)}</td>
                    <td className="px-4 py-3">{siteName(r.siteId)}</td>
                    <td className="px-4 py-3">{WORK_TYPE_LABELS[r.workType] ?? r.workType}</td>
                    <td className="px-4 py-3">{r.dayCount}</td>
                    <td className="px-4 py-3">{r.overtimeHours}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${PUANTAJ_STATUS_COLORS[r.status] ?? ''}`}>
                        {PUANTAJ_STATUS_LABELS[r.status] ?? r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {canModifyPuantajRecord(r.status) ? (
                          <>
                            <button
                              type="button"
                              disabled={saving}
                              className="inline-flex items-center gap-1 rounded border border-slate-300 px-2 py-0.5 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                              onClick={() => startEditRecord(r)}
                            >
                              <Pencil size={12} />
                              Düzenle
                            </button>
                            <button
                              type="button"
                              disabled={saving}
                              className="inline-flex items-center gap-1 rounded border border-red-200 px-2 py-0.5 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                              onClick={() => void handleDeleteRecord(r)}
                            >
                              <Trash2 size={12} />
                              Sil
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-slate-400">Onaylı kayıt</span>
                        )}
                        {r.status === 1 ? (
                          <button type="button" disabled={saving} className="rounded border border-slate-300 px-2 py-0.5 text-xs" onClick={() => void changeRecordStatus(r, 2)}>Gönder</button>
                        ) : null}
                        {r.status === 2 ? (
                          <>
                            <button type="button" disabled={saving} className="rounded border border-emerald-300 px-2 py-0.5 text-xs text-emerald-700" onClick={() => void changeRecordStatus(r, 3)}>Onayla</button>
                            <button type="button" disabled={saving} className="rounded border border-red-300 px-2 py-0.5 text-xs text-red-600" onClick={() => void changeRecordStatus(r, 4)}>Reddet</button>
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
