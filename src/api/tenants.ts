import { apiClient } from '@/api/client';
import type { PagedResponse, Tenant, TenantDetail } from '@/types';

export interface TenantPayload {
  name: string;
  taxNumber?: string;
  taxOffice?: string;
  address?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
}

export async function getTenants(pageIndex = 0, pageSize = 50): Promise<PagedResponse<Tenant>> {
  const { data } = await apiClient.get<PagedResponse<Tenant>>('/Tenants', {
    params: { PageIndex: pageIndex, PageSize: pageSize },
  });
  return data;
}

export async function getTenantById(id: string): Promise<TenantDetail> {
  const { data } = await apiClient.get<TenantDetail>(`/Tenants/${id}`);
  return data;
}

export async function createTenant(payload: TenantPayload): Promise<TenantDetail> {
  const { data } = await apiClient.post<TenantDetail>('/Tenants', payload);
  return data;
}

export async function updateTenant(id: string, payload: TenantPayload): Promise<TenantDetail> {
  const { data } = await apiClient.put<TenantDetail>('/Tenants', { id, ...payload });
  return data;
}

export async function deleteTenant(id: string): Promise<void> {
  await apiClient.delete(`/Tenants/${id}`);
}
