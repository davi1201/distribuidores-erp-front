'use client';

import { useEffect, useLayoutEffect } from 'react';
import { useAuthStore } from '../store/auth/use-auth';
import { useAuth } from '@clerk/nextjs';
import { registerTokenProvider } from '@/lib/api';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  const { getToken } = useAuth();

  // useLayoutEffect roda antes da pintura da tela, garantindo que o token
  // esteja registrado antes de qualquer useEffect que faça chamadas API.
  useLayoutEffect(() => {
    registerTokenProvider(async () => {
      // getToken() do Clerk gerencia cache e refresh automaticamente
      return await getToken();
    });
  }, [getToken]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return <>{children}</>;
}