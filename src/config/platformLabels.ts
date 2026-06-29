import type { FeatureModuleName } from '@/types';

export const SUBSCRIPTION_STATUS_LABELS: Record<number, string> = {
  1: 'Deneme',
  2: 'Aktif',
  3: 'Süresi doldu',
  4: 'İptal',
};

export const DEMO_REQUEST_STATUS_LABELS: Record<number, string> = {
  1: 'Yeni',
  2: 'İletişimde',
  3: 'Dönüştürüldü',
  4: 'Kapatıldı',
};

export const DEMO_INTEREST_LABELS: Record<string, string> = {
  metraj: 'Metraj modülü',
  full: 'Tam paket',
  demo: 'Genel demo',
};

export const BILLING_CYCLE_LABELS: Record<number, string> = {
  1: 'Aylık',
  2: 'Yıllık',
};

export const PLATFORM_MODULES: FeatureModuleName[] = ['Metraj', 'Puantaj', 'Hakedis'];

export function formatEnabledModules(enabledModules: string): string {
  if (!enabledModules.trim()) {
    return '—';
  }
  return enabledModules
    .split(',')
    .map((module) => module.trim())
    .filter(Boolean)
    .join(', ');
}

export function modulesToCsv(modules: string[]): string {
  return modules.join(',');
}

export function parseModulesCsv(enabledModules: string): string[] {
  return enabledModules
    .split(',')
    .map((module) => module.trim())
    .filter(Boolean);
}
