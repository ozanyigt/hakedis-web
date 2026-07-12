import { useCallback, useEffect, useState } from 'react';
import { Download, Loader2, Plus, Trash2 } from 'lucide-react';
import { getApiErrorMessage } from '@/api/client';
import {
  exportContractItemsExcel,
  exportHakedisExcel,
} from '@/api/exports';
import {
  createDeductionLine,
  deleteDeductionLine,
  getDeductionLinesByPeriod,
  updateDeductionLine,
} from '@/api/hakedisDeductionLines';
import {
  createContractItem,
  deleteContractItem,
  getContractItemsByProject,
  updateContractItem,
} from '@/api/contractItems';
import {
  createHakedisPeriod,
  deleteHakedisPeriod,
  getHakedisPeriodsByProject,
  updateHakedisPeriod,
} from '@/api/hakedisPeriods';
import { getMetrajResultsByProject } from '@/api/metraj';
import {
  createProgressEntry,
  deleteProgressEntry,
  getProgressEntriesByPeriod,
  updateProgressEntry,
} from '@/api/progressEntries';
import { getProjectsByTenant } from '@/api/projects';
import { FormField, formInputClass } from '@/components/FormField';
import { ExportExcelButton } from '@/components/ExportExcelButton';
import { useTenant } from '@/contexts/TenantContext';
import { buildContractItemForm, buildPeriodForm, nextSortOrder } from '@/utils/formDefaults';
import type { ContractItem, HakedisDeductionLine, HakedisPeriod, MetrajResult, ProgressEntry, Project } from '@/types';
import {
  ALLOWED_UNITS_BY_KALEM,
  DEFAULT_UNIT_BY_KALEM,
  DEDUCTION_CATEGORY_LABELS,
  HAKEDIS_STATUS_COLORS,
  HAKEDIS_STATUS_LABELS,
  MEASUREMENT_UNIT_LABELS,
  METRAJ_KALEM_LABELS,
} from '@/types';

type Tab = 'contract' | 'periods' | 'deductions' | 'progress';

const GUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function formatMoney(value: number) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value);
}

const EMPTY_PROGRESS_FORM = {
  contractItemId: '',
  quantityThisPeriod: '',
  notes: '',
};

const EMPTY_DEDUCTION_FORM = {
  category: '1',
  description: '',
  amount: '',
  notes: '',
};

