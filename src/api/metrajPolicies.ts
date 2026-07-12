import { apiClient } from '@/api/client';
import type { MetrajPolicy } from '@/types';

export interface MetrajPolicyItemPayload {
  code: string;
  title: string;
  body: string;
  isActive: boolean;
}

export async function getMetrajPoliciesByTenant(tenantId: string): Promise<MetrajPolicy[]> {
  const { data } = await apiClient.get<MetrajPolicy[]>(`/MetrajPolicies/by-tenant/${tenantId}`);
  return data ?? [];
}

export async function saveMetrajPolicies(
  tenantId: string,
  policies: MetrajPolicyItemPayload[],
): Promise<MetrajPolicy[]> {
  const { data } = await apiClient.put<MetrajPolicy[]>(`/MetrajPolicies/by-tenant/${tenantId}`, policies);
  return data ?? [];
}
