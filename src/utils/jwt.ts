import { jwtDecode } from 'jwt-decode';
import type { JwtPayload } from '@/types';

const ROLE_CLAIM_KEYS = [
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
  'role',
  'roles',
] as const;

export function decodeToken(token: string): JwtPayload {
  return jwtDecode<JwtPayload>(token);
}

export function getRolesFromToken(token: string): string[] {
  const payload = decodeToken(token);

  for (const key of ROLE_CLAIM_KEYS) {
    const value = payload[key];
    if (Array.isArray(value)) {
      return value.map(String);
    }
    if (typeof value === 'string' && value.length > 0) {
      return [value];
    }
  }

  return [];
}

export function getUserIdFromToken(token: string): string | null {
  const payload = decodeToken(token);
  const id =
    payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ??
    payload.sub;

  return typeof id === 'string' ? id : null;
}

export function getEmailFromToken(token: string): string | null {
  const payload = decodeToken(token);
  const email =
    payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] ??
    payload.email;

  return typeof email === 'string' ? email : null;
}

export function isTokenExpired(token: string): boolean {
  const payload = decodeToken(token);
  if (typeof payload.exp !== 'number') {
    return false;
  }
  return payload.exp * 1000 < Date.now();
}

export function parseEnabledModules(value?: string | null): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}
