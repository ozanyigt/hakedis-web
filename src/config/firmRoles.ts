import type { FeatureModuleName, FirmRoleValue } from '@/types';

export const FIRM_ROLE_LABELS: Record<number, string> = {
  1: 'Firma Yöneticisi',
  2: 'Şantiye Şefi',
  3: 'Puantör',
  4: 'Metraj Mühendisi',
  5: 'Hakediş / Muhasebe',
  6: 'Sadece Görüntüleme',
};

const MODULE_DISPLAY_NAMES: Record<FeatureModuleName, string> = {
  Metraj: 'Metraj',
  Puantaj: 'Puantaj',
  Hakedis: 'Hakediş',
};

const ALL_MODULES: FeatureModuleName[] = ['Metraj', 'Puantaj', 'Hakedis'];

export function getFirmRoleLabel(value?: number | null): string {
  if (!value) {
    return '-';
  }
  return FIRM_ROLE_LABELS[value] ?? `Rol ${value}`;
}

export function formatModuleNames(modules: FeatureModuleName[]): string {
  return modules.map((module) => MODULE_DISPLAY_NAMES[module]).join(', ');
}

function getModulesForRole(role: FirmRoleValue): FeatureModuleName[] {
  switch (role) {
    case 1:
    case 6:
      return ALL_MODULES;
    case 2:
    case 3:
      return ['Puantaj'];
    case 4:
      return ['Metraj'];
    case 5:
      return ['Hakedis'];
    default:
      return [];
  }
}

export function getRoleModuleNames(
  firmRole?: FirmRoleValue | null,
  secondaryFirmRole?: FirmRoleValue | null,
): FeatureModuleName[] {
  const moduleSet = new Set<FeatureModuleName>();

  if (firmRole) {
    getModulesForRole(firmRole).forEach((module) => moduleSet.add(module));
  }

  if (secondaryFirmRole) {
    getModulesForRole(secondaryFirmRole).forEach((module) => moduleSet.add(module));
  }

  return ALL_MODULES.filter((module) => moduleSet.has(module));
}

export function getActiveModulesMessage(options: {
  enabledModules: FeatureModuleName[];
  firmRole?: FirmRoleValue | null;
  secondaryFirmRole?: FirmRoleValue | null;
  tenantName?: string | null;
  isReady: boolean;
}): string {
  const { enabledModules, firmRole, secondaryFirmRole, tenantName, isReady } = options;

  if (!isReady) {
    return 'Modül bilgisi yükleniyor…';
  }

  if (enabledModules.length > 0) {
    return formatModuleNames(enabledModules);
  }

  const requiredModules = getRoleModuleNames(firmRole, secondaryFirmRole);
  const roleLabel = getFirmRoleLabel(firmRole);

  if (firmRole && requiredModules.length > 0) {
    const requiredLabel = formatModuleNames(requiredModules);
    const tenantPrefix = tenantName ? `${tenantName} kurumunun ` : 'Kurumunuzun ';
    return `${tenantPrefix}abonelik planında ${requiredLabel} modülü bulunmuyor. Rolünüz (${roleLabel}) bu modüle erişim gerektirir; plan güncellenmeden menüde görünmez.`;
  }

  if (tenantName) {
    return `${tenantName} için tanımlı aktif modül yok. Abonelik planınızı kontrol edin.`;
  }

  return 'Tanımlı aktif modül yok. Kurum veya abonelik bilgisi eksik olabilir.';
}
