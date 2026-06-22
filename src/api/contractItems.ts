import { apiClient } from '@/api/client';
import { createEqFilter } from '@/api/dynamicQuery';
import type { ContractItem, PagedResponse } from '@/types';

export async function getContractItemsByProject(projectId: string): Promise<ContractItem[]> {
  const { data } = await apiClient.post<PagedResponse<ContractItem>>(
    '/ContractItems/GetListByDynamic',
    createEqFilter('ProjectId', projectId),
    { params: { PageIndex: 0, PageSize: 100 } },
  );
  return (data.items ?? []).sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function createContractItem(payload: {
  tenantId: string;
  projectId: string;
  kalemType: number;
  description: string;
  unit: string;
  unitPrice: number;
  contractQuantity?: number | null;
  sortOrder: number;
}): Promise<ContractItem> {
  const { data } = await apiClient.post<ContractItem>('/ContractItems', payload);
  return data;
}

export async function updateContractItem(payload: {
  id: string;
  tenantId: string;
  projectId: string;
  kalemType: number;
  description: string;
  unit: string;
  unitPrice: number;
  contractQuantity?: number | null;
  sortOrder: number;
}): Promise<ContractItem> {
  const { data } = await apiClient.put<ContractItem>('/ContractItems', payload);
  return data;
}

export async function deleteContractItem(id: string): Promise<void> {
  await apiClient.delete(`/ContractItems/${id}`);
}
