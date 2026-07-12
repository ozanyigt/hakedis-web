import { useCallback, useEffect, useMemo, useState } from 'react';
import { FileUp, Loader2, Trash2 } from 'lucide-react';
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
  METRAJ_JUDGMENT_LABELS,
  METRAJ_KALEM_LABELS,
} from '@/types';

const ACCEPTED_EXTENSIONS = ['.dwg', '.dxf'];

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
  if (decision === 2) return 'bg-amber-50 text-amber-900';
  return 'bg-slate-100 text-slate-700';
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

  const pendingReviewDrawings = useMemo(
    () => drawings.filter((drawing) => drawing.status === 5),
    [drawings],
  );

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
      setError('Yalnızca DWG veya DXF dosyaları yüklenebilir.');
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
      setError('Kurum, proje ve dosya seçimi zorunludur.');
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
      const isDxf = fileName.toLowerCase().endsWith('.dxf');
      const drawing = await uploadDrawing({
        tenantId,
        projectId,
        file: selectedFile,
      });
      setSelectedFile(null);
      await loadProjectData(projectId);

      if (isDxf && drawing.id) {
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
        ? 'Yapay zeka hüküm önerileri üretildi.'
        : response.judgmentNote || 'Yapay zeka yapılandırılmadı; kalemler incelemeye alındı.';
      setMessage(`Brüt metraj hesaplandı. ${aiNote} Onayladıktan sonra hakedişe kilitlenir.`);
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
        'Onaylanan miktarlar hakediş için kilitlenir. Yapay zeka önerisini düzenlediyseniz tablodaki değerler kullanılır.',
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
      setMessage('Metraj onaylandı ve kilitlendi.');
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
          DXF yükleyin → brüt metraj hesaplanır → yapay zeka hüküm önerir → siz onaylayıp kilitleyin.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <label className="block text-sm font-medium text-slate-700">
            Proje
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

          <div
            className="mt-4 flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center hover:border-brand-500 hover:bg-brand-50"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              handleFileChange(event.dataTransfer.files);
            }}
          >
            <FileUp className="text-brand-600" size={28} />
            <p className="mt-3 text-sm font-medium text-slate-800">DWG veya DXF sürükleyip bırakın</p>
            <p className="mt-1 text-xs text-slate-500">veya dosya seçin</p>
            <input
              type="file"
              accept=".dwg,.dxf"
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
            {uploading ? 'Yükleniyor...' : 'Çizimi Yükle'}
          </button>
        </div>

        <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-slate-900">Metraj Akışı</h3>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-600">
            <li>Firma politikasını kaydedin</li>
            <li>Katman eşlemesini yapın</li>
            <li>DXF yükleyip brüt metrajı hesaplatın</li>
            <li>Yapay zeka önerisini kontrol edip onaylayın</li>
          </ol>
          <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
            API key yoksa da hesaplama çalışır; tüm kalemler &quot;İncele&quot; durumuna düşer.
          </p>
        </aside>
      </section>

      <MetrajPolicyPanel />

      {projectId ? <ProjectLayerMappingPanel projectId={projectId} drawings={drawings} /> : null}

      {message ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>
      ) : null}
      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-slate-900">Yüklenen Çizimler</h3>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Dosya</th>
                <th className="px-4 py-3 font-medium">Boyut</th>
                <th className="px-4 py-3 font-medium">Durum</th>
                <th className="px-4 py-3 font-medium">Hata / Not</th>
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
                    Henüz çizim yüklenmedi.
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
                        {calculatingId === drawing.id ? 'Hesaplanıyor...' : 'Metraj Hesapla'}
                      </button>
                      {drawing.status === 5 ? (
                        <button
                          type="button"
                          disabled={approvingId === drawing.id}
                          onClick={() => void handleApprove(drawing.id)}
                          className="rounded-md border border-emerald-300 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-100 disabled:opacity-50"
                        >
                          {approvingId === drawing.id ? 'Onaylanıyor...' : 'Onayla & Kilitle'}
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

      {pendingReviewDrawings.length > 0 ? (
        <p className="rounded-lg bg-sky-50 px-3 py-2 text-sm text-sky-800">
          {pendingReviewDrawings.length} çizim inceleme bekliyor. Tabloda önerilen miktarı düzenleyip
          &quot;Onayla &amp; Kilitle&quot; ile hakedişe alın.
        </p>
      ) : null}

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-slate-900">Metraj Sonuçları</h3>
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
                <th className="px-4 py-3 font-medium">Brüt</th>
                <th className="px-4 py-3 font-medium">Yapay zeka / Onay miktarı</th>
                <th className="px-4 py-3 font-medium">Birim</th>
                <th className="px-4 py-3 font-medium">Hüküm</th>
                <th className="px-4 py-3 font-medium">Durum</th>
                <th className="px-4 py-3 font-medium">Gerekçe</th>
                <th className="px-4 py-3 font-medium">Tarih</th>
              </tr>
            </thead>
            <tbody>
              {results.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-slate-500">
                    Metraj sonucu henüz yok.
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
                        {result.judgmentDecision
                          ? METRAJ_JUDGMENT_LABELS[result.judgmentDecision]
                          : '-'}
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
