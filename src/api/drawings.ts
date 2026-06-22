import { apiClient } from '@/api/client';
import { createEqFilter } from '@/api/dynamicQuery';
import type { Drawing, PagedResponse } from '@/types';

export async function uploadDrawing(params: {
  tenantId: string;
  projectId: string;
  siteId?: string;
  file: File;
}): Promise<Drawing> {
  const formData = new FormData();
  formData.append('tenantId', params.tenantId);
  formData.append('projectId', params.projectId);
  if (params.siteId) {
    formData.append('siteId', params.siteId);
  }
  formData.append('file', params.file);

  const { data } = await apiClient.post<Drawing>('/Drawings/files/upload', formData, {
    timeout: 600_000,
  });
  return data;
}

export async function getDrawingsByProject(projectId: string): Promise<Drawing[]> {
  const { data } = await apiClient.post<PagedResponse<Drawing>>(
    '/Drawings/GetListByDynamic',
    createEqFilter('ProjectId', projectId),
    {
      params: { PageIndex: 0, PageSize: 100 },
    },
  );

  return data.items ?? [];
}

export async function deleteDrawing(id: string): Promise<void> {
  await apiClient.delete(`/Drawings/${id}`);
}
