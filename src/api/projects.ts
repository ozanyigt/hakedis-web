import { apiClient } from '@/api/client';
import { createEqFilter } from '@/api/dynamicQuery';
import type { PagedResponse, Project } from '@/types';

export async function getProjects(pageIndex = 0, pageSize = 50): Promise<PagedResponse<Project>> {
  const { data } = await apiClient.get<PagedResponse<Project>>('/Projects', {
    params: { PageIndex: pageIndex, PageSize: pageSize },
  });
  return data;
}

export async function getProjectsByTenant(tenantId: string): Promise<Project[]> {
  const { data } = await apiClient.post<PagedResponse<Project>>(
    '/Projects/GetListByDynamic',
    createEqFilter('TenantId', tenantId),
    {
      params: { PageIndex: 0, PageSize: 100 },
    },
  );

  return data.items ?? [];
}

export async function createProject(payload: {
  tenantId: string;
  name: string;
  code?: string | null;
  location?: string | null;
  clientName?: string | null;
  contractAmount: number;
  startDate?: string | null;
  endDate?: string | null;
  status: number;
  description?: string | null;
}): Promise<Project> {
  const { data } = await apiClient.post<Project>('/Projects', {
    ...payload,
    startDate: payload.startDate ? new Date(payload.startDate).toISOString() : null,
    endDate: payload.endDate ? new Date(payload.endDate).toISOString() : null,
  });
  return data;
}

export async function updateProject(payload: {
  id: string;
  tenantId: string;
  name: string;
  code?: string | null;
  location?: string | null;
  clientName?: string | null;
  contractAmount: number;
  startDate?: string | null;
  endDate?: string | null;
  status: number;
  description?: string | null;
}): Promise<Project> {
  const { data } = await apiClient.put<Project>('/Projects', {
    ...payload,
    startDate: payload.startDate ? new Date(payload.startDate).toISOString() : null,
    endDate: payload.endDate ? new Date(payload.endDate).toISOString() : null,
  });
  return data;
}

export async function deleteProject(id: string): Promise<void> {
  await apiClient.delete(`/Projects/${id}`);
}
