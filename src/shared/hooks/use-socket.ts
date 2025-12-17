import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../../../store/auth/use-auth';

// Ajuste a URL base se necessário. Geralmente é a mesma da API sem o /api
const SOCKET_URL = 'http://localhost:5555';

console.log(SOCKET_URL);

export const useSocket = () => {
  const { user } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Só conecta se tiver usuário logado e tenantId
    if (!user?.tenantId) return;

    // 1. Conecta no Namespace '/notifications'
    socketRef.current = io(`${SOCKET_URL}/notifications`, {
      withCredentials: true,
      transports: ['websocket'], // Força websocket para evitar polling
    });

    const socket = socketRef.current;

    // 2. Eventos de Conexão
    socket.on('connect', () => {
      console.log('🔌 Socket conectado:', socket.id);

      // 3. Entra na sala do Tenant para receber mensagens privadas da empresa
      if (user) {
        socket.emit('joinTenantRoom', {
          tenantId: user.tenantId,
          role: user.role,
          userId: user.id,
        });
      }
    });

    socket.on('connect_error', (err) => {
      console.error('Socket Connection Error:', err);
    });

    // Cleanup ao desmontar (logout)
    return () => {
      if (socket) {
        console.log('🔌 Desconectando socket...');
        socket.disconnect();
      }
    };
  }, [user?.tenantId]);

  return socketRef.current;
};
