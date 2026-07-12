import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { notifyUnauthorized } from '@/api/authSession';
import { ApiError, extractApiErrorMessage } from '@/utils/apiError';
import { STORAGE_KEYS } from '@/types';

function resolveApiBaseUrl(): string {
  const raw = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || 'http://localhost:5278';
  const withoutTrailingSlash = raw.replace(/\/+$/, '');
  // Hem "https://api.sahametrik.com" hem ".../api" kabul et
  return withoutTrailingSlash.endsWith('/api')
    ? withoutTrailingSlash
    : `${withoutTrailingSlash}/api`;
}

export const apiClient = axios.create({
  baseURL: resolveApiBaseUrl(),
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
  (error: AxiosError) => {
    const statusCode = error.response?.status;

    if (statusCode === 401) {
      const detail =
        typeof error.response?.data === 'object' &&
        error.response?.data !== null &&
        'detail' in error.response.data
          ? String((error.response.data as { detail?: string }).detail ?? '')
          : '';
      const shouldLogout =
        detail.toLowerCase().includes('not authenticated') || detail.length === 0;

      if (shouldLogout) {
        localStorage.removeItem(STORAGE_KEYS.accessToken);
        notifyUnauthorized();
      }
    }

    const message = extractApiErrorMessage(error);
    return Promise.reject(new ApiError(message, statusCode));
  },
);

export function getApiErrorMessage(error: unknown): string {
  return extractApiErrorMessage(error);
}
