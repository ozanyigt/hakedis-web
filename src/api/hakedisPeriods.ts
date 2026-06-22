import { apiClient } from '@/api/client';
import { createEqFilter } from '@/api/dynamicQuery';
import type { HakedisPeriod, PagedResponse } from '@/types';

export async function getHakedisPeriodsByProject(projectId: string): Promise<HakedisPeriod[]> {
  const { data } = await apiClient.post<PagedResponse<HakedisPeriod>>(
    '/HakedisPeriods/GetListByDynamic',
    createEqFilter('ProjectId', projectId),
    { params: { PageIndex: 0, PageSize: 100 } },
  );
  return (data.items ?? []).sort((a, b) => a.periodNumber - b.periodNumber);
}

export async function createHakedisPeriod(payload: {
  tenantId: string;
  projectId: string;
  periodNumber: number;
  name: string;
  periodStart: string;
  periodEnd: string;
  status: number;
  totalAmount: number;
  deductionAmount: number;
  netAmount: number;
  notes?: string | null;
}): Promise<HakedisPeriod> {
  const { data } = await apiClient.post<HakedisPeriod>('/HakedisPeriods', payload);
  return data;
}

export async function updateHakedisPeriod(payload: {
  id: string;
  tenantId: string;
  projectId: string;
  periodNumber: number;
  name: string;
  periodStart: string;
  periodEnd: string;
  status: number;
  totalAmount: number;
  deductionAmount: number;
  netAmount: number;
  notes?: string | null;
}): Promise<HakedisPeriod> {
  const { data } = await apiClient.put<HakedisPeriod>('/HakedisPeriods', payload);
  return data;
}

export async function deleteHakedisPeriod(id: string): Promise<void> {
  await apiClient.delete(`/HakedisPeriods/${id}`);
}
