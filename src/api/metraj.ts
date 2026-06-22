import { apiClient } from '@/api/client';
import { createEqFilter } from '@/api/dynamicQuery';
import type { MetrajResult, PagedResponse } from '@/types';

interface CalculateMetrajApiResponse {
  drawingId: string;
  status: number;
  errorMessage?: string | null;
  drawingUnitNote?: string | null;
  results?: Array<{
    id: string;
    kalemType: number;
    unit: string;
    quantity: number;
  }>;
}

export async function getMetrajResultsByProject(projectId: string): Promise<MetrajResult[]> {
  const { data } = await apiClient.post<PagedResponse<MetrajResult>>(
    '/MetrajResults/GetListByDynamic',
    createEqFilter('ProjectId', projectId),
    {
      params: { PageIndex: 0, PageSize: 200 },
    },
  );

  return data.items ?? [];
}

export async function calculateMetraj(drawingId: string) {
  const { data } = await apiClient.post<CalculateMetrajApiResponse>(
    `/Drawings/${drawingId}/calculate-metraj`,
    null,
    {
      timeout: 120_000,
    },
  );

  if (data.status === 4 && data.errorMessage) {
    throw new Error(data.errorMessage);
  }

  return data;
}
