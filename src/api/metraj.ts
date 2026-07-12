import { apiClient } from '@/api/client';
import { createEqFilter } from '@/api/dynamicQuery';
import type { MetrajResult, PagedResponse } from '@/types';

interface CalculateMetrajApiResponse {
  drawingId: string;
  status: number;
  errorMessage?: string | null;
  drawingUnitNote?: string | null;
  judgmentNote?: string | null;
  usedAi?: boolean;
  results?: Array<{
    id: string;
    kalemType: number;
    unit: number;
    quantity: number;
    grossQuantity?: number;
    suggestedQuantity?: number | null;
    approvalStatus?: number;
    judgmentDecision?: number | null;
    judgmentReason?: string | null;
    policyRef?: string | null;
    aiConfidence?: number | null;
    isLocked?: boolean;
  }>;
}

export interface ApproveMetrajItemPayload {
  id: string;
  approvedQuantity?: number | null;
  reject?: boolean;
  reviewNote?: string | null;
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

export async function approveMetrajResults(drawingId: string, items: ApproveMetrajItemPayload[] = []) {
  const { data } = await apiClient.post<{
    drawingId: string;
    success: boolean;
    errorMessage?: string | null;
    status: number;
    approvedCount: number;
  }>('/MetrajResults/approve', {
    drawingId,
    items,
  });

  if (!data.success && data.errorMessage) {
    throw new Error(data.errorMessage);
  }

  return data;
}
