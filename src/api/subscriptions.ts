import { apiClient } from '@/api/client';
import { createEqFilter } from '@/api/dynamicQuery';
import type { PagedResponse, Subscription, SubscriptionPlanDetail } from '@/types';

export interface SubscriptionPayload {
  tenantId: string;
  subscriptionPlanId: string;
  billingCycle: number;
  status: number;
  startDate: string;
  endDate?: string | null;
  isManualAssignment: boolean;
  notes?: string;
}

export async function getSubscriptions(
  pageIndex = 0,
  pageSize = 100,
): Promise<PagedResponse<Subscription>> {
  const { data } = await apiClient.get<PagedResponse<Subscription>>('/Subscriptions', {
    params: { PageIndex: pageIndex, PageSize: pageSize },
  });
  return data;
}

export async function getSubscriptionsByTenant(tenantId: string): Promise<Subscription[]> {
  const { data } = await apiClient.post<PagedResponse<Subscription>>(
    '/Subscriptions/GetListByDynamic',
    createEqFilter('TenantId', tenantId),
    {
      params: { PageIndex: 0, PageSize: 20 },
    },
  );

  return data.items ?? [];
}

export async function getSubscriptionPlan(planId: string): Promise<SubscriptionPlanDetail> {
  const { data } = await apiClient.get<SubscriptionPlanDetail>(`/SubscriptionPlans/${planId}`);
  return data;
}

export async function createSubscription(payload: SubscriptionPayload): Promise<Subscription> {
  const { data } = await apiClient.post<Subscription>('/Subscriptions', payload);
  return data;
}

export async function updateSubscription(
  id: string,
  payload: SubscriptionPayload,
): Promise<Subscription> {
  const { data } = await apiClient.put<Subscription>('/Subscriptions', { id, ...payload });
  return data;
}

export async function deleteSubscription(id: string): Promise<void> {
  await apiClient.delete(`/Subscriptions/${id}`);
}
