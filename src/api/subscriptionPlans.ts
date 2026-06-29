import { apiClient } from '@/api/client';
import type { PagedResponse, SubscriptionPlanDetail } from '@/types';

export interface SubscriptionPlanPayload {
  code: string;
  name: string;
  description?: string;
  monthlyPrice: number;
  yearlyPrice: number;
  enabledModules: string;
  maxSiteCount: number;
  isActive: boolean;
}

export async function getSubscriptionPlans(
  pageIndex = 0,
  pageSize = 50,
): Promise<PagedResponse<SubscriptionPlanDetail>> {
  const { data } = await apiClient.get<PagedResponse<SubscriptionPlanDetail>>('/SubscriptionPlans', {
    params: { PageIndex: pageIndex, PageSize: pageSize },
  });
  return data;
}

export async function getSubscriptionPlanById(id: string): Promise<SubscriptionPlanDetail> {
  const { data } = await apiClient.get<SubscriptionPlanDetail>(`/SubscriptionPlans/${id}`);
  return data;
}

export async function createSubscriptionPlan(
  payload: SubscriptionPlanPayload,
): Promise<SubscriptionPlanDetail> {
  const { data } = await apiClient.post<SubscriptionPlanDetail>('/SubscriptionPlans', payload);
  return data;
}

export async function updateSubscriptionPlan(
  id: string,
  payload: SubscriptionPlanPayload,
): Promise<SubscriptionPlanDetail> {
  const { data } = await apiClient.put<SubscriptionPlanDetail>('/SubscriptionPlans', { id, ...payload });
  return data;
}

export async function deleteSubscriptionPlan(id: string): Promise<void> {
  await apiClient.delete(`/SubscriptionPlans/${id}`);
}
