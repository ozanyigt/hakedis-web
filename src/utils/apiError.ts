import type { AxiosError } from 'axios';

type ApiErrorBody = {
  message?: string;
  Message?: string;
  title?: string;
  Title?: string;
  detail?: string;
  Detail?: string;
  errorMessage?: string;
  ErrorMessage?: string;
  errors?: Record<string, string[]>;
  Errors?: Record<string, string[]>;
};

export class ApiError extends Error {
  readonly statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

function readValidationMessages(data?: ApiErrorBody): string[] {
  if (!data) {
    return [];
  }

  const errors = data.errors ?? data.Errors;
  if (!errors) {
    return [];
  }

  return Object.values(errors).flat().filter(Boolean);
}

function readPrimaryMessage(data?: ApiErrorBody | string): string | null {
  if (!data) {
    return null;
  }

  if (typeof data === 'string') {
    const trimmed = data.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  const candidates = [
    data.message,
    data.Message,
    data.detail,
    data.Detail,
    data.errorMessage,
    data.ErrorMessage,
    data.title,
    data.Title,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }

  return null;
}

export function extractApiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error && error.message && !error.message.startsWith('Request failed with status code')) {
    return error.message;
  }

  const axiosError = error as AxiosError<ApiErrorBody | string>;
  const statusCode = axiosError.response?.status;
  const data = axiosError.response?.data;

  const validationMessages = readValidationMessages(typeof data === 'object' ? data : undefined);
  if (validationMessages.length > 0) {
    return validationMessages.join(' ');
  }

  const primaryMessage = readPrimaryMessage(data);
  if (primaryMessage) {
    return primaryMessage;
  }

  if (statusCode === 401) {
    return 'Oturumunuz sona erdi. Lütfen tekrar giriş yapın.';
  }

  if (statusCode === 403) {
    return 'Bu işlem için yetkiniz yok.';
  }

  if (statusCode === 404) {
    return 'İstenen kayıt bulunamadı.';
  }

  if (statusCode && statusCode >= 500) {
    return 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.';
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Beklenmeyen bir hata oluştu.';
}
