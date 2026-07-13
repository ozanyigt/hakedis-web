import type { SiteStockBalance } from './types';

const money = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' });

export function StockBalances({ balances }: { balances: SiteStockBalance[] }) {
  if (!balances.length) return <p className="rounded-xl border border-dashed bg-white p-8 text-center text-sm text-slate-500">Seçilen kapsamda stok yok.</p>;
  return (
    <>
      <div className="space-y-3 md:hidden">
        {balances.map((balance) => (
          <article key={`${balance.siteId}-${balance.materialId}`} className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="flex justify-between gap-2"><div><h3 className="font-semibold">{balance.materialName}</h3><p className="text-xs text-slate-500">{balance.siteName}</p></div><b>{balance.quantity} {balance.unit}</b></div>
            <div className="mt-3 flex justify-between text-sm text-slate-600"><span>Hareketli ortalama</span><span>{money.format(balance.averageUnitCost)} / {balance.unit}</span></div>
            <div className="mt-1 flex justify-between text-sm"><span>Stok değeri</span><b>{money.format(balance.totalValue)}</b></div>
          </article>
        ))}
      </div>
      <div className="hidden overflow-x-auto rounded-xl border bg-white shadow-sm md:block">
        <table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-slate-600"><tr><th className="p-3">Şantiye</th><th className="p-3">Malzeme</th><th className="p-3">Miktar</th><th className="p-3">Hareketli ortalama</th><th className="p-3">Stok değeri</th></tr></thead>
          <tbody>{balances.map((balance) => <tr key={`${balance.siteId}-${balance.materialId}`} className="border-t"><td className="p-3">{balance.siteName ?? '-'}</td><td className="p-3 font-medium">{balance.materialName}</td><td className="p-3">{balance.quantity} {balance.unit}</td><td className="p-3">{money.format(balance.averageUnitCost)} / {balance.unit}</td><td className="p-3 font-medium">{money.format(balance.totalValue)}</td></tr>)}</tbody>
        </table>
      </div>
    </>
  );
}
