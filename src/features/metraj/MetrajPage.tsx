import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, FileUp, Loader2, Trash2 } from 'lucide-react';
import { deleteDrawing, getDrawingsByProject, uploadDrawing } from '@/api/drawings';
import { exportMetrajExcel } from '@/api/exports';
import { approveMetrajResults, calculateMetraj, getMetrajResultsByProject } from '@/api/metraj';
import { getProjectsByTenant } from '@/api/projects';
import { getApiErrorMessage } from '@/api/client';
import { ExportExcelButton } from '@/components/ExportExcelButton';
import { useDialog } from '@/contexts/DialogContext';
import { useTenant } from '@/contexts/TenantContext';
import { MetrajPolicyPanel } from '@/features/metraj/MetrajPolicyPanel';
import { ProjectLayerMappingPanel } from '@/features/metraj/ProjectLayerMappingPanel';
import type { Drawing, MetrajResult, Project } from '@/types';
import {
  DRAWING_STATUS_LABELS,
  MEASUREMENT_UNIT_LABELS,
  METRAJ_APPROVAL_STATUS_LABELS,
  METRAJ_KALEM_LABELS,
} from '@/types';

const ACCEPTED_EXTENSIONS = ['.dxf'];

const STEPS = [
  { id: 1, label: 'Proje seç' },
  { id: 2, label: 'DXF yükle' },
  { id: 3, label: 'Hesapla' },
  { id: 4, label: 'Kontrol et & onayla' },
] as const;

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function judgmentTone(decision?: number | null): string {
  if (decision === 1) return 'bg-emerald-50 text-emerald-800';
  if (decision === 2) return 'bg-slate-100 text-slate-600';
  if (decision === 3) return 'bg-amber-50 text-amber-900';
  return 'bg-slate-100 text-slate-700';
}

function judgmentPlainLabel(decision?: number | null): string {
  if (decision === 1) return 'Sayılacak';
  if (decision === 2) return 'Sayılmasın';
  if (decision === 3) return 'İncele';
  return '-';
}

