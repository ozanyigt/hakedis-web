import { apiClient } from '@/api/client';
import { createEqFilter } from '@/api/dynamicQuery';
import type { PagedResponse, ProgressEntry } from '@/types';

export async function getProgressEntriesByPeriod(periodId: string): Promise<ProgressEntry[]> {
  const { data } = await apiClient.post<PagedResponse<ProgressEntry>>(
    '/ProgressEntries/GetListByDynamic',
    createEqFilter('HakedisPeriodId', periodId),
    { params: { PageIndex: 0, PageSize: 200 } },
  );
  return data.items ?? [];
}

export async function createProgressEntry(payload: {
  tenantId: string;
  hakedisPeriodId: string;
  contractItemId: string;
  quantityThisPeriod: number;
  cumulativeQuantity: number;
  amountThisPeriod: number;
  metrajResultId?: string | null;
  isManualEntry: boolean;
  notes?: string | null;
}): Promise<ProgressEntry> {
  const { data } = await apiClient.post<ProgressEntry>('/ProgressEntries', payload);
  return data;
}

export async function updateProgressEntry(payload: {
  id: string;
  tenantId: string;
  hakedisPeriodId: string;
  contractItemId: string;
  quantityThisPeriod: number;
  cumulativeQuantity: number;
  amountThisPeriod: number;
  metrajResultId?: string | null;
  isManualEntry: boolean;
  notes?: string | null;
}): Promise<ProgressEntry> {
  const { data } = await apiClient.put<ProgressEntry>('/ProgressEntries', payload);
  return data;
}

export async function deleteProgressEntry(id: string): Promise<void> {
  await apiClient.delete(`/ProgressEntries/${id}`);
}
