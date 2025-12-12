import { useEffect } from 'react';
import {
  AppNotification,
  useNotificationStore,
} from '@/store/notifications/use-notifications-store';
import { useSocket } from './use-socket';

export function useSocketListener() {
  const socket = useSocket();
  const { addNotification } = useNotificationStore();

  useEffect(() => {
    if (!socket) return;

    // Listener Genérico: Ouve qualquer evento do tipo 'notification' vindo do backend.
    // O backend deve enviar um payload padrão:
    // {
    //   type: 'nfe' | 'stock' | 'system',
    //   title: 'Título',
    //   message: 'Mensagem curta',
    //   link: '/url/para/acao', (opcional)
    //   metadata: { ... } (opcional)
    // }
    const handleNotification = (payload: any) => {
      console.log('🔔 Evento Recebido:', payload);

      // 1. Toca um som discreto (opcional, remova se não quiser áudio)
      const audio = new Audio('/sounds/notification.wav');
      audio.play().catch(() => {});

      // 2. Cria o objeto de notificação padronizado
      const newNotification: AppNotification = {
        id: payload.id || crypto.randomUUID(),
        title: payload.title,
        message: payload.message,
        type: payload.type || 'system', // 'nfe', 'stock', etc.
        timestamp: new Date(),
        read: false,
        actionLink: payload.link,
      };

      // 3. Apenas adiciona ao Store.
      // O componente do Sino (NotificationBell) está observando este store
      // e atualizará o contador (badge vermelho) automaticamente.
      addNotification(newNotification);
    };

    // Registra o ouvinte para o evento unificado 'notification'
    socket.on('notification', handleNotification);

    // Limpeza ao desmontar
    return () => {
      socket.off('notification', handleNotification);
    };
  }, [socket, addNotification]);
}
