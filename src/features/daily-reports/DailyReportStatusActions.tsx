import { useState } from 'react';
import { CheckCircle2, Loader2, Send, XCircle } from 'lucide-react';
import {
  DAILY_REPORT_STATUS,
  DAILY_REPORT_STATUS_COLORS,
  DAILY_REPORT_STATUS_LABELS,
  type DailySiteReport,
} from './types';

interface DailyReportStatusActionsProps {
  report: DailySiteReport;
  canUpdate: boolean;
  canAdmin: boolean;
  saving: boolean;
  onAction: (action: 'submit' | 'approve' | 'reject', reason?: string) => void;
}

export function DailyReportStatusActions({
  report,
  canUpdate,
  canAdmin,
  saving,
  onAction,
}: DailyReportStatusActionsProps) {
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState('');
  const canSubmit =
    canUpdate &&
    (report.status === DAILY_REPORT_STATUS.draft ||
      report.status === DAILY_REPORT_STATUS.rejected);
  const canReview = canAdmin && report.status === DAILY_REPORT_STATUS.submitted;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Rapor durumu</p>
          <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-medium ${DAILY_REPORT_STATUS_COLORS[report.status]}`}>
            {DAILY_REPORT_STATUS_LABELS[report.status]}
          </span>
          {report.rejectionReason ? (
            <p className="mt-2 text-sm text-red-700">Red nedeni: {report.rejectionReason}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {canSubmit ? (
            <button
              type="button"
              disabled={saving}
              onClick={() => onAction('submit')}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
              Onaya Gönder
            </button>
          ) : null}
          {canReview ? (
            <>
              <button
                type="button"
                disabled={saving}
                onClick={() => onAction('approve')}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                <CheckCircle2 size={16} />
                Onayla
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => setShowReject((current) => !current)}
                className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
              >
                <XCircle size={16} />
                Reddet
              </button>
            </>
          ) : null}
        </div>
      </div>

      {showReject && canReview ? (
        <div className="mt-4 rounded-lg bg-red-50 p-3">
          <label className="text-sm font-medium text-red-800">
            Red nedeni <span className="font-normal">(opsiyonel)</span>
            <textarea
              className="mt-1 min-h-20 w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-slate-900"
              value={reason}
              maxLength={1000}
              onChange={(event) => setReason(event.target.value)}
            />
          </label>
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowReject(false)}
              className="rounded-lg px-3 py-2 text-sm text-slate-600"
            >
              Vazgeç
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => onAction('reject', reason)}
              className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              Reddi Onayla
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
