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
import { STORAGE_KEYS } from '@/types';
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
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(STORAGE_KEYS.accessToken),
  );

  useEffect(() => {
    if (token && isTokenExpired(token)) {
      setToken(null);
      localStorage.removeItem(STORAGE_KEYS.accessToken);
    }
  }, [token]);

  const roles = useMemo(() => (token ? getRolesFromToken(token) : []), [token]);
  const userId = useMemo(() => (token ? getUserIdFromToken(token) : null), [token]);
  const email = useMemo(() => (token ? getEmailFromToken(token) : null), [token]);
  const isAdmin = roles.some((role) => role.toLowerCase() === 'admin');

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
  }, []);

  const value = useMemo(
    () => ({
      token,
      userId,
      email,
      roles,
      isAuthenticated: Boolean(token),
      isAdmin,
      login,
      register,
      logout,
    }),
    [token, userId, email, roles, isAdmin, login, register, logout],
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
