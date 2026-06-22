import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { STORAGE_KEYS } from '@/types';

const baseURL = import.meta.env.VITE_API_BASE_URL ?? '/api';

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem(STORAGE_KEYS.accessToken);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{
    message?: string;
    title?: string;
    errorMessage?: string;
    errors?: Record<string, string[]>;
  }>) => {
    const validationMessages = error.response?.data?.errors
      ? Object.values(error.response.data.errors).flat()
      : [];

    const message =
      validationMessages.join(' ') ||
      error.response?.data?.errorMessage ||
      error.response?.data?.message ||
      error.response?.data?.title ||
      error.message ||
      'Beklenmeyen bir hata oluştu.';

    if (error.response?.status === 401) {
      localStorage.removeItem(STORAGE_KEYS.accessToken);
    }

    return Promise.reject(new Error(message));
  },
);

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Beklenmeyen bir hata oluştu.';
}