export function HakedisPage() {
  const { tenantId } = useTenant();
  const [tab, setTab] = useState<Tab>('contract');
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState('');
  const [contractItems, setContractItems] = useState<ContractItem[]>([]);
  const [periods, setPeriods] = useState<HakedisPeriod[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState('');
  const [progressEntries, setProgressEntries] = useState<ProgressEntry[]>([]);
  const [allPeriodProgress, setAllPeriodProgress] = useState<ProgressEntry[]>([]);
  const [metrajResults, setMetrajResults] = useState<MetrajResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [contractForm, setContractForm] = useState(() => buildContractItemForm([]));
  const [editingContractId, setEditingContractId] = useState<string | null>(null);

  const [periodForm, setPeriodForm] = useState(() => buildPeriodForm([]));
  const [editingPeriodId, setEditingPeriodId] = useState<string | null>(null);

  const [progressForm, setProgressForm] = useState(EMPTY_PROGRESS_FORM);
  const [editingProgressId, setEditingProgressId] = useState<string | null>(null);
  const [deductionLines, setDeductionLines] = useState<HakedisDeductionLine[]>([]);
  const [deductionForm, setDeductionForm] = useState(EMPTY_DEDUCTION_FORM);
  const [editingDeductionId, setEditingDeductionId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const selectedPeriod = periods.find((p) => p.id === selectedPeriodId);

  const loadProjectData = useCallback(async (activeProjectId: string) => {
    if (!activeProjectId || !GUID_PATTERN.test(activeProjectId)) {
      setContractItems([]);
      setPeriods([]);
      setProgressEntries([]);
      setAllPeriodProgress([]);
      setMetrajResults([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [items, periodItems, metrajResult] = await Promise.all([
        getContractItemsByProject(activeProjectId),
        getHakedisPeriodsByProject(activeProjectId),
        getMetrajResultsByProject(activeProjectId).catch(() => [] as MetrajResult[]),
      ]);
      setContractItems(items);
      setPeriods(periodItems);
      setMetrajResults(metrajResult);

      if (periodItems.length > 0) {
        setSelectedPeriodId((prev) =>
          periodItems.find((p) => p.id === prev)?.id ?? periodItems[periodItems.length - 1].id,
        );
      } else {
        setSelectedPeriodId('');
      }

      const allProgress: ProgressEntry[] = [];
      for (const period of periodItems) {
        const entries = await getProgressEntriesByPeriod(period.id);
        allProgress.push(...entries);
      }
      setAllPeriodProgress(allProgress);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  const loadProgressForPeriod = useCallback(async (periodId: string) => {
    if (!periodId) {
      setProgressEntries([]);
      return;
    }
    try {
      const entries = await getProgressEntriesByPeriod(periodId);
      setProgressEntries(entries);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    }
  }, []);

  const loadDeductionLinesForPeriod = useCallback(async (periodId: string) => {
    if (!periodId) {
      setDeductionLines([]);
      return;
    }
    try {
      const lines = await getDeductionLinesByPeriod(periodId);
      setDeductionLines(lines);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    }
  }, []);

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
    void loadProjectData(projectId);
  }, [projectId, loadProjectData]);

  useEffect(() => {
    void loadProgressForPeriod(selectedPeriodId);
  }, [selectedPeriodId, loadProgressForPeriod]);

  useEffect(() => {
    void loadDeductionLinesForPeriod(selectedPeriodId);
  }, [selectedPeriodId, loadDeductionLinesForPeriod]);

  useEffect(() => {
    setEditingContractId(null);
    setEditingPeriodId(null);
    setEditingProgressId(null);
    setEditingDeductionId(null);
    setDeductionForm(EMPTY_DEDUCTION_FORM);
    setProgressForm(EMPTY_PROGRESS_FORM);
  }, [projectId]);

  useEffect(() => {
    if (!editingContractId) {
      setContractForm(buildContractItemForm(contractItems));
    }
  }, [contractItems, editingContractId]);

  useEffect(() => {
    if (!editingPeriodId) {
      setPeriodForm(buildPeriodForm(periods));
    }
  }, [periods, editingPeriodId]);

  function contractItemLabel(id: string) {
    const item = contractItems.find((c) => c.id === id);
    if (!item) return id.slice(0, 8);
    return `${METRAJ_KALEM_LABELS[item.kalemType] ?? item.kalemType} — ${item.description}`;
  }

  function priorCumulative(contractItemId: string, beforePeriodNumber: number) {
    const priorPeriodIds = periods
      .filter((p) => p.periodNumber < beforePeriodNumber)
      .map((p) => p.id);
    return allPeriodProgress
      .filter((e) => priorPeriodIds.includes(e.hakedisPeriodId) && e.contractItemId === contractItemId)
      .reduce((sum, e) => sum + Number(e.quantityThisPeriod), 0);
  }

  async function recalcPeriodTotals(periodId: string) {
    if (!tenantId) return;
    const period = periods.find((p) => p.id === periodId);
    if (!period) return;

    const entries = await getProgressEntriesByPeriod(periodId);
    const totalAmount = entries.reduce((sum, e) => sum + Number(e.amountThisPeriod), 0);
    const netAmount = totalAmount - Number(period.deductionAmount);

    await updateHakedisPeriod({
      ...period,
      tenantId,
      totalAmount,
      netAmount,
    });
  }

  async function handleSaveContract() {
    if (!tenantId || !projectId || !contractForm.description.trim()) {
      setError('Kalem açıklaması zorunludur.');
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const payload = {
        tenantId,
        projectId,
        kalemType: Number(contractForm.kalemType),
        description: contractForm.description.trim(),
        unit: Number(contractForm.unit),
        unitPrice: Number(contractForm.unitPrice),
        contractQuantity: contractForm.contractQuantity ? Number(contractForm.contractQuantity) : null,
        sortOrder: Number(contractForm.sortOrder) || nextSortOrder(contractItems),
      };
      if (editingContractId) {
        await updateContractItem({ id: editingContractId, ...payload });
        setMessage('Sözleşme kalemi güncellendi.');
      } else {
        await createContractItem(payload);
        setMessage('Sözleşme kalemi eklendi.');
      }
      setContractForm(buildContractItemForm(contractItems));
      setEditingContractId(null);
      await loadProjectData(projectId);
    } catch (saveError) {
      setError(getApiErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  async function handleSavePeriod() {
    if (!tenantId || !projectId || !periodForm.name.trim()) {
      setError('Dönem adı zorunludur.');
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const existing = editingPeriodId ? periods.find((p) => p.id === editingPeriodId) : null;
      const existingTotal = existing?.totalAmount ?? 0;
      const deduction = existing?.deductionAmount ?? 0;
      const payload = {
        tenantId,
        projectId,
        periodNumber: Number(periodForm.periodNumber),
        name: periodForm.name.trim(),
        periodStart: new Date(periodForm.periodStart).toISOString(),
        periodEnd: new Date(periodForm.periodEnd).toISOString(),
        status: editingPeriodId ? (periods.find((p) => p.id === editingPeriodId)?.status ?? 1) : 1,
        totalAmount: existingTotal,
        deductionAmount: deduction,
        netAmount: existingTotal - deduction,
        notes: periodForm.notes.trim() || null,
      };
      if (editingPeriodId) {
        await updateHakedisPeriod({ id: editingPeriodId, ...payload });
        setMessage('Hakediş dönemi güncellendi.');
      } else {
        const created = await createHakedisPeriod(payload);
        setSelectedPeriodId(created.id);
        setMessage('Hakediş dönemi oluşturuldu.');
      }
      setPeriodForm(buildPeriodForm(periods));
      setEditingPeriodId(null);
      await loadProjectData(projectId);
    } catch (saveError) {
      setError(getApiErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveProgress() {
    if (!tenantId || !selectedPeriodId || !progressForm.contractItemId) {
      setError('Dönem ve sözleşme kalemi seçin.');
      return;
    }
    const contractItem = contractItems.find((c) => c.id === progressForm.contractItemId);
    if (!contractItem || !selectedPeriod) return;

    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const qty = Number(progressForm.quantityThisPeriod);
      const prior = priorCumulative(contractItem.id, selectedPeriod.periodNumber);
      const cumulative = prior + qty;
      const amount = qty * Number(contractItem.unitPrice);

      const payload = {
        tenantId,
        hakedisPeriodId: selectedPeriodId,
        contractItemId: contractItem.id,
        quantityThisPeriod: qty,
        cumulativeQuantity: cumulative,
        amountThisPeriod: amount,
        metrajResultId: null,
        isManualEntry: true,
        notes: progressForm.notes.trim() || null,
      };

      if (editingProgressId) {
        await updateProgressEntry({ id: editingProgressId, ...payload });
        setMessage('İlerleme satırı güncellendi.');
      } else {
        await createProgressEntry(payload);
        setMessage('İlerleme satırı eklendi.');
      }

      await recalcPeriodTotals(selectedPeriodId);
      setProgressForm(EMPTY_PROGRESS_FORM);
      setEditingProgressId(null);
      await loadProjectData(projectId);
      await loadProgressForPeriod(selectedPeriodId);
    } catch (saveError) {
      setError(getApiErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  async function importFromMetraj() {
    if (!tenantId || !selectedPeriodId || !selectedPeriod) {
      setError('Önce bir hakediş dönemi seçin.');
      return;
    }
    if (metrajResults.length === 0) {
      setError('Bu projede metraj sonucu yok. Önce Metraj modülünden hesaplama yapın.');
      return;
    }

    const lockedMetraj = metrajResults.filter(
      (result) => Boolean(result.isLocked) || result.approvalStatus === 3,
    );
    if (lockedMetraj.length === 0) {
      setError(
        'Aktarılacak kilitli metraj yok. Metraj ekranında sonuçları onaylayıp kilitleyin; onaylanmamış miktar hakedişe alınmaz.',
      );
      return;
    }
    if (contractItems.length === 0) {
      setError('Önce sözleşme kalemleri tanımlayın.');
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      let imported = 0;
      for (const result of lockedMetraj) {
        const contractItem = contractItems.find((c) => c.kalemType === result.kalemType);
        if (!contractItem) continue;

        const existing = progressEntries.find((e) => e.contractItemId === contractItem.id);
        const qty = Number(result.quantity);
        const prior = priorCumulative(contractItem.id, selectedPeriod.periodNumber);
        const payload = {
          tenantId,
          hakedisPeriodId: selectedPeriodId,
          contractItemId: contractItem.id,
          quantityThisPeriod: qty,
          cumulativeQuantity: prior + qty,
          amountThisPeriod: qty * Number(contractItem.unitPrice),
          metrajResultId: result.id,
          isManualEntry: false,
          notes: `Metraj aktarımı: ${result.notes ?? ''}`,
        };

        if (existing) {
          await updateProgressEntry({ id: existing.id, ...payload });
        } else {
          await createProgressEntry(payload);
        }
        imported++;
      }

      await recalcPeriodTotals(selectedPeriodId);
      setMessage(`${imported} kalem metrajdan aktarıldı.`);
      await loadProjectData(projectId);
      await loadProgressForPeriod(selectedPeriodId);
    } catch (importError) {
      setError(getApiErrorMessage(importError));
    } finally {
      setSaving(false);
    }
  }

  async function changePeriodStatus(period: HakedisPeriod, newStatus: number) {
    if (!tenantId) return;
    setSaving(true);
    try {
      await updateHakedisPeriod({
        ...period,
        tenantId,
        status: newStatus,
      });
      setMessage(`Dönem durumu: ${HAKEDIS_STATUS_LABELS[newStatus]}`);
      await loadProjectData(projectId);
    } catch (statusError) {
      setError(getApiErrorMessage(statusError));
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveDeduction() {
    if (!tenantId || !selectedPeriodId || !deductionForm.description.trim()) {
      setError('Kesinti açıklaması zorunludur.');
      return;
    }
    const amount = Number(deductionForm.amount);
    if (!amount || amount <= 0) {
      setError('Geçerli bir kesinti tutarı girin.');
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const payload = {
        tenantId,
        hakedisPeriodId: selectedPeriodId,
        category: Number(deductionForm.category),
        description: deductionForm.description.trim(),
        amount,
        notes: deductionForm.notes.trim() || null,
      };
      if (editingDeductionId) {
        await updateDeductionLine({ id: editingDeductionId, ...payload });
        setMessage('Kesinti satırı güncellendi.');
      } else {
        await createDeductionLine(payload);
        setMessage('Kesinti satırı eklendi.');
      }
      setDeductionForm(EMPTY_DEDUCTION_FORM);
      setEditingDeductionId(null);
      await loadProjectData(projectId);
      await loadDeductionLinesForPeriod(selectedPeriodId);
    } catch (saveError) {
      setError(getApiErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  async function handleExportExcel(kind: 'hakedis' | 'contract') {
    if (!tenantId || !projectId || !GUID_PATTERN.test(projectId)) return;
    setExporting(true);
    setError(null);
    try {
      if (kind === 'contract') {
        await exportContractItemsExcel(tenantId, projectId);
        setMessage('Sözleşme kalemleri Excel olarak indirildi.');
      } else {
        await exportHakedisExcel(tenantId, projectId);
        setMessage('Hakediş paketi Excel olarak indirildi.');
      }
    } catch (exportError) {
      setError(getApiErrorMessage(exportError));
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-2xl font-bold text-slate-900">Hakediş</h2>
        <p className="mt-1 text-sm text-slate-600">
          Sözleşme kalemleri, hakediş dönemleri ve metraj entegrasyonlu ilerleme girişleri.
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
          <div className="flex flex-wrap gap-2">
            <ExportExcelButton
              label="Hakediş Excel"
              disabled={!projectId || periods.length === 0}
              loading={exporting}
              onClick={() => void handleExportExcel('hakedis')}
            />
            <ExportExcelButton
              label="Kalemler Excel"
              disabled={!projectId || contractItems.length === 0}
              loading={exporting}
              onClick={() => void handleExportExcel('contract')}
            />
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-2 border-b border-slate-200">
        {(['contract', 'periods', 'deductions', 'progress'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium ${
              tab === t ? 'border-b-2 border-brand-600 text-brand-700' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t === 'contract'
              ? 'Sözleşme Kalemleri'
              : t === 'periods'
                ? 'Hakediş Dönemleri'
                : t === 'deductions'
                  ? 'Kesintiler'
                  : 'İlerleme Girişleri'}
          </button>
        ))}
      </div>

      {message ? <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      {tab === 'contract' ? (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-slate-900">{editingContractId ? 'Kalem Düzenle' : 'Yeni Sözleşme Kalemi'}</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <FormField label="Kalem tipi" required>
                <select
                  className={formInputClass}
                  value={contractForm.kalemType}
                  onChange={(e) => {
                    const kalemType = e.target.value;
                    setContractForm({
                      ...contractForm,
                      kalemType,
                      unit: String(DEFAULT_UNIT_BY_KALEM[Number(kalemType)] ?? 1),
                    });
                  }}
                >
                  {Object.entries(METRAJ_KALEM_LABELS).map(([k, label]) => (
                    <option key={k} value={k}>{label}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Açıklama" required>
                <input
                  className={formInputClass}
                  placeholder="Örn. Dış cephe duvarı"
                  value={contractForm.description}
                  onChange={(e) => setContractForm({ ...contractForm, description: e.target.value })}
                />
              </FormField>
              <FormField label="Birim" required hint="Kalem tipine göre önerilir">
                <select
                  className={formInputClass}
                  value={contractForm.unit}
                  onChange={(e) => setContractForm({ ...contractForm, unit: e.target.value })}
                >
                  {(ALLOWED_UNITS_BY_KALEM[Number(contractForm.kalemType)] ?? [1]).map((unitValue) => (
                    <option key={unitValue} value={unitValue}>
                      {MEASUREMENT_UNIT_LABELS[unitValue]}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Birim fiyat (₺)" required>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={formInputClass}
                  placeholder="0,00"
                  value={contractForm.unitPrice}
                  onChange={(e) => setContractForm({ ...contractForm, unitPrice: e.target.value })}
                />
              </FormField>
              <FormField label="Sözleşme miktarı" hint="Opsiyonel">
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  className={formInputClass}
                  placeholder="Boş bırakılabilir"
                  value={contractForm.contractQuantity}
                  onChange={(e) => setContractForm({ ...contractForm, contractQuantity: e.target.value })}
                />
              </FormField>
              <FormField label="Sıra no" hint="Listede görünme sırası">
                <input
                  type="number"
                  min="1"
                  className={formInputClass}
                  value={contractForm.sortOrder}
                  onChange={(e) => setContractForm({ ...contractForm, sortOrder: e.target.value })}
                />
              </FormField>
            </div>
            <div className="mt-4 flex gap-2">
            <button type="button" disabled={saving || !projectId} onClick={() => void handleSaveContract()} className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
              {saving ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}
              {editingContractId ? 'Güncelle' : 'Ekle'}
            </button>
            {editingContractId ? (
              <button
                type="button"
                onClick={() => { setEditingContractId(null); setContractForm(buildContractItemForm(contractItems)); }}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700"
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
                  <th className="px-4 py-3 font-medium">Kalem</th>
                  <th className="px-4 py-3 font-medium">Açıklama</th>
                  <th className="px-4 py-3 font-medium">Birim</th>
                  <th className="px-4 py-3 font-medium">Birim Fiyat</th>
                  <th className="px-4 py-3 font-medium">Söz. Miktar</th>
                  <th className="px-4 py-3 font-medium">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {contractItems.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-500">Kalem tanımlı değil.</td></tr>
                ) : null}
                {contractItems.map((c) => (
                  <tr key={c.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 font-medium">{METRAJ_KALEM_LABELS[c.kalemType]}</td>
                    <td className="px-4 py-3">{c.description}</td>
                    <td className="px-4 py-3">{MEASUREMENT_UNIT_LABELS[c.unit] ?? c.unit}</td>
                    <td className="px-4 py-3">{formatMoney(c.unitPrice)}</td>
                    <td className="px-4 py-3">{c.contractQuantity ?? '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button type="button" className="rounded border border-slate-300 px-2 py-0.5 text-xs" onClick={() => { setEditingContractId(c.id); setContractForm({ kalemType: String(c.kalemType), description: c.description, unit: String(c.unit), unitPrice: String(c.unitPrice), contractQuantity: c.contractQuantity ? String(c.contractQuantity) : '', sortOrder: String(c.sortOrder) }); }}>Düzenle</button>
                        <button type="button" className="rounded border border-red-200 px-2 py-0.5 text-xs text-red-600" onClick={() => void deleteContractItem(c.id).then(() => loadProjectData(projectId))}><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {tab === 'periods' ? (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-slate-900">{editingPeriodId ? 'Dönem Düzenle' : 'Yeni Hakediş Dönemi'}</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <FormField label="Dönem no" required hint="Sözleşmedeki hakediş sırası">
                <input
                  type="number"
                  min="1"
                  className={formInputClass}
                  value={periodForm.periodNumber}
                  onChange={(e) => setPeriodForm({ ...periodForm, periodNumber: e.target.value })}
                />
              </FormField>
              <FormField label="Dönem adı" required>
                <input
                  className={formInputClass}
                  placeholder="Örn. 1. Hakediş"
                  value={periodForm.name}
                  onChange={(e) => setPeriodForm({ ...periodForm, name: e.target.value })}
                />
              </FormField>
              <FormField label="Başlangıç tarihi" required>
                <input
                  type="date"
                  className={formInputClass}
                  value={periodForm.periodStart}
                  onChange={(e) => setPeriodForm({ ...periodForm, periodStart: e.target.value })}
                />
              </FormField>
              <FormField label="Bitiş tarihi" required>
                <input
                  type="date"
                  className={formInputClass}
                  value={periodForm.periodEnd}
                  onChange={(e) => setPeriodForm({ ...periodForm, periodEnd: e.target.value })}
                />
              </FormField>
              <FormField label="Not" hint="Opsiyonel">
                <input
                  className={formInputClass}
                  placeholder="Dönem notu"
                  value={periodForm.notes}
                  onChange={(e) => setPeriodForm({ ...periodForm, notes: e.target.value })}
                />
              </FormField>
            </div>
            <div className="mt-4 flex gap-2">
            <button type="button" disabled={saving || !projectId} onClick={() => void handleSavePeriod()} className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
              {saving ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}
              {editingPeriodId ? 'Güncelle' : 'Oluştur'}
            </button>
            {editingPeriodId ? (
              <button
                type="button"
                onClick={() => { setEditingPeriodId(null); setPeriodForm(buildPeriodForm(periods)); }}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700"
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
                  <th className="px-4 py-3 font-medium">No</th>
                  <th className="px-4 py-3 font-medium">Ad</th>
                  <th className="px-4 py-3 font-medium">Tarih Aralığı</th>
                  <th className="px-4 py-3 font-medium">Toplam</th>
                  <th className="px-4 py-3 font-medium">Kesinti</th>
                  <th className="px-4 py-3 font-medium">Net</th>
                  <th className="px-4 py-3 font-medium">Durum</th>
                  <th className="px-4 py-3 font-medium">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {periods.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-6 text-center text-slate-500">Dönem yok.</td></tr>
                ) : null}
                {periods.map((p) => (
                  <tr key={p.id} className={`border-b border-slate-100 last:border-0 ${selectedPeriodId === p.id ? 'bg-brand-50/50' : ''}`}>
                    <td className="px-4 py-3 font-medium">{p.periodNumber}</td>
                    <td className="px-4 py-3">{p.name}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {new Date(p.periodStart).toLocaleDateString('tr-TR')} – {new Date(p.periodEnd).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-4 py-3">{formatMoney(p.totalAmount)}</td>
                    <td className="px-4 py-3">{formatMoney(p.deductionAmount)}</td>
                    <td className="px-4 py-3 font-semibold">{formatMoney(p.netAmount)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${HAKEDIS_STATUS_COLORS[p.status]}`}>
                        {HAKEDIS_STATUS_LABELS[p.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        <button type="button" className="rounded border border-brand-300 px-2 py-0.5 text-xs text-brand-700" onClick={() => { setSelectedPeriodId(p.id); setTab('progress'); }}>İlerleme</button>
                        {p.status === 1 ? <button type="button" className="rounded border border-slate-300 px-2 py-0.5 text-xs" onClick={() => void changePeriodStatus(p, 2)}>Gönder</button> : null}
                        {p.status === 2 ? (
                          <>
                            <button type="button" className="rounded border border-emerald-300 px-2 py-0.5 text-xs text-emerald-700" onClick={() => void changePeriodStatus(p, 3)}>Onayla</button>
                            <button type="button" className="rounded border border-red-300 px-2 py-0.5 text-xs text-red-600" onClick={() => void changePeriodStatus(p, 4)}>Reddet</button>
                          </>
                        ) : null}
                        <button type="button" className="rounded border border-red-200 px-2 py-0.5 text-xs text-red-600" onClick={() => void deleteHakedisPeriod(p.id).then(() => loadProjectData(projectId))}><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {tab === 'deductions' ? (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <label className="block text-sm font-medium text-slate-700">
              Hakediş dönemi
              <select
                className="mt-1 w-full max-w-md rounded-lg border border-slate-300 px-3 py-2"
                value={selectedPeriodId}
                onChange={(e) => setSelectedPeriodId(e.target.value)}
              >
                <option value="">Dönem seçin</option>
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>{p.periodNumber}. {p.name}</option>
                ))}
              </select>
            </label>
          </div>

          {selectedPeriod ? (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg bg-slate-50 px-4 py-3">
                  <p className="text-xs text-slate-500">Brüt tutar</p>
                  <p className="text-lg font-semibold">{formatMoney(selectedPeriod.totalAmount)}</p>
                </div>
                <div className="rounded-lg bg-slate-50 px-4 py-3">
                  <p className="text-xs text-slate-500">Toplam kesinti</p>
                  <p className="text-lg font-semibold text-red-700">{formatMoney(selectedPeriod.deductionAmount)}</p>
                </div>
                <div className="rounded-lg bg-slate-50 px-4 py-3">
                  <p className="text-xs text-slate-500">Net tutar</p>
                  <p className="text-lg font-semibold text-emerald-700">{formatMoney(selectedPeriod.netAmount)}</p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="font-semibold text-slate-900">{editingDeductionId ? 'Kesinti Düzenle' : 'Yeni Kesinti'}</h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <FormField label="Kategori" required>
                    <select
                      className={formInputClass}
                      value={deductionForm.category}
                      onChange={(e) => setDeductionForm({ ...deductionForm, category: e.target.value })}
                    >
                      {Object.entries(DEDUCTION_CATEGORY_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="Açıklama" required>
                    <input
                      className={formInputClass}
                      placeholder="Örn. Yemek kartı"
                      value={deductionForm.description}
                      onChange={(e) => setDeductionForm({ ...deductionForm, description: e.target.value })}
                    />
                  </FormField>
                  <FormField label="Tutar (₺)" required>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className={formInputClass}
                      value={deductionForm.amount}
                      onChange={(e) => setDeductionForm({ ...deductionForm, amount: e.target.value })}
                    />
                  </FormField>
                  <FormField label="Not">
                    <input
                      className={formInputClass}
                      value={deductionForm.notes}
                      onChange={(e) => setDeductionForm({ ...deductionForm, notes: e.target.value })}
                    />
                  </FormField>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void handleSaveDeduction()}
                    className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
                  >
                    {saving ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}
                    {editingDeductionId ? 'Güncelle' : 'Ekle'}
                  </button>
                  {editingDeductionId ? (
                    <button
                      type="button"
                      onClick={() => { setEditingDeductionId(null); setDeductionForm(EMPTY_DEDUCTION_FORM); }}
                      className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700"
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
                      <th className="px-4 py-3 font-medium">Kategori</th>
                      <th className="px-4 py-3 font-medium">Açıklama</th>
                      <th className="px-4 py-3 font-medium">Tutar</th>
                      <th className="px-4 py-3 font-medium">Not</th>
                      <th className="px-4 py-3 font-medium">İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deductionLines.length === 0 ? (
                      <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-500">Kesinti satırı yok.</td></tr>
                    ) : null}
                    {deductionLines.map((line) => (
                      <tr key={line.id} className="border-b border-slate-100 last:border-0">
                        <td className="px-4 py-3">{DEDUCTION_CATEGORY_LABELS[line.category] ?? line.category}</td>
                        <td className="px-4 py-3 font-medium">{line.description}</td>
                        <td className="px-4 py-3">{formatMoney(line.amount)}</td>
                        <td className="px-4 py-3 text-slate-600">{line.notes ?? '-'}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <button
                              type="button"
                              className="rounded border border-slate-300 px-2 py-0.5 text-xs"
                              onClick={() => {
                                setEditingDeductionId(line.id);
                                setDeductionForm({
                                  category: String(line.category),
                                  description: line.description,
                                  amount: String(line.amount),
                                  notes: line.notes ?? '',
                                });
                              }}
                            >
                              Düzenle
                            </button>
                            <button
                              type="button"
                              className="rounded border border-red-200 px-2 py-0.5 text-xs text-red-600"
                              onClick={() => void deleteDeductionLine(line.id).then(async () => {
                                await loadProjectData(projectId);
                                await loadDeductionLinesForPeriod(selectedPeriodId);
                                setMessage('Kesinti satırı silindi.');
                              })}
                            >
                              Sil
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
              Kesinti girmek için önce bir hakediş dönemi seçin veya oluşturun.
            </p>
          )}
        </div>
      ) : null}

      {tab === 'progress' ? (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <label className="block text-sm font-medium text-slate-700">
              Hakediş Dönemi
              <select
                className="mt-1 w-full max-w-md rounded-lg border border-slate-300 px-3 py-2"
                value={selectedPeriodId}
                onChange={(e) => setSelectedPeriodId(e.target.value)}
              >
                <option value="">Dönem seçin</option>
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>{p.periodNumber}. {p.name}</option>
                ))}
              </select>
            </label>

            {selectedPeriod ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg bg-slate-50 px-4 py-3">
                  <p className="text-xs text-slate-500">Toplam</p>
                  <p className="text-lg font-semibold">{formatMoney(selectedPeriod.totalAmount)}</p>
                </div>
                <div className="rounded-lg bg-slate-50 px-4 py-3">
                  <p className="text-xs text-slate-500">Kesinti</p>
                  <p className="text-lg font-semibold">{formatMoney(selectedPeriod.deductionAmount)}</p>
                </div>
                <div className="rounded-lg bg-emerald-50 px-4 py-3">
                  <p className="text-xs text-emerald-600">Net Hakediş</p>
                  <p className="text-lg font-semibold text-emerald-800">{formatMoney(selectedPeriod.netAmount)}</p>
                </div>
              </div>
            ) : null}
          </div>

          {selectedPeriodId ? (
            <>
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-semibold text-slate-900">İlerleme Satırı</h3>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void importFromMetraj()}
                    className="inline-flex items-center gap-1 rounded-lg border border-brand-300 bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100 disabled:opacity-60"
                  >
                    {saving ? <Loader2 className="animate-spin" size={14} /> : <Download size={14} />}
                    Metrajdan Aktar
                  </button>
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <FormField label="Sözleşme kalemi" required>
                    <select
                      className={formInputClass}
                      value={progressForm.contractItemId}
                      onChange={(e) => setProgressForm({ ...progressForm, contractItemId: e.target.value })}
                    >
                      <option value="">Seçin</option>
                      {contractItems.map((c) => (
                        <option key={c.id} value={c.id}>{METRAJ_KALEM_LABELS[c.kalemType]} — {c.description}</option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="Bu dönem miktarı" required>
                    <input
                      type="number"
                      min="0"
                      step="0.001"
                      className={formInputClass}
                      placeholder="0"
                      value={progressForm.quantityThisPeriod}
                      onChange={(e) => setProgressForm({ ...progressForm, quantityThisPeriod: e.target.value })}
                    />
                  </FormField>
                  <FormField label="Not" hint="Opsiyonel">
                    <input
                      className={formInputClass}
                      placeholder="Açıklama"
                      value={progressForm.notes}
                      onChange={(e) => setProgressForm({ ...progressForm, notes: e.target.value })}
                    />
                  </FormField>
                </div>
                <button type="button" disabled={saving} onClick={() => void handleSaveProgress()} className="mt-4 inline-flex items-center gap-1 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
                  {saving ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}
                  {editingProgressId ? 'Güncelle' : 'Ekle'}
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-4 py-3 font-medium">Kalem</th>
                      <th className="px-4 py-3 font-medium">Bu Dönem</th>
                      <th className="px-4 py-3 font-medium">Kümülatif</th>
                      <th className="px-4 py-3 font-medium">Tutar</th>
                      <th className="px-4 py-3 font-medium">Kaynak</th>
                      <th className="px-4 py-3 font-medium">İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-500">Yükleniyor...</td></tr> : null}
                    {!loading && progressEntries.length === 0 ? (
                      <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-500">İlerleme satırı yok.</td></tr>
                    ) : null}
                    {progressEntries.map((e) => (
                      <tr key={e.id} className="border-b border-slate-100 last:border-0">
                        <td className="px-4 py-3 font-medium">{contractItemLabel(e.contractItemId)}</td>
                        <td className="px-4 py-3">{e.quantityThisPeriod}</td>
                        <td className="px-4 py-3">{e.cumulativeQuantity}</td>
                        <td className="px-4 py-3">{formatMoney(e.amountThisPeriod)}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-xs ${e.isManualEntry ? 'bg-slate-100 text-slate-600' : 'bg-violet-100 text-violet-700'}`}>
                            {e.isManualEntry ? 'Manuel' : 'Metraj'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <button type="button" className="rounded border border-slate-300 px-2 py-0.5 text-xs" onClick={() => { setEditingProgressId(e.id); setProgressForm({ contractItemId: e.contractItemId, quantityThisPeriod: String(e.quantityThisPeriod), notes: e.notes ?? '' }); }}>Düzenle</button>
                            <button type="button" className="rounded border border-red-200 px-2 py-0.5 text-xs text-red-600" onClick={() => void deleteProgressEntry(e.id).then(async () => { await recalcPeriodTotals(selectedPeriodId); await loadProjectData(projectId); await loadProgressForPeriod(selectedPeriodId); })}>Sil</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
              İlerleme girişi için önce bir hakediş dönemi seçin veya oluşturun.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
