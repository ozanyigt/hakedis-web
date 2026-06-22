import { apiClient } from '@/api/client';
import type { PagedResponse, Tenant } from '@/types';

export async function getTenants(pageIndex = 0, pageSize = 50): Promise<PagedResponse<Tenant>> {
  const { data } = await apiClient.get<PagedResponse<Tenant>>('/Tenants', {
    params: { PageIndex: pageIndex, PageSize: pageSize },
  });
  return data;
}
