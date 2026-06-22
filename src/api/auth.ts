import { apiClient } from '@/api/client';
import type { LoginResponse } from '@/types';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export async function login(payload: LoginRequest): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/Auth/Login', payload);
  return data;
}

export async function register(payload: RegisterRequest): Promise<LoginResponse['accessToken']> {
  const { data } = await apiClient.post<LoginResponse['accessToken']>('/Auth/Register', payload);
  return data;
}
