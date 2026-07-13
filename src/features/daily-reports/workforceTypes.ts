export interface DailyReportWorkforceRow {
  id?: string;
  workerId?: string | null;
  workerName: string;
  trade?: string | null;
  siteId?: string | null;
  siteName?: string | null;
  workType?: number | null;
  dayCount: number;
  overtimeHours: number;
  hasAttendance: boolean;
  hasSite: boolean;
}

export interface DailyReportWorkforce {
  rows: DailyReportWorkforceRow[];
  workerCount: number;
  totalDayCount: number;
  totalOvertimeHours: number;
  missingAttendanceCount: number;
  siteLessCount: number;
  capturedAt?: string | null;
  isSnapshot: boolean;
}
