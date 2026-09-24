import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { apiClient } from '../lib/api/client';

interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  organization: any;
  role: string;
  twoFactorEnabled: boolean;
  avatarUrl: string | null;
}

interface LoginResult {
  requires2FA: boolean;
  tempToken?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  verify2FA: (tempToken: string, code: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
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

  const persistSession = useCallback((accessToken: string, nextRefreshToken: string, userData: AuthUser) => {
    apiClient.setToken(accessToken);
    setToken(accessToken);
    setRefreshToken(nextRefreshToken);
    setUser(userData);
    localStorage.setItem('msgsync_token', accessToken);
    localStorage.setItem('msgsync_refresh_token', nextRefreshToken);
    localStorage.setItem('msgsync_user', JSON.stringify(userData));
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    const result = await apiClient.post<{
      status: string;
      data: { requires2FA?: boolean; tempToken?: string; accessToken?: string; refreshToken?: string; user?: AuthUser };
    }>('/api/auth/login', { email, password });

    if (result.data.requires2FA && result.data.tempToken) {
      return { requires2FA: true, tempToken: result.data.tempToken };
    }

    if (!result.data.accessToken || !result.data.refreshToken || !result.data.user) {
      throw new Error('Login response was incomplete');
    }

    persistSession(result.data.accessToken, result.data.refreshToken, result.data.user);
    return { requires2FA: false };
  }, [persistSession]);

  const verify2FA = useCallback(async (tempToken: string, code: string) => {
    const result = await apiClient.post<{
      status: string;
      data: { accessToken: string; refreshToken: string; user: AuthUser };
    }>('/api/auth/verify-2fa', { temp_token: tempToken, code });
    persistSession(result.data.accessToken, result.data.refreshToken, result.data.user);
  }, [persistSession]);

  const register = useCallback(async (email: string, password: string, name: string) => {
    const result = await apiClient.post<{ status: string; data: { accessToken: string; refreshToken: string; user: AuthUser } }>('/api/auth/register', { email, password, name });
    persistSession(result.data.accessToken, result.data.refreshToken, result.data.user);
  }, [persistSession]);

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

  useEffect(() => {
    if (!token || !refreshToken) return;

    try {
      const encodedPayload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(encodedPayload));
      const expiresAt = Number(payload.exp) * 1000;
      const delay = Math.max(0, expiresAt - Date.now() - 5 * 60 * 1000);
      const timeout = window.setTimeout(() => {
        void refreshSession();
      }, Math.min(delay, 2_147_000_000));

      return () => window.clearTimeout(timeout);
    } catch {
      void refreshSession();
    }
  }, [token, refreshToken, refreshSession]);

  return (
    <AuthContext.Provider value={{ user, token, refreshToken, isAuthenticated, isLoading, login, verify2FA, register, logout, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
};
