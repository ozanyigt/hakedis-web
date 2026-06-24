import { apiClient } from '@/api/client';
import type { AppUser, CreateUserPayload, FirmRoleOption, PagedResponse, UpdateUserPayload } from '@/types';

export async function getUsers(
  pageIndex = 0,
  pageSize = 50,
  tenantId?: string,
): Promise<PagedResponse<AppUser>> {
  const { data } = await apiClient.get<PagedResponse<AppUser>>('/Users', {
    params: {
      PageIndex: pageIndex,
      PageSize: pageSize,
      ...(tenantId ? { tenantId } : {}),
    },
  });
  return data;
}

export async function getUserFromAuth(): Promise<AppUser> {
  const { data } = await apiClient.get<AppUser>('/Users/GetFromAuth');
  return data;
}

export async function getFirmRoles(): Promise<FirmRoleOption[]> {
  const { data } = await apiClient.get<FirmRoleOption[]>('/Users/FirmRoles');
  return data;
}

export async function createUser(payload: CreateUserPayload): Promise<AppUser> {
  const { data } = await apiClient.post<AppUser>('/Users', payload);
  return data;
}

export async function updateUser(payload: UpdateUserPayload): Promise<AppUser> {
  const { data } = await apiClient.put<AppUser>('/Users', payload);
  return data;
}

export async function updateUserFirmRole(payload: {
  id: string;
  firmRole: number;
  secondaryFirmRole?: number | null;
}): Promise<void> {
  await apiClient.put('/Users/FirmRole', {
    id: payload.id,
    firmRole: payload.firmRole,
    secondaryFirmRole: payload.secondaryFirmRole ?? null,
  });
}

export async function deleteUser(id: string): Promise<void> {
  await apiClient.delete('/Users', { data: { id } });
}
