import { STOCK_MOVEMENT_LABELS, type StockTransaction } from './types';

export function StockMovementHistory({ transactions }: { transactions: StockTransaction[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-600"><tr><th className="p-3">Tarih</th><th className="p-3">Tür</th><th className="p-3">Malzeme</th><th className="p-3">Kaynak / hedef</th><th className="p-3">Miktar</th><th className="p-3">Maliyet</th><th className="p-3">Referans</th></tr></thead>
        <tbody>
          {!transactions.length ? <tr><td colSpan={7} className="p-8 text-center text-slate-500">Stok hareketi yok.</td></tr> : null}
          {transactions.map((transaction) => (
            <tr key={transaction.id} className="border-t border-slate-100">
              <td className="whitespace-nowrap p-3">{new Date(transaction.occurredAt).toLocaleString('tr-TR')}</td>
              <td className="p-3">{STOCK_MOVEMENT_LABELS[transaction.movementType] ?? transaction.movementType}</td>
              <td className="p-3 font-medium">{transaction.materialName}</td>
              <td className="p-3">{transaction.fromSiteName ?? 'Dış kaynak'} → {transaction.toSiteName ?? 'Tüketim'}</td>
              <td className="p-3">{transaction.quantity}</td>
              <td className="p-3">{transaction.totalCost == null ? '-' : transaction.totalCost.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</td>
              <td className="p-3">{transaction.reference ?? '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
