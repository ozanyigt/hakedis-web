import { apiClient } from '@/api/client';
import { createEqFilter } from '@/api/dynamicQuery';
import type { PagedResponse, Site } from '@/types';

export async function getSitesByProject(projectId: string): Promise<Site[]> {
  const { data } = await apiClient.post<PagedResponse<Site>>(
    '/Sites/GetListByDynamic',
    createEqFilter('ProjectId', projectId),
    { params: { PageIndex: 0, PageSize: 100 } },
  );
  return data.items ?? [];
}

export async function createSite(payload: {
  tenantId: string;
  projectId: string;
  name: string;
  code?: string | null;
  location?: string | null;
  status: number;
  description?: string | null;
}): Promise<Site> {
  const { data } = await apiClient.post<Site>('/Sites', payload);
  return data;
}

export async function updateSite(payload: {
  id: string;
  tenantId: string;
  projectId: string;
  name: string;
  code?: string | null;
  location?: string | null;
  status: number;
  description?: string | null;
}): Promise<Site> {
  const { data } = await apiClient.put<Site>('/Sites', payload);
  return data;
}

export async function deleteSite(id: string): Promise<void> {
  await apiClient.delete(`/Sites/${id}`);
}
