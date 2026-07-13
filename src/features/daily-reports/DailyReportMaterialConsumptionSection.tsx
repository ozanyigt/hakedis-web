import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { getApiErrorMessage } from '@/api/client';
import { getDailyReportMaterialLines, replaceDailyReportMaterialLines } from '@/api/dailyReportMaterials';
import { getSiteStockBalances } from '@/api/inventory';
import { formInputClass } from '@/components/FormField';
import type { SiteStockBalance } from '@/features/inventory/types';
import type { DailySiteReport } from './types';
import type { DailyReportMaterialLine } from './materialTypes';

export function DailyReportMaterialConsumptionSection({
  report,
  editable,
}: {
  report: DailySiteReport;
  editable: boolean;
}) {
  const [lines, setLines] = useState<DailyReportMaterialLine[]>([]);
  const [balances, setBalances] = useState<SiteStockBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [savedLines, stock] = await Promise.all([
        getDailyReportMaterialLines(report.id),
        getSiteStockBalances(report.tenantId, report.siteId),
      ]);
      setLines(savedLines);
      setBalances(stock.filter((item) => item.quantity > 0));
    } catch (loadError) { setError(getApiErrorMessage(loadError)); }
    finally { setLoading(false); }
  }, [report.id, report.siteId, report.status, report.tenantId]);

  useEffect(() => { void load(); }, [load]);
  const balancesByMaterial = useMemo(() => new Map(balances.map((item) => [item.materialId, item])), [balances]);

  function addLine() {
    const balance = balances.find((item) => !lines.some((line) => line.materialId === item.materialId));
    if (!balance) return;
    setLines([...lines, { materialId: balance.materialId, materialName: balance.materialName, unit: balance.unit, quantity: 1 }]);
  }

  async function save() {
    if (lines.some((line) => !line.materialId || line.quantity <= 0)) { setError('Malzeme ve sıfırdan büyük miktar zorunludur.'); return; }
    setSaving(true); setError(null);
    try {
      const saved = await replaceDailyReportMaterialLines(report.id, lines.map((line) => ({ materialId: line.materialId, quantity: line.quantity, notes: line.notes })));
      setLines(saved);
    } catch (saveError) {
      setError(getApiErrorMessage(saveError));
    } finally { setSaving(false); }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h3 className="font-semibold text-slate-900">Malzeme tüketimi</h3><p className="mt-1 text-xs text-slate-500">Taslak satırlar stoktan hemen düşmez; stok hareketi yalnızca rapor onaylandığında oluşur.</p></div>
        {editable ? <button onClick={addLine} disabled={!balances.length} className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm"><Plus size={15} /> Satır ekle</button> : null}
      </div>
      {error ? <p className="mt-3 flex gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700"><AlertCircle size={17} className="shrink-0" />{error}</p> : null}
      {loading ? <Loader2 className="mx-auto my-8 animate-spin text-brand-600" /> : (
        <div className="mt-4 space-y-3">
          {!lines.length ? <p className="rounded-lg border border-dashed p-5 text-center text-sm text-slate-500">Malzeme tüketim satırı yok.</p> : null}
          {lines.map((line, index) => {
            const balance = balancesByMaterial.get(line.materialId);
            return <div key={line.id ?? index} className="grid items-end gap-3 rounded-lg bg-slate-50 p-3 sm:grid-cols-[2fr_1fr_2fr_auto]">
              <label className="text-xs text-slate-600">Malzeme<select disabled={!editable} className={`${formInputClass} mt-1`} value={line.materialId} onChange={(e) => { const selected = balancesByMaterial.get(e.target.value); setLines(lines.map((item, i) => i === index ? { ...item, materialId: e.target.value, materialName: selected?.materialName ?? '', unit: selected?.unit ?? '' } : item)); }}><option value="">Seçin</option>{balances.map((item) => <option key={item.materialId} value={item.materialId}>{item.materialName} · stok {item.quantity} {item.unit}</option>)}</select></label>
              <label className="text-xs text-slate-600">Miktar ({line.unit})<input disabled={!editable} type="number" min="0.001" step="0.001" className={`${formInputClass} mt-1`} value={line.quantity} onChange={(e) => setLines(lines.map((item, i) => i === index ? { ...item, quantity: Number(e.target.value) } : item))} /></label>
              <label className="text-xs text-slate-600">Not<input disabled={!editable} className={`${formInputClass} mt-1`} value={line.notes ?? ''} onChange={(e) => setLines(lines.map((item, i) => i === index ? { ...item, notes: e.target.value } : item))} /></label>
              {editable ? <button title="Satırı kaldır" onClick={() => setLines(lines.filter((_, i) => i !== index))} className="rounded border border-red-200 p-2 text-red-600"><Trash2 size={15} /></button> : <div className="text-right text-xs text-slate-500">{line.totalCost != null ? `${line.totalCost.toLocaleString('tr-TR')} ₺` : balance ? `Ort. ${balance.averageUnitCost.toLocaleString('tr-TR')} ₺` : '-'}</div>}
            </div>;
          })}
          {editable && lines.length ? <div className="flex justify-end"><button disabled={saving} onClick={() => void save()} className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? <Loader2 className="animate-spin" size={15} /> : <Save size={15} />} Taslak satırları kaydet</button></div> : null}
        </div>
      )}
    </section>
  );
}
