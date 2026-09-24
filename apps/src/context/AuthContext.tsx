import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { apiClient } from '../lib/api/client';

interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  organization: any;
  twoFactorEnabled: boolean;
  avatarUrl: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  loginWithSSO: (provider: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!token && !!user;

  const loadSession = useCallback(async () => {
    try {
      const storedToken = localStorage.getItem('msgsync_token');
      const storedRefresh = localStorage.getItem('msgsync_refresh_token');
      const storedUser = localStorage.getItem('msgsync_user');

      if (storedToken && storedUser) {
        apiClient.setToken(storedToken);
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        setRefreshToken(storedRefresh);
      } else {
        const result = await apiClient.getCurrentUser();
        if (result.data) {
          setUser(result.data);
          setIsLoading(false);
        }
      }
    } catch {
      apiClient.setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadSession(); }, [loadSession]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await apiClient.post<{ status: string; data: { accessToken: string; refreshToken: string; user: AuthUser } }>('/api/auth/login', { email, password });
    const { accessToken, refreshToken: rt, user: userData } = result.data;
    apiClient.setToken(accessToken);
    setToken(accessToken);
    setRefreshToken(rt);
    setUser(userData);
    localStorage.setItem('msgsync_token', accessToken);
    localStorage.setItem('msgsync_refresh_token', rt);
    localStorage.setItem('msgsync_user', JSON.stringify(userData));
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    const result = await apiClient.post<{ status: string; data: { accessToken: string; refreshToken: string; user: AuthUser } }>('/api/auth/register', { email, password, name });
    const { accessToken, refreshToken: rt, user: userData } = result.data;
    apiClient.setToken(accessToken);
    setToken(accessToken);
    setRefreshToken(rt);
    setUser(userData);
    localStorage.setItem('msgsync_token', accessToken);
    localStorage.setItem('msgsync_refresh_token', rt);
    localStorage.setItem('msgsync_user', JSON.stringify(userData));
  }, []);

  const logout = useCallback(async () => {
    try { await apiClient.post('/api/auth/logout'); } catch {}
    apiClient.setToken(null);
    setToken(null);
    setRefreshToken(null);
    setUser(null);
    localStorage.removeItem('msgsync_token');
    localStorage.removeItem('msgsync_refresh_token');
    localStorage.removeItem('msgsync_user');
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      if (!refreshToken) return;
      const result = await apiClient.post<{ status: string; data: { accessToken: string; refreshToken: string } }>('/api/auth/refresh', { refreshToken });
      const { accessToken, refreshToken: rt } = result.data;
      apiClient.setToken(accessToken);
      setToken(accessToken);
      setRefreshToken(rt);
      localStorage.setItem('msgsync_token', accessToken);
      localStorage.setItem('msgsync_refresh_token', rt);
    } catch {
      await logout();
    }
  }, [refreshToken, logout]);

  const loginWithSSO = useCallback(async (provider: string) => {
    const result = await apiClient.get<{ status: string; data: { requires2FA: boolean; tempToken?: string; accessToken?: string; refreshToken?: string; user?: AuthUser } }>(`/api/auth/sso/${provider}`);
    const { accessToken, refreshToken: rt, user: userData, requires2FA } = result.data;
    if (requires2FA) {
      setUser({ email: '', name: null, organization: null, twoFactorEnabled: true, id: '', avatarUrl: null });
      return;
    }
    if (accessToken && userData) {
      apiClient.setToken(accessToken);
      setToken(accessToken);
      setRefreshToken(rt || '');
      setUser(userData);
      localStorage.setItem('msgsync_token', accessToken);
      localStorage.setItem('msgsync_refresh_token', rt || '');
      localStorage.setItem('msgsync_user', JSON.stringify(userData));
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, refreshToken, isAuthenticated, isLoading, login, register, logout, refreshSession, loginWithSSO }}>
      {children}
    </AuthContext.Provider>
  );
};
