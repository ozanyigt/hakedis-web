import { apiClient } from '@/api/client';
import { createEqFilter } from '@/api/dynamicQuery';
import type { HakedisDeductionLine, PagedResponse } from '@/types';

export async function getDeductionLinesByPeriod(periodId: string): Promise<HakedisDeductionLine[]> {
  const { data } = await apiClient.post<PagedResponse<HakedisDeductionLine>>(
    '/HakedisDeductionLines/GetListByDynamic',
    createEqFilter('HakedisPeriodId', periodId),
    { params: { PageIndex: 0, PageSize: 200 } },
  );
  return data.items ?? [];
}

export async function createDeductionLine(payload: {
  tenantId: string;
  hakedisPeriodId: string;
  category: number;
  description: string;
  amount: number;
  notes?: string | null;
}): Promise<HakedisDeductionLine> {
  const { data } = await apiClient.post<HakedisDeductionLine>('/HakedisDeductionLines', payload);
  return data;
}

export async function updateDeductionLine(payload: {
  id: string;
  tenantId: string;
  hakedisPeriodId: string;
  category: number;
  description: string;
  amount: number;
  notes?: string | null;
}): Promise<HakedisDeductionLine> {
  const { data } = await apiClient.put<HakedisDeductionLine>('/HakedisDeductionLines', payload);
  return data;
}

export async function deleteDeductionLine(id: string): Promise<void> {
  await apiClient.delete(`/HakedisDeductionLines/${id}`);
}
