import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { login as loginRequest, register as registerRequest } from '@/api/auth';
import { registerUnauthorizedHandler } from '@/api/authSession';
import { getUserFromAuth } from '@/api/users';
import { canManageUsers, hasClaim, isGlobalAdmin } from '@/config/permissions';
import { STORAGE_KEYS } from '@/types';
import type { AppUser } from '@/types';
import {
  getEmailFromToken,
  getRolesFromToken,
  getUserIdFromToken,
  isTokenExpired,
} from '@/utils/jwt';

interface AuthContextValue {
  token: string | null;
  userId: string | null;
  email: string | null;
  roles: string[];
  profile: AppUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  canManageUsers: boolean;
  hasClaim: (claim: string) => boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(STORAGE_KEYS.accessToken),
  );
  const [profile, setProfile] = useState<AppUser | null>(null);

  useEffect(() => {
    registerUnauthorizedHandler(() => {
      setToken(null);
      setProfile(null);
    });
  }, []);

  useEffect(() => {
    if (token && isTokenExpired(token)) {
      setToken(null);
      setProfile(null);
      localStorage.removeItem(STORAGE_KEYS.accessToken);
    }
  }, [token]);

  const roles = useMemo(() => (token ? getRolesFromToken(token) : []), [token]);
  const userId = useMemo(() => (token ? getUserIdFromToken(token) : null), [token]);
  const email = useMemo(() => (token ? getEmailFromToken(token) : null), [token]);
  const isAdmin = isGlobalAdmin(roles);

  const refreshProfile = useCallback(async () => {
    if (!token) {
      setProfile(null);
      return;
    }

    try {
      const user = await getUserFromAuth();
      setProfile(user);
      if (user.tenantId) {
        localStorage.setItem(STORAGE_KEYS.tenantId, user.tenantId);
      }
    } catch {
      setProfile(null);
    }
  }, [token]);

  useEffect(() => {
    void refreshProfile();
  }, [refreshProfile]);

  const login = useCallback(async (emailValue: string, password: string) => {
    const response = await loginRequest({ email: emailValue, password });
    if (!response.accessToken?.token) {
      throw new Error('Giriş başarısız. Token alınamadı.');
    }

    localStorage.setItem(STORAGE_KEYS.accessToken, response.accessToken.token);
    setToken(response.accessToken.token);
  }, []);

  const register = useCallback(async (emailValue: string, password: string) => {
    const accessToken = await registerRequest({ email: emailValue, password });
    localStorage.setItem(STORAGE_KEYS.accessToken, accessToken.token);
    setToken(accessToken.token);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.accessToken);
    setToken(null);
    setProfile(null);
  }, []);

  const checkClaim = useCallback((claim: string) => hasClaim(roles, claim), [roles]);

  const value = useMemo(
    () => ({
      token,
      userId,
      email,
      roles,
      profile,
      isAuthenticated: Boolean(token),
      isAdmin,
      canManageUsers: canManageUsers(roles),
      hasClaim: checkClaim,
      login,
      register,
      logout,
      refreshProfile,
    }),
    [
      token,
      userId,
      email,
      roles,
      profile,
      isAdmin,
      checkClaim,
      login,
      register,
      logout,
      refreshProfile,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth yalnızca AuthProvider içinde kullanılabilir.');
  }
  return context;
}
