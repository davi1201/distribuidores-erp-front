import { create } from 'zustand';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'nfe' | 'info' | 'error';
  timestamp: Date;
  read: boolean;
  actionLink?: string; // Para redirecionar ao clicar
  data?: any; // Dados extras (ex: objeto da nota)
}

interface NotificationState {
  unreadCount: number;
  notifications: AppNotification[];

  // Actions
  setUnreadCount: (count: number) => void;
  addNotification: (notification: AppNotification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,
  notifications: [],

  setUnreadCount: (count) => set({ unreadCount: count }),

  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    })),

  markAsRead: (id) =>
    set((state) => {
      const newNotifications = state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
      // Recalcula contagem baseada apenas no array local é impreciso se houver paginação,
      // mas para UX imediata funciona. O ideal é decrementar.
      return {
        notifications: newNotifications,
        unreadCount: Math.max(0, state.unreadCount - 1),
      };
    }),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),
}));
