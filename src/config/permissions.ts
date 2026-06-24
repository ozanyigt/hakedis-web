import type { FeatureModuleName } from '@/types';

const MODULE_CLAIM_PREFIXES: Record<FeatureModuleName, string[]> = {
  Metraj: ['MetrajResults', 'MetrajRuleTemplates', 'Drawings'],
  Puantaj: ['PuantajRecords', 'Workers'],
  Hakedis: ['HakedisPeriods', 'ContractItems', 'ProgressEntries'],
};

export function isGlobalAdmin(roles: string[]): boolean {
  return roles.some((role) => role === 'Admin');
}

export function hasClaim(roles: string[], requiredClaim: string): boolean {
  if (isGlobalAdmin(roles)) {
    return true;
  }

  if (roles.includes(requiredClaim)) {
    return true;
  }

  const section = requiredClaim.split('.')[0];
  return roles.includes(`${section}.Admin`);
}

export function hasAnyClaim(roles: string[], claims: string[]): boolean {
  return claims.some((claim) => hasClaim(roles, claim));
}

export function hasModuleClaim(roles: string[], module: FeatureModuleName): boolean {
  if (isGlobalAdmin(roles)) {
    return true;
  }

  const prefixes = MODULE_CLAIM_PREFIXES[module];
  return roles.some((role) => {
    const section = role.split('.')[0];
    return prefixes.includes(section);
  });
}

/** Menü/rotalar: API'nin döndürdüğü modül listesi (abonelik ∩ rol). */
export function canAccessModule(
  enabledModules: FeatureModuleName[],
  module: FeatureModuleName,
  isAdmin: boolean,
): boolean {
  if (isAdmin) {
    return true;
  }

  return enabledModules.includes(module);
}

export function canAccessProjectsPage(roles: string[]): boolean {
  return hasAnyClaim(roles, ['Projects.Admin', 'Sites.Admin']);
}

export function canManageProjects(roles: string[]): boolean {
  return hasClaim(roles, 'Projects.Admin');
}

export function canManageUsers(roles: string[]): boolean {
  return hasClaim(roles, 'Users.Read');
}
