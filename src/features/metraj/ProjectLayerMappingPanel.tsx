import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getDrawingLayers,
  getProjectMetrajLayerMappings,
  saveProjectMetrajLayerMappings,
  type DrawingLayerInfo,
  type ProjectMetrajLayerMapping,
} from '@/api/projectMetrajLayers';
import { getApiErrorMessage } from '@/api/client';
import type { Drawing } from '@/types';
import { METRAJ_KALEM_LABELS } from '@/types';

const KALEM_TYPES = [1, 2, 3, 4, 5, 6] as const;

function createEmptyMappings(): ProjectMetrajLayerMapping[] {
  return KALEM_TYPES.map((kalemType) => ({ kalemType, layerNames: [] }));
}

function mergeMappings(saved: ProjectMetrajLayerMapping[]): ProjectMetrajLayerMapping[] {
  const byType = new Map(saved.map((item) => [item.kalemType, item.layerNames]));
  return KALEM_TYPES.map((kalemType) => ({
    kalemType,
    layerNames: [...(byType.get(kalemType) ?? [])],
  }));
}

interface ProjectLayerMappingPanelProps {
  projectId: string;
  drawings: Drawing[];
}

export function ProjectLayerMappingPanel({ projectId, drawings }: ProjectLayerMappingPanelProps) {
  const dxfDrawings = useMemo(
    () => drawings.filter((drawing) => drawing.fileExtension.toLowerCase() === 'dxf'),
    [drawings],
  );

  const [sourceDrawingId, setSourceDrawingId] = useState('');
  const [layers, setLayers] = useState<DrawingLayerInfo[]>([]);
  const [mappings, setMappings] = useState<ProjectMetrajLayerMapping[]>(createEmptyMappings);
  const [loadingMappings, setLoadingMappings] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSourceDrawingId(dxfDrawings[0]?.id ?? '');
  }, [dxfDrawings]);

  const loadMappings = useCallback(async () => {
    if (!projectId) {
      setMappings(createEmptyMappings());
      return;
    }

    setLoadingMappings(true);
    setError(null);
    try {
      const saved = await getProjectMetrajLayerMappings(projectId);
      setMappings(mergeMappings(saved));
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
      setMappings(createEmptyMappings());
    } finally {
      setLoadingMappings(false);
    }
  }, [projectId]);

  useEffect(() => {
    void loadMappings();
  }, [loadMappings]);

  async function handleScanLayers() {
    if (!sourceDrawingId) {
      setError('Katman taraması için bir DXF çizimi seçin.');
      return;
    }

    setScanning(true);
    setError(null);
    setMessage(null);
    try {
      const discovered = await getDrawingLayers(sourceDrawingId);
      setLayers(discovered);
      setMessage(
        discovered.length > 0
          ? `${discovered.length} katman bulundu. Kalemler için katman seçip kaydedin.`
          : 'Çizimde geometri içeren katman bulunamadı.',
      );
    } catch (scanError) {
      setError(getApiErrorMessage(scanError));
      setLayers([]);
    } finally {
      setScanning(false);
    }
  }

  function toggleLayer(kalemType: number, layerName: string) {
    setMappings((prev) =>
      prev.map((mapping) => {
        if (mapping.kalemType !== kalemType) {
          return mapping;
        }

        const exists = mapping.layerNames.includes(layerName);
        return {
          ...mapping,
          layerNames: exists
            ? mapping.layerNames.filter((name) => name !== layerName)
            : [...mapping.layerNames, layerName],
        };
      }),
    );
  }

  async function handleSave() {
    if (!projectId) {
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await saveProjectMetrajLayerMappings(projectId, mappings);
      setMessage('Proje katman eşlemesi kaydedildi. Metraj hesabı bu kuralları kullanır.');
      await loadMappings();
    } catch (saveError) {
      setError(getApiErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">Proje Katman Eşlemesi</h3>
        <p className="mt-1 text-sm text-slate-600">
          DXF içindeki katman adlarını metraj kalemlerine bağlayın. Örn. Şap Beton →{' '}
          <code className="rounded bg-slate-100 px-1">_Döşeme</code>
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
        <label className="block text-sm">
          <span className="font-medium text-slate-700">Katmanları taranacak DXF</span>
          <select
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={sourceDrawingId}
            onChange={(event) => setSourceDrawingId(event.target.value)}
            disabled={dxfDrawings.length === 0}
          >
            <option value="">DXF seçin</option>
            {dxfDrawings.map((drawing) => (
              <option key={drawing.id} value={drawing.id}>
                {drawing.fileName}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => void handleScanLayers()}
          disabled={scanning || !sourceDrawingId}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          {scanning ? 'Taranıyor...' : 'Katmanları Tara'}
        </button>
      </div>

      {dxfDrawings.length === 0 ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Katman eşlemesi için önce projeye bir DXF dosyası yükleyin.
        </p>
      ) : null}

      {loadingMappings ? <p className="text-sm text-slate-500">Kayıtlı eşlemeler yükleniyor…</p> : null}

      {layers.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-2 font-medium">Katman</th>
                <th className="px-3 py-2 font-medium">Geometri</th>
                {KALEM_TYPES.map((kalemType) => (
                  <th key={kalemType} className="px-3 py-2 font-medium">
                    {METRAJ_KALEM_LABELS[kalemType]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {layers.map((layer) => (
                <tr key={layer.name} className="border-b border-slate-100 last:border-0">
                  <td className="px-3 py-2 font-medium text-slate-900">{layer.name}</td>
                  <td className="px-3 py-2 text-xs text-slate-500">
                    {layer.entityCount} parça
                    {layer.hasClosedArea ? ' · alan' : ''}
                    {layer.hasLines ? ' · çizgi' : ''}
                  </td>
                  {KALEM_TYPES.map((kalemType) => {
                    const checked = mappings
                      .find((mapping) => mapping.kalemType === kalemType)
                      ?.layerNames.includes(layer.name);
                    return (
                      <td key={kalemType} className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={Boolean(checked)}
                          onChange={() => toggleLayer(kalemType, layer.name)}
                          aria-label={`${layer.name} → ${METRAJ_KALEM_LABELS[kalemType]}`}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {mappings.some((mapping) => mapping.layerNames.length > 0) ? (
        <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
          {mappings
            .filter((mapping) => mapping.layerNames.length > 0)
            .map(
              (mapping) =>
                `${METRAJ_KALEM_LABELS[mapping.kalemType]}: ${mapping.layerNames.join(', ')}`,
            )
            .join(' | ')}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving || !projectId}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {saving ? 'Kaydediliyor...' : 'Eşlemeyi Kaydet'}
        </button>
      </div>

      {message ? <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
    </section>
  );
}
