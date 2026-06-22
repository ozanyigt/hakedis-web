import { apiClient } from '@/api/client';
import { createEqFilter } from '@/api/dynamicQuery';
import type { PagedResponse, Subscription, SubscriptionPlan } from '@/types';

export async function getSubscriptionsByTenant(tenantId: string): Promise<Subscription[]> {
  const { data } = await apiClient.post<PagedResponse<Subscription>>(
    '/Subscriptions/GetListByDynamic',
    createEqFilter('TenantId', tenantId),
    {
      params: { PageIndex: 0, PageSize: 20 },
    },
  );

  return data.items;
}

export async function getSubscriptionPlan(planId: string): Promise<SubscriptionPlan> {
  const { data } = await apiClient.get<SubscriptionPlan>(`/SubscriptionPlans/${planId}`);
  return data;
}
