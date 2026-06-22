import { useCallback, useEffect, useState } from 'react';
import { Loader2, Plus, Trash2, UserPlus } from 'lucide-react';
import { getApiErrorMessage } from '@/api/client';
import { getProjectsByTenant } from '@/api/projects';
import {
  createPuantajRecord,
  deletePuantajRecord,
  getPuantajRecordsByProject,
  updatePuantajRecord,
} from '@/api/puantajRecords';
import { getSitesByProject } from '@/api/sites';
import { createWorker, deleteWorker, getWorkersByTenant, updateWorker } from '@/api/workers';
import { useTenant } from '@/contexts/TenantContext';
import type { Project, PuantajRecord, Site, Worker } from '@/types';
import { PUANTAJ_STATUS_COLORS, PUANTAJ_STATUS_LABELS } from '@/types';

type Tab = 'records' | 'workers';

const GUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const EMPTY_WORKER_FORM = {
  fullName: '',
  trade: '',
  phone: '',
  identityNumber: '',
  isActive: true,
};

const EMPTY_RECORD_FORM = {
  workerId: '',
  siteId: '',
  workDate: new Date().toISOString().slice(0, 10),
  workType: 'Gündüz',
  dayCount: '1',
  overtimeHours: '0',
  notes: '',
};

export function PuantajPage() {
  const { tenantId } = useTenant();
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

  const [recordForm, setRecordForm] = useState(EMPTY_RECORD_FORM);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);

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
        setProjectId(items[0]?.id ?? '');
      } catch (loadError) {
        setError(getApiErrorMessage(loadError));
      }
    }
    void loadProjects();
  }, [tenantId]);

  useEffect(() => {
    void loadData(projectId);
  }, [projectId, loadData]);

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
        workType: recordForm.workType.trim(),
        dayCount: Number(recordForm.dayCount),
        overtimeHours: Number(recordForm.overtimeHours),
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
      setRecordForm(EMPTY_RECORD_FORM);
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

  const totalDays = records.reduce((sum, r) => sum + Number(r.dayCount), 0);
  const totalOvertime = records.reduce((sum, r) => sum + Number(r.overtimeHours), 0);

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-2xl font-bold text-slate-900">Puantaj</h2>
        <p className="mt-1 text-sm text-slate-600">
          İşçi tanımları, günlük puantaj kayıtları ve onay akışı.
        </p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
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
            <div className="mt-4 space-y-3">
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Ad Soyad *"
                value={workerForm.fullName}
                onChange={(e) => setWorkerForm({ ...workerForm, fullName: e.target.value })}
              />
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Meslek (ör. Kalıpçı)"
                value={workerForm.trade}
                onChange={(e) => setWorkerForm({ ...workerForm, trade: e.target.value })}
              />
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Telefon"
                value={workerForm.phone}
                onChange={(e) => setWorkerForm({ ...workerForm, phone: e.target.value })}
              />
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="TC Kimlik No"
                value={workerForm.identityNumber}
                onChange={(e) => setWorkerForm({ ...workerForm, identityNumber: e.target.value })}
              />
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
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-slate-900">
              {editingRecordId ? 'Kayıt Düzenle' : 'Yeni Puantaj Kaydı'}
            </h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <select
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={recordForm.workerId}
                onChange={(e) => setRecordForm({ ...recordForm, workerId: e.target.value })}
              >
                <option value="">İşçi seçin</option>
                {workers.filter((w) => w.isActive).map((w) => (
                  <option key={w.id} value={w.id}>{w.fullName}</option>
                ))}
              </select>
              <select
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={recordForm.siteId}
                onChange={(e) => setRecordForm({ ...recordForm, siteId: e.target.value })}
              >
                <option value="">Şantiye (opsiyonel)</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <input
                type="date"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={recordForm.workDate}
                onChange={(e) => setRecordForm({ ...recordForm, workDate: e.target.value })}
              />
              <input
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="İş tipi"
                value={recordForm.workType}
                onChange={(e) => setRecordForm({ ...recordForm, workType: e.target.value })}
              />
              <input
                type="number"
                min="0"
                step="0.5"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Gün"
                value={recordForm.dayCount}
                onChange={(e) => setRecordForm({ ...recordForm, dayCount: e.target.value })}
              />
              <input
                type="number"
                min="0"
                step="0.5"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Mesai (saat)"
                value={recordForm.overtimeHours}
                onChange={(e) => setRecordForm({ ...recordForm, overtimeHours: e.target.value })}
              />
              <input
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
                placeholder="Not"
                value={recordForm.notes}
                onChange={(e) => setRecordForm({ ...recordForm, notes: e.target.value })}
              />
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
                  onClick={() => { setEditingRecordId(null); setRecordForm(EMPTY_RECORD_FORM); }}
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
                    <td className="px-4 py-3">{r.workType}</td>
                    <td className="px-4 py-3">{r.dayCount}</td>
                    <td className="px-4 py-3">{r.overtimeHours}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${PUANTAJ_STATUS_COLORS[r.status] ?? ''}`}>
                        {PUANTAJ_STATUS_LABELS[r.status] ?? r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {r.status === 1 ? (
                          <button type="button" className="rounded border border-slate-300 px-2 py-0.5 text-xs" onClick={() => void changeRecordStatus(r, 2)}>Gönder</button>
                        ) : null}
                        {r.status === 2 ? (
                          <>
                            <button type="button" className="rounded border border-emerald-300 px-2 py-0.5 text-xs text-emerald-700" onClick={() => void changeRecordStatus(r, 3)}>Onayla</button>
                            <button type="button" className="rounded border border-red-300 px-2 py-0.5 text-xs text-red-600" onClick={() => void changeRecordStatus(r, 4)}>Reddet</button>
                          </>
                        ) : null}
                        {r.status === 1 || r.status === 4 ? (
                          <button
                            type="button"
                            className="rounded border border-slate-300 px-2 py-0.5 text-xs"
                            onClick={() => {
                              setEditingRecordId(r.id);
                              setRecordForm({
                                workerId: r.workerId ?? '',
                                siteId: r.siteId ?? '',
                                workDate: r.workDate.slice(0, 10),
                                workType: r.workType,
                                dayCount: String(r.dayCount),
                                overtimeHours: String(r.overtimeHours),
                                notes: r.notes ?? '',
                              });
                            }}
                          >
                            Düzenle
                          </button>
                        ) : null}
                        {r.status !== 3 ? (
                          <button type="button" className="rounded border border-red-200 px-2 py-0.5 text-xs text-red-600" onClick={() => void deletePuantajRecord(r.id).then(() => loadData(projectId))}>
                            Sil
                          </button>
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
