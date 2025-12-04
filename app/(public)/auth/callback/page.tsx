// app/auth/callback/page.tsx (se usar Next App Router)
'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader, Center, Text } from '@mantine/core';

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');

    if (token) {
      // 1. Salva o token (Cookies ou LocalStorage)
      localStorage.setItem('access_token', token);

      // 2. Redireciona para o dashboard
      router.push('/dashboard');
    } else {
      // Erro, volta pro login
      router.push('/login?error=google_auth_failed');
    }
  }, [searchParams, router]);

  return (
    <Center h="100vh">
      <Loader size="xl" />
      <Text ml="md">Autenticando...</Text>
    </Center>
  );
}