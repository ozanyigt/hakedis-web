import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDemoRequests, updateDemoRequestStatus, type DemoRequestItem } from '@/api/demoRequests';
import { getApiErrorMessage } from '@/api/client';
import {
  DEMO_INTEREST_LABELS,
  DEMO_REQUEST_STATUS_LABELS,
} from '@/config/platformLabels';

export function PlatformDemoRequestsPage() {
  const [items, setItems] = useState<DemoRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const response = await getDemoRequests(0, 100);
      setItems(response.items ?? []);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleStatusChange(id: string, status: number) {
    setUpdatingId(id);
    setError(null);
    try {
      await updateDemoRequestStatus(id, status);
      await load();
    } catch (updateError) {
      setError(getApiErrorMessage(updateError));
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Demo Talepleri</h2>
          <p className="mt-1 text-sm text-slate-600">
            Landing sayfasından gelen lead kayıtları
          </p>
        </div>
        <Link
          to="/platform/tenants/new"
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400"
        >
          Yeni firma aç
        </Link>
      </div>

      {loading ? <p className="text-slate-600">Yükleniyor...</p> : null}
      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">Tarih</th>
              <th className="px-4 py-3 font-medium">Firma</th>
              <th className="px-4 py-3 font-medium">İletişim</th>
              <th className="px-4 py-3 font-medium">İlgi</th>
              <th className="px-4 py-3 font-medium">Durum</th>
              <th className="px-4 py-3 font-medium">Mesaj</th>
            </tr>
          </thead>
          <tbody>
            {!loading && items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  Henüz demo talebi yok.
                </td>
              </tr>
            ) : null}
            {items.map((item) => (
              <tr key={item.id} className="border-b border-slate-100 align-top last:border-0">
                <td className="px-4 py-3 text-slate-600">
                  {new Date(item.createdDate).toLocaleString('tr-TR')}
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900">{item.companyName}</p>
                  <p className="text-slate-600">{item.contactName}</p>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  <p>{item.email}</p>
                  <p>{item.phone}</p>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {DEMO_INTEREST_LABELS[item.interest] ?? item.interest}
                </td>
                <td className="px-4 py-3">
                  <select
                    className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
                    value={item.status}
                    disabled={updatingId === item.id}
                    onChange={(event) =>
                      void handleStatusChange(item.id, Number(event.target.value))
                    }
                  >
                    {Object.entries(DEMO_REQUEST_STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="max-w-xs px-4 py-3 text-slate-600">{item.message ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
