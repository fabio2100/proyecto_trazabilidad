'use client';

import { createContext, useEffect, useState } from 'react';
import { decodeTokenPayload } from '@/lib/jwt';

interface AuthContextType {
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  userId: string | null;
  perfilId: number | null;
  login: (token: string) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [perfilId, setPerfilId] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/auth/validate', { method: 'GET', credentials: 'include' })
      .then((res) => {
        if (res.ok) return res.json() as Promise<{ ok: boolean; userId: string; perfilId: number }>;
        return null;
      })
      .then((data) => {
        if (data?.ok && data.userId) {
          setIsAuthenticated(true);
          setUserId(data.userId);
          setPerfilId(data.perfilId);
        }
      })
      .catch(() => {
        // Network error — treat as unauthenticated
      })
      .finally(() => setIsAuthLoading(false));
  }, []);

  const login = (token: string) => {
    const payload = decodeTokenPayload(token);
    if (!payload?.userId) return;
    setIsAuthenticated(true);
    setUserId(payload.userId);
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

