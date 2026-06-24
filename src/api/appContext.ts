import { apiClient } from '@/api/client';
import type { AppContext, FeatureModuleName } from '@/types';

const MODULE_ALIASES: Record<string, FeatureModuleName> = {
  metraj: 'Metraj',
  puantaj: 'Puantaj',
  hakedis: 'Hakedis',
  hakediş: 'Hakedis',
};

export async function getAppContext(tenantId?: string): Promise<AppContext> {
  const { data } = await apiClient.get<AppContext>('/Auth/Context', {
    params: tenantId ? { tenantId } : undefined,
  });
  return data;
}

export function normalizeModuleName(value: string): FeatureModuleName | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const alias = MODULE_ALIASES[trimmed.toLowerCase()];
  if (alias) {
    return alias;
  }

  const allowed: FeatureModuleName[] = ['Metraj', 'Puantaj', 'Hakedis'];
  return allowed.find((module) => module === trimmed) ?? null;
}

export function parseAppModules(modules: string[]): FeatureModuleName[] {
  const parsed = modules
    .map((module) => normalizeModuleName(module))
    .filter((module): module is FeatureModuleName => module != null);

  return [...new Set(parsed)];
}
