import { AlertTriangle, ExternalLink, Loader2, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getApiErrorMessage } from '@/api/client';
import type { DailySiteReport } from './types';
import { useDailyReportWorkforce } from './useDailyReportWorkforce';
import { WorkforceRows } from './WorkforceRows';
import { WorkforceSummaryCards } from './WorkforceSummaryCards';

export function DailyReportWorkforceSection({ report }: { report: DailySiteReport }) {
  const workforce = useDailyReportWorkforce(report);
  const puantajUrl = `/app/puantaj?projectId=${encodeURIComponent(report.projectId)}&siteId=${encodeURIComponent(report.siteId)}&workDate=${encodeURIComponent(report.reportDate.slice(0, 10))}`;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 font-semibold text-slate-900"><Users size={18} /> İşgücü</h3>
          <p className="mt-1 text-xs text-slate-500">
            {workforce.data?.isSnapshot
              ? `Gönderim anındaki sabit kayıt${workforce.data.capturedAt ? ` · ${new Date(workforce.data.capturedAt).toLocaleString('tr-TR')}` : ''}`
              : 'Güncel puantaj kayıtlarından önizleme'}
          </p>
        </div>
        <Link to={puantajUrl} className="inline-flex items-center gap-1 text-sm font-medium text-brand-700">
          Puantaja git <ExternalLink size={14} />
        </Link>
      </div>
      {workforce.isLoading ? <Loader2 className="mx-auto my-8 animate-spin text-brand-600" /> : null}
      {workforce.error ? (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{getApiErrorMessage(workforce.error)}</p>
      ) : null}
      {workforce.data ? (
        <div className="space-y-4">
          <WorkforceSummaryCards workforce={workforce.data} />
          {workforce.data.siteLessCount || workforce.data.missingAttendanceCount ? (
            <p className="flex gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
              <AlertTriangle className="shrink-0" size={18} />
              {workforce.data.siteLessCount} şantiyesiz, {workforce.data.missingAttendanceCount} eksik puantaj kaydı var.
            </p>
          ) : null}
          <WorkforceRows rows={workforce.data.rows} />
        </div>
      ) : null}
    </section>
  );
}
