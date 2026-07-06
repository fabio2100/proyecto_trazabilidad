'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function PrivateRouteGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAuthLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      const currentUrl = window.location.pathname + window.location.search;
      router.replace(`/login?redirectTo=${encodeURIComponent(currentUrl)}`);
    }
  }, [isAuthLoading, isAuthenticated, router]);

  if (isAuthLoading || !isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
