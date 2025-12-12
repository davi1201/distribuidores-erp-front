'use client';

import { useEffect } from 'react';
import { useSocket } from '@/hooks/use-socket';
import { useNotificationStore, AppNotification } from '@/store/notifications/use-notifications-store';

export function NotificationListener() {
  const socket = useSocket();
  const { addNotification } = useNotificationStore();

  useEffect(() => {
    if (!socket) return;

    // Listener Genérico: Ouve o evento unificado 'notification' do backend
    const handleNotification = (payload: any) => {
      console.log('🔔 Notificação Recebida:', payload);

      // 1. Toca um som discreto (opcional)
      const audio = new Audio('/sounds/notification.wav');
      audio.play().catch(() => { });

      // 2. Monta o objeto de notificação
      const newNotification: AppNotification = {
        id: payload.id || crypto.randomUUID(),
        title: payload.title,
        message: payload.message,
        type: payload.type || 'system', // 'nfe', 'stock', 'order', etc.
        timestamp: new Date(),
        read: false,
        actionLink: payload.link,
        // actionLabel: payload.actionLabel,
        // metadata: payload.metadata
      };

      // 3. Apenas adiciona ao Store
      // O componente NotificationBell (Sininho) observará a mudança e atualizará o contador vermelho.
      addNotification(newNotification);
    };

    socket.on('notification', handleNotification);

    return () => {
      socket.off('notification', handleNotification);
    };
  }, [socket, addNotification]);

  return null; // Componente invisível, apenas lógica
}