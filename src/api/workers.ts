import { apiClient } from '@/api/client';
import { createEqFilter } from '@/api/dynamicQuery';
import type { PagedResponse, Worker } from '@/types';

export async function getWorkersByTenant(tenantId: string): Promise<Worker[]> {
  const { data } = await apiClient.post<PagedResponse<Worker>>(
    '/Workers/GetListByDynamic',
    createEqFilter('TenantId', tenantId),
    { params: { PageIndex: 0, PageSize: 500 } },
  );
  return data.items ?? [];
}

export async function createWorker(payload: {
  tenantId: string;
  fullName: string;
  trade?: string;
  phone?: string;
  identityNumber?: string;
  isActive: boolean;
}): Promise<Worker> {
  const { data } = await apiClient.post<Worker>('/Workers', payload);
  return data;
}

export async function updateWorker(payload: {
  id: string;
  tenantId: string;
  fullName: string;
  trade?: string;
  phone?: string;
  identityNumber?: string;
  isActive: boolean;
}): Promise<Worker> {
  const { data } = await apiClient.put<Worker>('/Workers', payload);
  return data;
}

export async function deleteWorker(id: string): Promise<void> {
  await apiClient.delete(`/Workers/${id}`);
}
