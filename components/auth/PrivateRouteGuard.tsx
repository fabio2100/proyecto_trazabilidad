'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function PrivateRouteGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAuthLoading, logout } = useAuth();
  const router = useRouter();
  const [isSessionValid, setIsSessionValid] = useState<boolean | null>(null);

  useEffect(() => {
    if (isAuthLoading) return;

    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    // Verify the session cookie is still valid on the server
    fetch('/api/auth/validate', { method: 'GET', credentials: 'include' })
      .then((res) => {
        if (res.status === 401) {
          // Cookie is missing or tampered — clear local state and redirect
          logout().finally(() => {
            router.replace('/login');
          });
        } else {
          setIsSessionValid(true);
        }
      })
      .catch(() => {
        // Network error — let through; server-side middleware still protects
        setIsSessionValid(true);
      });
  }, [isAuthLoading, isAuthenticated, logout, router]);

  if (isAuthLoading || isSessionValid === null) {
    return null;
  }

  if (!isAuthenticated || !isSessionValid) {
    return null;
  }

  return <>{children}</>;
}
