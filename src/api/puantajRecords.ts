import { apiClient } from '@/api/client';
import { createEqFilter } from '@/api/dynamicQuery';
import type { PuantajRecord, PagedResponse } from '@/types';

export async function getPuantajRecordsByProject(projectId: string): Promise<PuantajRecord[]> {
  const { data } = await apiClient.post<PagedResponse<PuantajRecord>>(
    '/PuantajRecords/GetListByDynamic',
    createEqFilter('ProjectId', projectId),
    { params: { PageIndex: 0, PageSize: 500 } },
  );
  return data.items ?? [];
}

export async function createPuantajRecord(payload: {
  tenantId: string;
  projectId: string;
  siteId?: string | null;
  workerId?: string | null;
  workDate: string;
  workType: string;
  dayCount: number;
  overtimeHours: number;
  status: number;
  notes?: string | null;
}): Promise<PuantajRecord> {
  const { data } = await apiClient.post<PuantajRecord>('/PuantajRecords', payload);
  return data;
}

export async function updatePuantajRecord(payload: {
  id: string;
  tenantId: string;
  projectId: string;
  siteId?: string | null;
  workerId?: string | null;
  workDate: string;
  workType: string;
  dayCount: number;
  overtimeHours: number;
  status: number;
  notes?: string | null;
}): Promise<PuantajRecord> {
  const { data } = await apiClient.put<PuantajRecord>('/PuantajRecords', payload);
  return data;
}

export async function deletePuantajRecord(id: string): Promise<void> {
  await apiClient.delete(`/PuantajRecords/${id}`);
}
