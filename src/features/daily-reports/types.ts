export const DAILY_REPORT_STATUS = {
  draft: 0,
  submitted: 1,
  approved: 2,
  rejected: 3,
} as const;

export type DailyReportStatus =
  (typeof DAILY_REPORT_STATUS)[keyof typeof DAILY_REPORT_STATUS];

export const DAILY_REPORT_STATUS_LABELS: Record<DailyReportStatus, string> = {
  0: 'Taslak',
  1: 'Onay bekliyor',
  2: 'Onaylandı',
  3: 'Reddedildi',
};

export const DAILY_REPORT_STATUS_COLORS: Record<DailyReportStatus, string> = {
  0: 'bg-slate-100 text-slate-700',
  1: 'bg-blue-100 text-blue-700',
  2: 'bg-emerald-100 text-emerald-700',
  3: 'bg-red-100 text-red-700',
};

export const DAILY_REPORT_WEATHER_OPTIONS = [
  'Güneşli',
  'Parçalı bulutlu',
  'Bulutlu',
  'Yağmurlu',
  'Karlı',
  'Rüzgarlı',
] as const;

export const DAILY_REPORT_MAX_PHOTOS = 6;
export const DAILY_REPORT_MAX_PHOTO_BYTES = 8 * 1024 * 1024;
export const DAILY_REPORT_ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;
export const DAILY_REPORT_PHOTO_ACCEPT =
  'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp';

export interface DailySiteReportPhoto {
  id: string;
  fileName?: string | null;
  fileUrl?: string | null;
  url?: string | null;
  description?: string | null;
  createdAt?: string | null;
}

export interface DailySiteReport {
  id: string;
  tenantId: string;
  projectId: string;
  siteId: string;
  reportDate: string;
  weather?: string | null;
  minTemperature?: number | null;
  maxTemperature?: number | null;
  workSummary: string;
  workforceNotes?: string | null;
  equipmentNotes?: string | null;
  materialNotes?: string | null;
  blockers?: string | null;
  generalNotes?: string | null;
  status: DailyReportStatus;
  rejectionReason?: string | null;
  photos?: DailySiteReportPhoto[];
  photoCount?: number;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface DailySiteReportFilters {
  tenantId: string;
  projectId?: string;
  siteId?: string;
  fromDate?: string;
  toDate?: string;
}

export interface DailyReportFilterValues {
  projectId: string;
  siteId: string;
  fromDate: string;
  toDate: string;
}

export interface DailySiteReportPayload {
  id?: string;
  tenantId: string;
  projectId: string;
  siteId: string;
  reportDate: string;
  weather?: string | null;
  minTemperature?: number | null;
  maxTemperature?: number | null;
  workSummary: string;
  workforceNotes?: string | null;
  equipmentNotes?: string | null;
  materialNotes?: string | null;
  blockers?: string | null;
  generalNotes?: string | null;
}

export interface DailyReportFormValues {
  projectId: string;
  siteId: string;
  reportDate: string;
  weather: string;
  minTemperature: string;
  maxTemperature: string;
  workSummary: string;
  workforceNotes: string;
  equipmentNotes: string;
  materialNotes: string;
  blockers: string;
  generalNotes: string;
}

export function createEmptyDailyReportForm(projectId = '', siteId = ''): DailyReportFormValues {
  return {
    projectId,
    siteId,
    reportDate: new Date().toISOString().slice(0, 10),
    weather: '',
    minTemperature: '',
    maxTemperature: '',
    workSummary: '',
    workforceNotes: '',
    equipmentNotes: '',
    materialNotes: '',
    blockers: '',
    generalNotes: '',
  };
}

export function dailyReportToForm(report: DailySiteReport): DailyReportFormValues {
  return {
    projectId: report.projectId,
    siteId: report.siteId,
    reportDate: report.reportDate.slice(0, 10),
    weather: report.weather ?? '',
    minTemperature: report.minTemperature == null ? '' : String(report.minTemperature),
    maxTemperature: report.maxTemperature == null ? '' : String(report.maxTemperature),
    workSummary: report.workSummary ?? '',
    workforceNotes: report.workforceNotes ?? '',
    equipmentNotes: report.equipmentNotes ?? '',
    materialNotes: report.materialNotes ?? '',
    blockers: report.blockers ?? '',
    generalNotes: report.generalNotes ?? '',
  };
}
