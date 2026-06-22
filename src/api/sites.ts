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
