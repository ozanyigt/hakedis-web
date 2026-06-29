import { apiClient } from '@/api/client';
import type { PagedResponse } from '@/types';

export interface DemoRequestPayload {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  interest: string;
  message?: string;
}

export interface DemoRequestItem {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  interest: string;
  message?: string | null;
  status: number;
  createdDate: string;
}

export async function submitDemoRequest(
  payload: DemoRequestPayload,
): Promise<{ id: string; message: string }> {
  const { data } = await apiClient.post<{ id: string; message: string }>('/DemoRequests', payload);
  return data;
}

export async function getDemoRequests(
  pageIndex = 0,
  pageSize = 50,
): Promise<PagedResponse<DemoRequestItem>> {
  const { data } = await apiClient.get<PagedResponse<DemoRequestItem>>('/DemoRequests', {
    params: { PageIndex: pageIndex, PageSize: pageSize },
  });
  return data;
}

export async function updateDemoRequestStatus(id: string, status: number): Promise<void> {
  await apiClient.put(`/DemoRequests/${id}/status`, { status });
}
