import { Camera, ChevronRight, Loader2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/useMediaQuery';
import {
  DAILY_REPORT_STATUS_COLORS,
  DAILY_REPORT_STATUS_LABELS,
  type DailySiteReport,
  type DailyReportStatus,
} from './types';

interface DailyReportsListProps {
  reports: DailySiteReport[];
  selectedId?: string;
  siteNames: Record<string, string>;
  loading: boolean;
  onSelect: (report: DailySiteReport) => void;
}

function StatusBadge({ status }: { status: DailyReportStatus }) {
  return (
    <span className={`rounded-full px-2 py-1 text-xs font-medium ${DAILY_REPORT_STATUS_COLORS[status]}`}>
      {DAILY_REPORT_STATUS_LABELS[status]}
    </span>
  );
}

export function DailyReportsList({
  reports,
  selectedId,
  siteNames,
  loading,
  onSelect,
}: DailyReportsListProps) {
  const isMobile = useIsMobile();

  if (loading && reports.length === 0) {
    return (
      <div className="flex min-h-40 items-center justify-center rounded-xl border border-slate-200 bg-white">
        <Loader2 className="animate-spin text-brand-600" size={24} />
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center text-sm text-slate-500">
        Seçilen ölçütlerde günlük saha raporu bulunamadı.
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="space-y-3">
        {reports.map((report) => (
          <button
            key={report.id}
            type="button"
            onClick={() => onSelect(report)}
            className={`w-full rounded-xl border bg-white p-4 text-left shadow-sm ${
              report.id === selectedId ? 'border-brand-500 ring-1 ring-brand-200' : 'border-slate-200'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">
                  {new Date(report.reportDate).toLocaleDateString('tr-TR')}
                </p>
                <p className="mt-1 text-sm text-slate-600">{siteNames[report.siteId] ?? 'Şantiye'}</p>
              </div>
              <StatusBadge status={report.status} />
            </div>
            <p className="mt-3 line-clamp-2 text-sm text-slate-600">{report.workSummary}</p>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
              <span className="inline-flex items-center gap-1">
                <Camera size={14} />
                {report.photoCount ?? report.photos?.length ?? 0} fotoğraf
              </span>
              <ChevronRight size={17} />
            </div>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
          <tr>
            <th className="px-4 py-3 font-medium">Tarih</th>
            <th className="px-4 py-3 font-medium">Şantiye</th>
            <th className="px-4 py-3 font-medium">Hava</th>
            <th className="px-4 py-3 font-medium">Yapılan işler</th>
            <th className="px-4 py-3 font-medium">Fotoğraf</th>
            <th className="px-4 py-3 font-medium">Durum</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => (
            <tr
              key={report.id}
              onClick={() => onSelect(report)}
              className={`cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50 ${
                report.id === selectedId ? 'bg-brand-50' : ''
              }`}
            >
              <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">
                {new Date(report.reportDate).toLocaleDateString('tr-TR')}
              </td>
              <td className="px-4 py-3 text-slate-700">{siteNames[report.siteId] ?? '-'}</td>
              <td className="px-4 py-3 text-slate-700">{report.weather ?? '-'}</td>
              <td className="max-w-xs truncate px-4 py-3 text-slate-700">{report.workSummary}</td>
              <td className="px-4 py-3 text-slate-600">
                {report.photoCount ?? report.photos?.length ?? 0}
              </td>
              <td className="px-4 py-3"><StatusBadge status={report.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
