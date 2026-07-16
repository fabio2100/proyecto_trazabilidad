'use client';

import { createContext, useEffect, useState } from 'react';
import { decodeTokenPayload } from '@/lib/jwt';

interface AuthContextType {
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  userId: string | null;
  perfilId: number | null;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [perfilId, setPerfilId] = useState<number | null>(null);

  const validateSession = async () => {
    setIsAuthLoading(true);

    try {
      const res = await fetch('/api/auth/validate', { method: 'GET', credentials: 'include' });
      const data = res.ok
        ? ((await res.json()) as { ok: boolean; userId?: string; perfilId?: number })
        : null;

      if (data?.ok && data.userId) {
        setIsAuthenticated(true);
        setUserId(data.userId);
        setPerfilId(data.perfilId ?? null);
        return;
      }

      setIsAuthenticated(false);
      setUserId(null);
      setPerfilId(null);
    } catch {
      setIsAuthenticated(false);
      setUserId(null);
      setPerfilId(null);
    } finally {
      setIsAuthLoading(false);
    }
  };

  useEffect(() => {
    void validateSession();
  }, []);

  const login = async (token: string) => {
    const payload = decodeTokenPayload(token);
    if (!payload?.userId) return;

    await validateSession();
  };

  const logout = async () => {
    setIsAuthenticated(false);
    setUserId(null);
    setPerfilId(null);
    await fetch('/api/auth/logout', { method: 'POST' });
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isAuthLoading, userId, perfilId, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };

