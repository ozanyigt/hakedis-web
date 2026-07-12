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

    if (statusCode === 401 && shouldLogoutOnUnauthorized(error.response?.data)) {
      localStorage.removeItem(STORAGE_KEYS.accessToken);
      notifyUnauthorized();
    }

    const message = extractApiErrorMessage(error);
    return Promise.reject(new ApiError(message, statusCode));
  },
);

/** Yetki yok (authorization) ≠ oturum yok (authentication). Sadece oturum sorununda çıkış yap. */
function shouldLogoutOnUnauthorized(data: unknown): boolean {
  const text = collectAuthMessage(data).toLowerCase();

  // Claim eksik / rol yetersiz → sayfada hata göster, oturumu kırma
  if (text.includes('not authorized') || text.includes('yetkiniz yok')) {
    return false;
  }

  // Gerçek oturum kaybı
  if (
    text.includes('not authenticated') ||
    text.includes('unauthenticated') ||
    text.includes('token') ||
    text.includes('expired')
  ) {
    return true;
  }

  // JWT middleware genelde boş/minimal 401 döner
  return text.length === 0;
}

function collectAuthMessage(data: unknown): string {
  if (!data) {
    return '';
  }

  if (typeof data === 'string') {
    return data;
  }

  if (typeof data !== 'object') {
    return '';
  }

  const body = data as Record<string, unknown>;
  const parts = [body.detail, body.Detail, body.message, body.Message, body.title, body.Title]
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .map((value) => value.trim());

  return parts.join(' ');
}

export function getApiErrorMessage(error: unknown): string {
  return extractApiErrorMessage(error);
}
