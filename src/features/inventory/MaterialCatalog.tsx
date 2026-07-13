import { useState } from 'react';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { FormField, formInputClass } from '@/components/FormField';
import type { Material } from './types';

const emptyForm = { code: '', name: '', unit: '', description: '', isActive: true };

export function MaterialCatalog({
  materials,
  saving,
  canManage,
  onSave,
  onDelete,
}: {
  materials: Material[];
  saving: boolean;
  canManage: boolean;
  onSave: (values: typeof emptyForm & { id?: string }) => Promise<boolean>;
  onDelete: (id: string) => void;
}) {
  const [form, setForm] = useState<typeof emptyForm & { id?: string }>(emptyForm);
  async function save() {
    if (await onSave(form)) setForm(emptyForm);
  }
  return (
    <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
      {canManage ? (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-semibold">{form.id ? 'Malzemeyi düzenle' : 'Yeni malzeme'}</h3>
          <div className="mt-4 space-y-3">
            <FormField label="Kod" required><input className={formInputClass} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></FormField>
            <FormField label="Ad" required><input className={formInputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></FormField>
            <FormField label="Birim" required hint="kg, adet, m³..."><input className={formInputClass} value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></FormField>
            <FormField label="Açıklama"><textarea className={formInputClass} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></FormField>
            <label className="flex gap-2 text-sm"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Aktif</label>
            <div className="flex gap-2">
              <button disabled={saving} onClick={() => void save()} className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">
                {saving ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />} Kaydet
              </button>
              {form.id ? <button onClick={() => setForm(emptyForm)} className="rounded-lg border px-3 py-2 text-sm">İptal</button> : null}
            </div>
          </div>
        </section>
      ) : null}
      <section className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600"><tr><th className="p-3">Kod</th><th className="p-3">Malzeme</th><th className="p-3">Birim</th><th className="p-3">Durum</th>{canManage ? <th className="p-3">İşlem</th> : null}</tr></thead>
          <tbody>
            {!materials.length ? <tr><td colSpan={5} className="p-8 text-center text-slate-500">Malzeme tanımı yok.</td></tr> : null}
            {materials.map((material) => (
              <tr key={material.id} className="border-t border-slate-100">
                <td className="p-3 font-mono text-xs">{material.code}</td><td className="p-3 font-medium">{material.name}</td><td className="p-3">{material.unit}</td><td className="p-3">{material.isActive ? 'Aktif' : 'Pasif'}</td>
                {canManage ? <td className="p-3"><div className="flex gap-1">
                  <button title="Düzenle" onClick={() => setForm({ id: material.id, code: material.code, name: material.name, unit: material.unit, description: material.description ?? '', isActive: material.isActive })} className="rounded border p-1"><Pencil size={14} /></button>
                  <button title="Sil" onClick={() => onDelete(material.id)} className="rounded border border-red-200 p-1 text-red-600"><Trash2 size={14} /></button>
                </div></td> : null}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
