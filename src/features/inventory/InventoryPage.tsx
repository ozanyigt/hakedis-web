import { useCallback, useEffect, useState } from 'react';
import { getApiErrorMessage } from '@/api/client';
import { deleteMaterial, getMaterials, getSiteStockBalances, getStockTransactions, postStockMovement, saveMaterial } from '@/api/inventory';
import { getProjectsByTenant } from '@/api/projects';
import { getSitesByProject } from '@/api/sites';
import { hasClaim } from '@/config/permissions';
import { useAuth } from '@/contexts/AuthContext';
import { useDialog } from '@/contexts/DialogContext';
import { useTenant } from '@/contexts/TenantContext';
import type { Project, Site } from '@/types';
import { MaterialCatalog } from './MaterialCatalog';
import { StockBalances } from './StockBalances';
import { StockMovementForm } from './StockMovementForm';
import { StockMovementHistory } from './StockMovementHistory';
import type { Material, SiteStockBalance, StockMovementPayload, StockTransaction } from './types';

type Tab = 'catalog' | 'balances' | 'movements';

export function InventoryPage() {
  const { tenantId } = useTenant();
  const { roles } = useAuth();
  const { confirm } = useDialog();
  const [tab, setTab] = useState<Tab>('balances');
  const [projects, setProjects] = useState<Project[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [projectId, setProjectId] = useState('');
  const [siteId, setSiteId] = useState('');
  const [materials, setMaterials] = useState<Material[]>([]);
  const [balances, setBalances] = useState<SiteStockBalance[]>([]);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const canManageMaterials = hasClaim(roles, 'Inventory.Write');
  const canPost = hasClaim(roles, 'Inventory.Write');

  const refresh = useCallback(async () => {
    if (!tenantId) return;
    try {
      const materialItems = await getMaterials(tenantId);
      setMaterials(materialItems);
      if (projectId) {
        const [balanceItems, transactionItems] = await Promise.all([
          getSiteStockBalances(tenantId, siteId), getStockTransactions(tenantId, siteId),
        ]);
        const projectSiteIds = new Set(sites.map((site) => site.id));
        setBalances(siteId ? balanceItems : balanceItems.filter((item) => projectSiteIds.has(item.siteId)));
        setTransactions(siteId
          ? transactionItems
          : transactionItems.filter((item) =>
              projectSiteIds.has(item.fromSiteId ?? item.toSiteId ?? '')));
      }
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    }
  }, [projectId, siteId, sites, tenantId]);

  useEffect(() => {
    if (!tenantId) return;
    void getProjectsByTenant(tenantId).then((items) => {
      setProjects(items);
      setProjectId((current) => current || items[0]?.id || '');
    }).catch((loadError) => setError(getApiErrorMessage(loadError)));
  }, [tenantId]);

  useEffect(() => {
    if (!projectId) { setSites([]); return; }
    void getSitesByProject(projectId).then((items) => { setSites(items); setSiteId(''); }).catch((loadError) => setError(getApiErrorMessage(loadError)));
  }, [projectId]);

  useEffect(() => { void refresh(); }, [refresh]);

  async function handleSaveMaterial(values: Omit<Material, 'id' | 'tenantId'> & { id?: string }) {
    if (!tenantId || !values.code.trim() || !values.name.trim() || !values.unit.trim()) {
      setError('Kod, ad ve birim zorunludur.'); return false;
    }
    setSaving(true); setError(null);
    try {
      await saveMaterial({ ...values, tenantId, code: values.code.trim(), name: values.name.trim(), unit: values.unit.trim(), description: values.description?.trim() || null });
      setMessage('Malzeme kaydedildi.'); await refresh(); return true;
    } catch (saveError) { setError(getApiErrorMessage(saveError)); return false; }
    finally { setSaving(false); }
  }

  async function handleDeleteMaterial(id: string) {
    if (!tenantId) return;
    if (!await confirm({ title: 'Malzemeyi sil', message: 'Bu malzeme tanımını silmek istediğinize emin misiniz?', variant: 'danger', confirmLabel: 'Sil' })) return;
    try { await deleteMaterial(id, tenantId); setMessage('Malzeme silindi.'); await refresh(); }
    catch (deleteError) { setError(getApiErrorMessage(deleteError)); }
  }

  async function handlePost(action: 'receipt' | 'consumption' | 'transfer' | 'adjustment', payload: StockMovementPayload) {
    setSaving(true); setError(null); setMessage(null);
    try { await postStockMovement(action, payload); setMessage('Stok hareketi işlendi.'); await refresh(); return true; }
    catch (postError) { setError(getApiErrorMessage(postError)); return false; }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-6">
      <header><h2 className="text-2xl font-bold text-slate-900">Malzeme ve Stok</h2><p className="mt-1 text-sm text-slate-600">Malzeme kataloğu, şantiye stokları ve maliyetli stok hareketleri.</p></header>
      <section className="flex flex-wrap gap-4 rounded-xl border bg-white p-4 shadow-sm">
        <label className="text-sm font-medium">Proje<select className="ml-2 rounded-lg border px-3 py-2" value={projectId} onChange={(e) => setProjectId(e.target.value)}><option value="">Seçin</option>{projects.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
        <label className="text-sm font-medium">Şantiye<select className="ml-2 rounded-lg border px-3 py-2" value={siteId} onChange={(e) => setSiteId(e.target.value)}><option value="">Tümü</option>{sites.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
      </section>
      {message ? <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <div className="flex gap-2 border-b">{([['catalog', 'Katalog'], ['balances', 'Stoklar'], ['movements', 'Hareketler']] as const).map(([key, label]) => <button key={key} onClick={() => setTab(key)} className={`px-4 py-2 text-sm font-medium ${tab === key ? 'border-b-2 border-brand-600 text-brand-700' : 'text-slate-600'}`}>{label}</button>)}</div>
      {tab === 'catalog' ? <MaterialCatalog materials={materials} saving={saving} canManage={canManageMaterials} onSave={handleSaveMaterial} onDelete={(id) => void handleDeleteMaterial(id)} /> : null}
      {tab === 'balances' ? <StockBalances balances={balances} /> : null}
      {tab === 'movements' ? <div className="space-y-5">{canPost && tenantId ? <StockMovementForm tenantId={tenantId} projectId={projectId} materials={materials} sites={sites} saving={saving} onPost={handlePost} /> : null}<StockMovementHistory transactions={transactions} /></div> : null}
    </div>
  );
}