export function MetrajPage() {
  const { tenantId } = useTenant();
  const { confirm } = useDialog();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState('');
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [results, setResults] = useState<MetrajResult[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [calculatingId, setCalculatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [quantityEdits, setQuantityEdits] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const pendingReviewDrawings = useMemo(
    () => drawings.filter((drawing) => drawing.status === 5),
    [drawings],
  );

  const unlockedResults = useMemo(
    () => results.filter((result) => !result.isLocked && result.approvalStatus !== 3),
    [results],
  );

  const judgmentSummary = useMemo(() => {
    const count = { count: 0, review: 0, ignore: 0, other: 0 };
    const source = unlockedResults.length > 0 ? unlockedResults : results;
    for (const result of source) {
      if (result.judgmentDecision === 1) count.count += 1;
      else if (result.judgmentDecision === 2) count.ignore += 1;
      else if (result.judgmentDecision === 3) count.review += 1;
      else count.other += 1;
    }
    return count;
  }, [results, unlockedResults]);

  const activeStep = useMemo(() => {
    if (!projectId) return 1;
    if (drawings.length === 0) return 2;
    if (results.length === 0) return 3;
    if (pendingReviewDrawings.length > 0 || unlockedResults.length > 0) return 4;
    return 4;
  }, [projectId, drawings.length, results.length, pendingReviewDrawings.length, unlockedResults.length]);

  const loadProjectData = useCallback(async (activeProjectId: string) => {
    const guidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!activeProjectId || !guidPattern.test(activeProjectId)) {
      setDrawings([]);
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [drawingItems, resultItems] = await Promise.all([
        getDrawingsByProject(activeProjectId),
        getMetrajResultsByProject(activeProjectId),
      ]);
      setDrawings(drawingItems);
      setResults(resultItems);
      const edits: Record<string, string> = {};
      for (const item of resultItems) {
        const suggested = item.suggestedQuantity ?? item.grossQuantity ?? item.quantity;
        edits[item.id] = String(suggested);
      }
      setQuantityEdits(edits);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    } finally {
      setLoading(false);
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

  function handleFileChange(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) {
      setSelectedFile(null);
      return;
    }

    const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(extension)) {
      setError(
        'Yalnızca DXF yüklenebilir. DWG dosyanızı AutoCAD, DWG TrueView veya LibreCAD ile “AutoCAD 2000 DXF” olarak kaydedin.',
      );
      setSelectedFile(null);
      return;
    }

    const maxUploadBytes = 300 * 1024 * 1024;
    if (file.size > maxUploadBytes) {
      setError('Dosya boyutu 300 MB sınırını aşıyor.');
      setSelectedFile(null);
      return;
    }

    setError(null);
    setSelectedFile(file);
  }

  async function handleUpload() {
    if (!tenantId || !projectId || !selectedFile) {
      setError('Kurum, proje ve DXF dosyası seçimi zorunludur.');
      return;
    }

    const guidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!guidPattern.test(projectId)) {
      setError('Geçersiz proje seçimi. Sayfayı yenileyip projeyi tekrar seçin.');
      return;
    }

    setUploading(true);
    setError(null);
    setMessage(null);

    try {
      const fileName = selectedFile.name;
      const drawing = await uploadDrawing({
        tenantId,
        projectId,
        file: selectedFile,
      });
      setSelectedFile(null);
      await loadProjectData(projectId);

      if (drawing.id) {
        setMessage(`${fileName} yüklendi, metraj hesaplanıyor...`);
        await handleCalculate(drawing.id);
      } else {
        setMessage(`${fileName} başarıyla yüklendi.`);
      }
    } catch (uploadError) {
      setError(getApiErrorMessage(uploadError));
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(drawing: Drawing) {
    const confirmed = await confirm({
      title: 'Çizimi sil',
      message: `"${drawing.fileName}" çizimini silmek istediğinize emin misiniz? İlişkili metraj sonuçları da kaldırılır.`,
      variant: 'danger',
      confirmLabel: 'Sil',
    });
    if (!confirmed) return;

    setDeletingId(drawing.id);
    setError(null);
    setMessage(null);
    try {
      await deleteDrawing(drawing.id);
      setMessage(`"${drawing.fileName}" silindi.`);
      await loadProjectData(projectId);
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError));
    } finally {
      setDeletingId(null);
    }
  }

  async function handleCalculate(drawingId: string) {
    setCalculatingId(drawingId);
    setError(null);
    setMessage(null);
    try {
      const response = await calculateMetraj(drawingId);
      const aiNote = response.usedAi
        ? 'Sistem şüpheli kalemleri işaretledi; miktar uydurmaz — siz onaylarsınız.'
        : response.judgmentNote ||
          'Yapay zeka yapılandırılmadı; tüm kalemler incelemeye alındı. Miktarları kontrol edip onaylayın.';
      setMessage(`Metraj hesaplandı. ${aiNote}`);
      await loadProjectData(projectId);
    } catch (calcError) {
      setError(getApiErrorMessage(calcError));
    } finally {
      setCalculatingId(null);
    }
  }

  async function handleApprove(drawingId: string) {
    const drawingResults = results.filter((result) => result.drawingId === drawingId && !result.isLocked);
    if (drawingResults.length === 0) {
      setError('Onaylanacak metraj kalemi yok.');
      return;
    }

    const confirmed = await confirm({
      title: 'Metrajı onayla ve kilitle',
      message:
        'Onaylanan miktarlar kilitlenir ve hakedişe aktarılabilir hale gelir. Tablodaki değerler kullanılır.',
      confirmLabel: 'Onayla',
    });
    if (!confirmed) return;

    setApprovingId(drawingId);
    setError(null);
    setMessage(null);
    try {
      await approveMetrajResults(
        drawingId,
        drawingResults.map((result) => {
          const edited = Number(quantityEdits[result.id] ?? result.suggestedQuantity ?? result.grossQuantity ?? 0);
          return {
            id: result.id,
            approvedQuantity: Number.isFinite(edited) ? edited : result.suggestedQuantity ?? result.grossQuantity,
            reject: false,
          };
        }),
      );
      setMessage('Metraj onaylandı ve kilitlendi. Artık hakedişe aktarabilirsiniz.');
      await loadProjectData(projectId);
    } catch (approveError) {
      setError(getApiErrorMessage(approveError));
    } finally {
      setApprovingId(null);
    }
  }

  async function handleExportExcel() {
    if (!tenantId || !projectId) return;
    const guidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!guidPattern.test(projectId)) return;

    setExporting(true);
    setError(null);
    try {
      await exportMetrajExcel(tenantId, projectId);
      setMessage('Metraj sonuçları Excel olarak indirildi.');
    } catch (exportError) {
      setError(getApiErrorMessage(exportError));
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-2xl font-bold text-slate-900">Metraj</h2>
        <p className="mt-1 text-sm text-slate-600">
          DXF yükleyin, miktarı kontrol edin, onaylayın. Nihai karar sizde kalır.
        </p>
      </section>

      <nav aria-label="Metraj adımları" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <ol className="grid gap-3 sm:grid-cols-4">
          {STEPS.map((step) => {
            const isActive = activeStep === step.id;
            const isDone = activeStep > step.id;
            return (
              <li
                key={step.id}
                className={[
                  'rounded-lg border px-3 py-2 text-sm',
                  isActive
                    ? 'border-brand-500 bg-brand-50 text-brand-900'
                    : isDone
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                      : 'border-slate-200 bg-slate-50 text-slate-500',
                ].join(' ')}
              >
                <span className="block text-xs font-semibold uppercase tracking-wide opacity-70">
                  Adım {step.id}
                </span>
                <span className="font-medium">{step.label}</span>
              </li>
            );
          })}
        </ol>
      </nav>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <label className="block text-sm font-medium text-slate-700">
          1. Proje
          <select
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={projectId}
            onChange={(event) => setProjectId(event.target.value)}
          >
            <option value="">Proje seçin</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </label>

        <div className="mt-5">
          <p className="text-sm font-medium text-slate-700">2. DXF dosyası yükle</p>
          <p className="mt-1 text-xs text-slate-500">
            Şu an yalnızca DXF desteklenir. DWG ise AutoCAD / TrueView / LibreCAD ile &quot;AutoCAD 2000
            DXF&quot; kaydedin.
          </p>
          <div
            className="mt-3 flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center hover:border-brand-500 hover:bg-brand-50"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              handleFileChange(event.dataTransfer.files);
            }}
          >
            <FileUp className="text-brand-600" size={28} />
            <p className="mt-3 text-sm font-medium text-slate-800">DXF sürükleyip bırakın</p>
            <p className="mt-1 text-xs text-slate-500">veya dosya seçin · maks. 300 MB</p>
            <input
              type="file"
              accept=".dxf,application/dxf,image/vnd.dxf"
              className="mt-4 text-sm"
              onChange={(event) => handleFileChange(event.target.files)}
            />
          </div>

          {selectedFile ? (
            <p className="mt-3 text-sm text-slate-700">
              Seçili dosya: <strong>{selectedFile.name}</strong> ({formatBytes(selectedFile.size)})
            </p>
          ) : null}

          <button
            type="button"
            disabled={uploading || !selectedFile || !projectId}
            onClick={() => void handleUpload()}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {uploading ? <Loader2 className="animate-spin" size={16} /> : null}
            {uploading ? 'Yükleniyor ve hesaplanıyor...' : 'Yükle ve hesapla'}
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <button
          type="button"
          className="flex w-full items-center justify-between px-5 py-4 text-left"
          onClick={() => setShowAdvanced((open) => !open)}
          aria-expanded={showAdvanced}
        >
          <div>
            <h3 className="font-semibold text-slate-900">Gelişmiş ayarlar</h3>
            <p className="text-xs text-slate-500">
              Firma kuralları ve katman eşlemesi — ilk kullanımda gerekmez.
            </p>
          </div>
          {showAdvanced ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </button>
        {showAdvanced ? (
          <div className="space-y-4 border-t border-slate-100 px-5 pb-5">
            <MetrajPolicyPanel />
            {projectId ? <ProjectLayerMappingPanel projectId={projectId} drawings={drawings} /> : null}
          </div>
        ) : null}
      </section>

      {message ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>
      ) : null}
      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-slate-900">3. Çizimler</h3>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Dosya</th>
                <th className="px-4 py-3 font-medium">Boyut</th>
                <th className="px-4 py-3 font-medium">Durum</th>
                <th className="px-4 py-3 font-medium">Not</th>
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
              {!loading && drawings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                    Henüz DXF yüklenmedi. Yukarıdan dosya seçip &quot;Yükle ve hesapla&quot;ya basın.
                  </td>
                </tr>
              ) : null}
              {drawings.map((drawing) => (
                <tr key={drawing.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-slate-900">{drawing.fileName}</td>
                  <td className="px-4 py-3 text-slate-600">{formatBytes(drawing.fileSizeBytes)}</td>
                  <td className="px-4 py-3">
                    {DRAWING_STATUS_LABELS[drawing.status] ?? drawing.status}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{drawing.parseErrorMessage ?? '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      <button
                        type="button"
                        disabled={calculatingId === drawing.id || deletingId === drawing.id}
                        onClick={() => void handleCalculate(drawing.id)}
                        className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                      >
                        {calculatingId === drawing.id ? 'Hesaplanıyor...' : 'Yeniden hesapla'}
                      </button>
                      {drawing.status === 5 ? (
                        <button
                          type="button"
                          disabled={approvingId === drawing.id}
                          onClick={() => void handleApprove(drawing.id)}
                          className="rounded-md border border-emerald-300 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-100 disabled:opacity-50"
                        >
                          {approvingId === drawing.id ? 'Onaylanıyor...' : 'Onayla ve kilitle'}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        disabled={deletingId === drawing.id || calculatingId === drawing.id}
                        onClick={() => void handleDelete(drawing)}
                        className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        {deletingId === drawing.id ? (
                          <Loader2 className="animate-spin" size={12} />
                        ) : (
                          <Trash2 size={12} />
                        )}
                        Sil
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {results.length > 0 ? (
        <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
          <p className="font-semibold">4. Kontrol özeti</p>
          <p className="mt-1">
            {judgmentSummary.count} kalem sayılacak · {judgmentSummary.review} kalem inceleme ·{' '}
            {judgmentSummary.ignore} kalem sayılmasın
            {pendingReviewDrawings.length > 0
              ? ` · ${pendingReviewDrawings.length} çizim onay bekliyor`
              : ''}
          </p>
          <p className="mt-1 text-xs text-sky-800">
            Miktarları düzenleyebilirsiniz. Onaylamadan hakedişe aktarılmaz.
          </p>
        </div>
      ) : null}

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-slate-900">Metraj sonuçları</h3>
          <ExportExcelButton
            disabled={!projectId || results.length === 0}
            loading={exporting}
            onClick={() => void handleExportExcel()}
          />
        </div>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Kalem</th>
                <th className="px-4 py-3 font-medium">Hesaplanan</th>
                <th className="px-4 py-3 font-medium">Onay miktarı</th>
                <th className="px-4 py-3 font-medium">Birim</th>
                <th className="px-4 py-3 font-medium">Öneri</th>
                <th className="px-4 py-3 font-medium">Durum</th>
                <th className="px-4 py-3 font-medium">Açıklama</th>
                <th className="px-4 py-3 font-medium">Tarih</th>
              </tr>
            </thead>
            <tbody>
              {results.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-slate-500">
                    Henüz sonuç yok. DXF yükleyip hesaplatın.
                  </td>
                </tr>
              ) : null}
              {results.map((result) => {
                const locked = Boolean(result.isLocked) || result.approvalStatus === 3;
                return (
                  <tr key={result.id} className="border-b border-slate-100 last:border-0 align-top">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {METRAJ_KALEM_LABELS[result.kalemType] ?? result.kalemType}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {result.grossQuantity ?? result.quantity}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {locked ? (
                        result.quantity
                      ) : (
                        <input
                          className="w-28 rounded-md border border-slate-300 px-2 py-1"
                          value={quantityEdits[result.id] ?? ''}
                          onChange={(event) =>
                            setQuantityEdits((prev) => ({ ...prev, [result.id]: event.target.value }))
                          }
                        />
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {MEASUREMENT_UNIT_LABELS[result.unit] ?? result.unit}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${judgmentTone(result.judgmentDecision)}`}
                      >
                        {judgmentPlainLabel(result.judgmentDecision)}
                        {result.policyRef ? ` · ${result.policyRef}` : ''}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {result.approvalStatus
                        ? METRAJ_APPROVAL_STATUS_LABELS[result.approvalStatus]
                        : '-'}
                      {locked ? ' (kilitli)' : ''}
                    </td>
                    <td className="max-w-xs px-4 py-3 text-xs text-slate-600">
                      {result.judgmentReason ?? result.notes ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {new Date(result.calculatedAt).toLocaleString('tr-TR')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
