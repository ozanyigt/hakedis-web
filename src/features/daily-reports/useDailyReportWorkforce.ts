import { useEffect, useState } from 'react';
import {
  getDailyReportWorkforcePreview,
  getDailyReportWorkforceSnapshot,
} from '@/api/dailyReportWorkforce';
import { DAILY_REPORT_STATUS } from './types';
import type { DailySiteReport } from './types';

export function useDailyReportWorkforce(report: DailySiteReport) {
  const [data, setData] = useState<Awaited<ReturnType<typeof getDailyReportWorkforcePreview>>>();
  const [error, setError] = useState<unknown>();
  const [isLoading, setIsLoading] = useState(false);
  const isDraftLike =
    report.status === DAILY_REPORT_STATUS.draft || report.status === DAILY_REPORT_STATUS.rejected;

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(undefined);
    const request = isDraftLike
      ? getDailyReportWorkforcePreview({
          tenantId: report.tenantId,
          projectId: report.projectId,
          siteId: report.siteId,
          reportDate: report.reportDate,
        })
      : getDailyReportWorkforceSnapshot(report.id);
    void request
      .then((result) => { if (active) setData(result); })
      .catch((requestError) => { if (active) setError(requestError); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [isDraftLike, report.id, report.projectId, report.reportDate, report.siteId, report.tenantId]);

  return { data, error, isLoading };
}
