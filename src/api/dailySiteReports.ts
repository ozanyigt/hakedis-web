import { apiClient } from '@/api/client';
import type {
  DailySiteReport,
  DailySiteReportFilters,
  DailySiteReportPhoto,
  DailySiteReportPayload,
} from '@/features/daily-reports/types';
import {
  DAILY_REPORT_STATUS,
  DAILY_REPORT_WEATHER_OPTIONS,
} from '@/features/daily-reports/types';

interface ListEnvelope {
  items?: BackendDailySiteReport[];
}

interface BackendDailySiteReportPhoto {
  id: string;
  url: string;
  fileName: string;
  description?: string | null;
  sortOrder?: number;
  createdDate?: string | null;
}

interface BackendDailySiteReport {
  id: string;
  tenantId: string;
  projectId: string;
  projectName?: string;
  siteId: string;
  siteName?: string;
  reportDate: string;
  weather: number;
  minTemperatureCelsius?: number | null;
  maxTemperatureCelsius?: number | null;
  workSummary: string;
  workforceNotes?: string | null;
  equipmentNotes?: string | null;
  materialNotes?: string | null;
  blockersNotes?: string | null;
  notes?: string | null;
  rejectionReason?: string | null;
  status: number | string;
  photoCount?: number;
  photos?: BackendDailySiteReportPhoto[];
  createdDate?: string | null;
  updatedDate?: string | null;
}

function mapPhoto(photo: BackendDailySiteReportPhoto): DailySiteReportPhoto {
  return {
    id: photo.id,
    fileName: photo.fileName,
    url: photo.url,
    description: photo.description,
    createdAt: photo.createdDate,
  };
}

function normalizeStatus(status: number | string): DailySiteReport['status'] {
  if (typeof status === 'number' && status >= 0 && status <= 3) {
    return status as DailySiteReport['status'];
  }
  const value = String(status).toLowerCase();
  const numeric = Number(value);
  if (Number.isInteger(numeric) && numeric >= 0 && numeric <= 3) {
    return numeric as DailySiteReport['status'];
  }
  return ({
    draft: DAILY_REPORT_STATUS.draft,
    submitted: DAILY_REPORT_STATUS.submitted,
    approved: DAILY_REPORT_STATUS.approved,
    rejected: DAILY_REPORT_STATUS.rejected,
  } as Record<string, DailySiteReport['status']>)[value] ?? DAILY_REPORT_STATUS.draft;
}

function mapReport(report: BackendDailySiteReport): DailySiteReport {
  return {
    id: report.id,
    tenantId: report.tenantId,
    projectId: report.projectId,
    siteId: report.siteId,
    reportDate: report.reportDate,
    weather: DAILY_REPORT_WEATHER_OPTIONS[report.weather] ?? '',
    minTemperature: report.minTemperatureCelsius,
    maxTemperature: report.maxTemperatureCelsius,
    workSummary: report.workSummary,
    workforceNotes: report.workforceNotes,
    equipmentNotes: report.equipmentNotes,
    materialNotes: report.materialNotes,
    blockers: report.blockersNotes,
    generalNotes: report.notes,
    status: normalizeStatus(report.status),
    rejectionReason: report.rejectionReason,
    photos: (report.photos ?? []).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)).map(mapPhoto),
    photoCount: report.photoCount ?? report.photos?.length ?? 0,
    createdAt: report.createdDate,
    updatedAt: report.updatedDate,
  };
}

function mapPayload(payload: DailySiteReportPayload) {
  const weatherIndex = DAILY_REPORT_WEATHER_OPTIONS.indexOf(
    payload.weather as (typeof DAILY_REPORT_WEATHER_OPTIONS)[number],
  );
  return {
    tenantId: payload.tenantId,
    projectId: payload.projectId,
    siteId: payload.siteId,
    reportDate: payload.reportDate,
    weather: Math.max(weatherIndex, 0),
    minTemperatureCelsius: payload.minTemperature,
    maxTemperatureCelsius: payload.maxTemperature,
    workSummary: payload.workSummary,
    workforceNotes: payload.workforceNotes,
    equipmentNotes: payload.equipmentNotes,
    materialNotes: payload.materialNotes,
    blockersNotes: payload.blockers,
    notes: payload.generalNotes,
  };
}

export async function getDailySiteReports(
  filters: DailySiteReportFilters,
): Promise<DailySiteReport[]> {
  const { data } = await apiClient.get<BackendDailySiteReport[] | ListEnvelope>('/DailySiteReports', {
    params: {
      PageIndex: 0,
      PageSize: 100,
      tenantId: filters.tenantId,
      projectId: filters.projectId || undefined,
      siteId: filters.siteId || undefined,
      fromDate: filters.fromDate || undefined,
      toDate: filters.toDate || undefined,
    },
  });

  return (Array.isArray(data) ? data : (data.items ?? [])).map(mapReport);
}

export async function getDailySiteReport(id: string): Promise<DailySiteReport> {
  const { data } = await apiClient.get<BackendDailySiteReport>(`/DailySiteReports/${id}`);
  return mapReport(data);
}

export async function createDailySiteReport(
  payload: DailySiteReportPayload,
): Promise<DailySiteReport> {
  const { data } = await apiClient.post<BackendDailySiteReport>(
    '/DailySiteReports',
    mapPayload(payload),
  );
  return mapReport(data);
}

export async function updateDailySiteReport(
  payload: DailySiteReportPayload & { id: string },
): Promise<DailySiteReport> {
  const { data } = await apiClient.put<BackendDailySiteReport>(
    `/DailySiteReports/${payload.id}`,
    mapPayload(payload),
  );
  return mapReport(data);
}

export async function deleteDailySiteReport(id: string): Promise<void> {
  await apiClient.delete(`/DailySiteReports/${id}`);
}

export async function submitDailySiteReport(id: string): Promise<DailySiteReport> {
  const { data } = await apiClient.post<BackendDailySiteReport>(`/DailySiteReports/${id}/submit`);
  return mapReport(data);
}

export async function approveDailySiteReport(id: string): Promise<DailySiteReport> {
  const { data } = await apiClient.post<BackendDailySiteReport>(`/DailySiteReports/${id}/approve`);
  return mapReport(data);
}

export async function rejectDailySiteReport(
  id: string,
  reason?: string,
): Promise<DailySiteReport> {
  const { data } = await apiClient.post<BackendDailySiteReport>(
    `/DailySiteReports/${id}/reject`,
    reason?.trim() ? { reason: reason.trim() } : {},
  );
  return mapReport(data);
}

export async function uploadDailySiteReportPhotos(
  id: string,
  files: File[],
  descriptions: string[] = [],
): Promise<DailySiteReport> {
  for (const [index, file] of files.entries()) {
    const formData = new FormData();
    formData.append('file', file);
    if (descriptions[index]?.trim()) {
      formData.append('description', descriptions[index].trim());
    }
    await apiClient.post(`/DailySiteReports/${id}/photos`, formData);
  }
  return getDailySiteReport(id);
}

export async function deleteDailySiteReportPhoto(
  reportId: string,
  photoId: string,
): Promise<void> {
  await apiClient.delete(`/DailySiteReports/${reportId}/photos/${photoId}`);
}
