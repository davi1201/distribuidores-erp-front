import { useMemo } from 'react';
import { useAuth } from '@clerk/nextjs';
import axios from 'axios';

export function useApiClient() {
  const { getToken } = useAuth();

  const api = useMemo(() => {
    const instance = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL,
    });

    // Interceptor para injetar o Token
    instance.interceptors.request.use(async (config) => {
      // Pega o token JWT do Clerk (válido por 1 min, renova auto)
      const token = await getToken();

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    });

    return instance;
  }, [getToken]);

  return api;
}
