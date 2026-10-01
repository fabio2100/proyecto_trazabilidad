'use client';

import { createContext, useEffect, useState } from 'react';
import { decodeTokenPayload } from '@/lib/jwt';

interface AuthContextType {
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  userId: string | null;
  userName: string;
  perfilId: number | null;
  perfilTipo: string;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('Usuario');
  const [perfilId, setPerfilId] = useState<number | null>(null);
  const [perfilTipo, setPerfilTipo] = useState<string>('Perfil');

  const validateSession = async () => {
    setIsAuthLoading(true);

    try {
      const res = await fetch('/api/auth/validate', { method: 'GET', credentials: 'include' });
      const data = res.ok
        ? ((await res.json()) as {
            ok: boolean;
            userId?: string;
            userName?: string | null;
            perfilId?: number;
            perfilTipo?: string | null;
          })
        : null;

      if (data?.ok && data.userId) {
        const nextUserName = data.userName?.trim() || 'Usuario';
        const nextPerfilTipo = data.perfilTipo?.trim() || 'Perfil';

        setIsAuthenticated(true);
        setUserId(data.userId);
        setUserName(nextUserName);
        setPerfilId(data.perfilId ?? null);
        setPerfilTipo(nextPerfilTipo);
        return;
      }

      setIsAuthenticated(false);
      setUserId(null);
      setUserName('Usuario');
      setPerfilId(null);
      setPerfilTipo('Perfil');
    } catch {
      setIsAuthenticated(false);
      setUserId(null);
      setUserName('Usuario');
      setPerfilId(null);
      setPerfilTipo('Perfil');
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
    setUserName('Usuario');
    setPerfilId(null);
    setPerfilTipo('Perfil');
    await fetch('/api/auth/logout', { method: 'POST' });
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isAuthLoading, userId, userName, perfilId, perfilTipo, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };

