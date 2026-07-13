import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { FormField, formInputClass } from '@/components/FormField';
import type { Material, StockMovementPayload } from './types';
import type { Site } from '@/types';

type Action = 'receipt' | 'consumption' | 'transfer' | 'adjustment';
const labels: Record<Action, string> = { receipt: 'Mal kabul', consumption: 'Tüketim', transfer: 'Transfer', adjustment: 'Sayım düzeltmesi' };

export function StockMovementForm({
  tenantId,
  projectId,
  materials,
  sites,
  saving,
  onPost,
}: {
  tenantId: string;
  projectId: string;
  materials: Material[];
  sites: Site[];
  saving: boolean;
  onPost: (action: Action, payload: StockMovementPayload) => Promise<boolean>;
}) {
  const [action, setAction] = useState<Action>('receipt');
  const [form, setForm] = useState({ materialId: '', siteId: '', toSiteId: '', quantity: '', unitCost: '', reference: '', notes: '', occurredAt: new Date().toISOString().slice(0, 16) });
  async function submit() {
    const quantity = Number(form.quantity);
    const unitCost = Number(form.unitCost);
    const needsUnitCost = action === 'receipt' || (action === 'adjustment' && quantity > 0);
    if (
      !form.materialId ||
      !form.siteId ||
      !Number.isFinite(quantity) ||
      quantity === 0 ||
      (action !== 'adjustment' && quantity < 0) ||
      (action === 'transfer' && !form.toSiteId) ||
      (needsUnitCost && (form.unitCost === '' || !Number.isFinite(unitCost) || unitCost < 0))
    ) return;
    const ok = await onPost(action, {
      tenantId, projectId, materialId: form.materialId,
      siteId: action === 'receipt' || action === 'consumption' || action === 'adjustment' ? form.siteId : undefined,
      fromSiteId: action === 'transfer' ? form.siteId : undefined,
      toSiteId: action === 'transfer' ? form.toSiteId : undefined,
      quantity: Math.abs(quantity),
      adjustmentQuantity: action === 'adjustment' ? quantity : undefined,
      unitCost: needsUnitCost ? unitCost : undefined,
      occurredAt: new Date(form.occurredAt).toISOString(),
      reference: form.reference.trim() || null, notes: form.notes.trim() || null,
      idempotencyKey: crypto.randomUUID(),
    });
    if (ok) setForm((current) => ({ ...current, quantity: '', unitCost: '', reference: '', notes: '' }));
  }
  return (
    <section className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="flex flex-wrap gap-2">{(Object.keys(labels) as Action[]).map((item) => <button key={item} onClick={() => setAction(item)} className={`rounded-lg px-3 py-2 text-sm font-medium ${action === item ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700'}`}>{labels[item]}</button>)}</div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FormField label="Malzeme" required><select className={formInputClass} value={form.materialId} onChange={(e) => setForm({ ...form, materialId: e.target.value })}><option value="">Seçin</option>{materials.filter((x) => x.isActive).map((x) => <option key={x.id} value={x.id}>{x.code} · {x.name}</option>)}</select></FormField>
        <FormField label={action === 'transfer' ? 'Kaynak şantiye' : 'Şantiye'} required><select className={formInputClass} value={form.siteId} onChange={(e) => setForm({ ...form, siteId: e.target.value })}><option value="">Seçin</option>{sites.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></FormField>
        {action === 'transfer' ? <FormField label="Hedef şantiye" required><select className={formInputClass} value={form.toSiteId} onChange={(e) => setForm({ ...form, toSiteId: e.target.value })}><option value="">Seçin</option>{sites.filter((x) => x.id !== form.siteId).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></FormField> : null}
        <FormField label={action === 'adjustment' ? 'Fark (+/-)' : 'Miktar'} required><input type="number" step="0.001" className={formInputClass} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></FormField>
        {action === 'receipt' || (action === 'adjustment' && Number(form.quantity) > 0) ? <FormField label="Birim maliyet" required><input type="number" min="0" step="0.01" className={formInputClass} value={form.unitCost} onChange={(e) => setForm({ ...form, unitCost: e.target.value })} /></FormField> : null}
        <FormField label="Hareket zamanı"><input type="datetime-local" className={formInputClass} value={form.occurredAt} onChange={(e) => setForm({ ...form, occurredAt: e.target.value })} /></FormField>
        <FormField label="Referans"><input className={formInputClass} value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} /></FormField>
        <FormField label="Not"><input className={formInputClass} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></FormField>
      </div>
      <button disabled={saving || !projectId} onClick={() => void submit()} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? <Loader2 className="animate-spin" size={15} /> : null}{labels[action]} kaydet</button>
    </section>
  );
}
