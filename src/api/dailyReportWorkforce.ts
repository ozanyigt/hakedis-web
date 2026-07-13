import { apiClient } from '@/api/client';
import type {
  DailyReportWorkforce,
  DailyReportWorkforceRow,
} from '@/features/daily-reports/workforceTypes';

type UnknownRecord = Record<string, unknown>;

function value(source: UnknownRecord, ...keys: string[]): unknown {
  for (const key of keys) {
    if (source[key] !== undefined) return source[key];
  }
}

function numberValue(input: unknown): number {
  const result = Number(input ?? 0);
  return Number.isFinite(result) ? result : 0;
}

function mapRow(input: unknown): DailyReportWorkforceRow {
  const row = (input ?? {}) as UnknownRecord;
  const siteId = value(row, 'siteId', 'SiteId');
  const hasAttendance = value(row, 'hasAttendance', 'HasAttendance');
  const hasSite = value(row, 'hasSite', 'HasSite');
  return {
    id: value(row, 'id', 'Id') as string | undefined,
    workerId: value(row, 'workerId', 'WorkerId') as string | null | undefined,
    workerName: String(value(row, 'workerName', 'WorkerName', 'fullName', 'FullName') ?? '-'),
    trade: value(row, 'trade', 'Trade') as string | null | undefined,
    siteId: siteId as string | null | undefined,
    siteName: value(row, 'siteName', 'SiteName') as string | null | undefined,
    workType: value(row, 'workType', 'WorkType') as number | null | undefined,
    dayCount: numberValue(value(row, 'dayCount', 'DayCount')),
    overtimeHours: numberValue(value(row, 'overtimeHours', 'OvertimeHours')),
    hasAttendance: hasAttendance === undefined ? true : Boolean(hasAttendance),
    hasSite: hasSite === undefined && siteId === undefined ? true : Boolean(hasSite ?? siteId),
  };
}

function mapWorkforce(input: unknown, isSnapshot: boolean): DailyReportWorkforce {
  if (Array.isArray(input)) {
    const rows = input.map(mapRow);
    return {
      rows,
      workerCount: rows.length,
      totalDayCount: rows.reduce((sum, row) => sum + row.dayCount, 0),
      totalOvertimeHours: rows.reduce((sum, row) => sum + row.overtimeHours, 0),
      missingAttendanceCount: rows.length ? 0 : 1,
      siteLessCount: rows.filter((row) => !row.hasSite).length,
      isSnapshot,
    };
  }
  const body = (input ?? {}) as UnknownRecord;
  const rawRows = value(body, 'rows', 'Rows', 'items', 'Items', 'workers', 'Workers');
  const rows = (Array.isArray(rawRows) ? rawRows : []).map(mapRow);
  return {
    rows,
    workerCount: numberValue(value(body, 'workerCount', 'WorkerCount')) || rows.length,
    totalDayCount:
      numberValue(value(body, 'totalDayCount', 'TotalDayCount')) ||
      rows.reduce((sum, row) => sum + row.dayCount, 0),
    totalOvertimeHours:
      numberValue(value(body, 'totalOvertimeHours', 'TotalOvertimeHours')) ||
      rows.reduce((sum, row) => sum + row.overtimeHours, 0),
    missingAttendanceCount:
      numberValue(value(body, 'missingAttendanceCount', 'MissingAttendanceCount')) ||
      rows.filter((row) => !row.hasAttendance).length,
    siteLessCount:
      numberValue(value(body, 'siteLessCount', 'SiteLessCount')) ||
      rows.filter((row) => !row.hasSite).length,
    capturedAt: value(body, 'capturedAt', 'CapturedAt', 'createdDate', 'CreatedDate') as
      | string
      | null
      | undefined,
    isSnapshot,
  };
}

export async function getDailyReportWorkforcePreview(params: {
  tenantId: string;
  projectId: string;
  siteId: string;
  reportDate: string;
}) {
  const { data } = await apiClient.get('/DailySiteReports/workforce-preview', { params });
  return mapWorkforce(data, false);
}

export async function getDailyReportWorkforceSnapshot(reportId: string) {
  const { data } = await apiClient.get(`/DailySiteReports/${reportId}/workforce-snapshot`);
  return mapWorkforce(data, true);
}
