'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { decodeTokenPayload, isTokenExpired } from '@/lib/jwt';

interface AuthContextType {
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  userId: string | null;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('auth');
    if (token && !isTokenExpired(token)) {
      const payload = decodeTokenPayload(token);
      if (payload?.userId) {
        setIsAuthenticated(true);
        setUserId(payload.userId);
      }
    } else {
      localStorage.removeItem('auth');
    }
    setIsAuthLoading(false);
  }, []);

  const login = (token: string) => {
    const payload = decodeTokenPayload(token);
    if (!payload?.userId) return;
    localStorage.setItem('auth', token);
    setIsAuthenticated(true);
    setUserId(payload.userId);
  };

  const logout = async () => {
    localStorage.removeItem('auth');
    setIsAuthenticated(false);
    setUserId(null);
    // Limpia la cookie HTTP-only del servidor
    await fetch('/api/auth/logout', { method: 'POST' });
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isAuthLoading, userId, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };

