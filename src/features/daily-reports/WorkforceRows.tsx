import { useIsMobile } from '@/hooks/useMediaQuery';
import { WORK_TYPE_LABELS } from '@/types';
import type { DailyReportWorkforceRow } from './workforceTypes';

export function WorkforceRows({ rows }: { rows: DailyReportWorkforceRow[] }) {
  const isMobile = useIsMobile();
  if (!rows.length) {
    return <p className="py-6 text-center text-sm text-slate-500">Bu tarih için puantaj kaydı yok.</p>;
  }
  if (isMobile) {
    return (
      <div className="space-y-2">
        {rows.map((row, index) => (
          <div key={row.id ?? row.workerId ?? index} className="rounded-lg border border-slate-200 p-3">
            <div className="flex justify-between gap-2">
              <div>
                <p className="font-medium text-slate-900">{row.workerName}</p>
                <p className="text-xs text-slate-500">{row.trade ?? 'Meslek belirtilmedi'}</p>
              </div>
              <p className="text-sm font-medium">{row.dayCount} gün</p>
            </div>
            <p className="mt-2 text-xs text-slate-600">
              {row.siteName ?? 'Şantiye atanmamış'} · {row.overtimeHours} saat mesai
            </p>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-slate-200 text-slate-500">
          <tr>
            <th className="py-2 pr-4 font-medium">Çalışan</th>
            <th className="py-2 pr-4 font-medium">Şantiye</th>
            <th className="py-2 pr-4 font-medium">Çalışma</th>
            <th className="py-2 pr-4 font-medium">Gün</th>
            <th className="py-2 font-medium">Mesai</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id ?? row.workerId ?? index} className="border-b border-slate-100">
              <td className="py-2 pr-4"><b>{row.workerName}</b><br /><span className="text-xs text-slate-500">{row.trade ?? '-'}</span></td>
              <td className="py-2 pr-4">{row.siteName ?? '-'}</td>
              <td className="py-2 pr-4">{row.workType ? WORK_TYPE_LABELS[row.workType] ?? row.workType : '-'}</td>
              <td className="py-2 pr-4">{row.dayCount}</td>
              <td className="py-2">{row.overtimeHours} saat</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
