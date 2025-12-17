'use client';

import {
  ActionIcon, Indicator, Popover, Text, ScrollArea,
  Stack, Group, ThemeIcon, Button, Box
} from '@mantine/core';
import {
  IconBell, IconFileInvoice, IconBoxSeam, IconAlertTriangle, IconCash, IconCheck, IconInfoCircle
} from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/pt-br';
import { useNotificationStore, AppNotification } from '../../../../store/notifications/use-notifications-store';

// Configuração do Day.js para datas relativas ("há 5 minutos")
dayjs.extend(relativeTime);
dayjs.locale('pt-br');

// Mapa de Ícones por Tipo de Notificação
const ICON_MAP: Record<any, any> = {
  nfe: IconFileInvoice,
  stock: IconBoxSeam,
  system: IconAlertTriangle,
  order: IconBell,
  financial: IconCash,
};

// Mapa de Cores por Tipo
const COLOR_MAP: Record<any, string> = {
  nfe: 'blue',
  stock: 'orange',
  system: 'red',
  order: 'green',
  financial: 'teal',
};

export function NotificationBell() {
  const router = useRouter();
  const { unreadCount, notifications, markAsRead, markAllAsRead } = useNotificationStore();

  const handleClick = (notification: AppNotification) => {
    markAsRead(notification.id);
    if (notification.actionLink) {
      router.push(notification.actionLink);
    }
  };

  return (
    <Popover width={380} position="bottom-end" withArrow shadow="md">
      <Popover.Target>
        <Indicator
          inline
          label={unreadCount > 0 ? unreadCount : null}
          size={16}
          color="red"
          offset={4}
          disabled={unreadCount === 0}
        >
          <ActionIcon variant="subtle" color="gray" size="lg" aria-label="Notificações">
            <IconBell size={20} stroke={1.5} />
          </ActionIcon>
        </Indicator>
      </Popover.Target>

      <Popover.Dropdown p={0}>
        <Stack gap={0}>
          {/* Cabeçalho do Popover */}
          <Group justify="space-between" p="sm" bg="var(--mantine-color-default)" style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
            <Text fw={600} size="sm">Notificações</Text>
            {unreadCount > 0 && (
              <Button
                variant="subtle"
                size="xs"
                onClick={markAllAsRead}
                leftSection={<IconCheck size={12} />}
              >
                Marcar todas como lidas
              </Button>
            )}
          </Group>

          {/* Lista de Notificações */}
          <ScrollArea.Autosize mah={350} type="scroll">
            {notifications.length === 0 ? (
              <Box p="xl" ta="center">
                <ThemeIcon variant="light" color="gray" size="xl" radius="xl" mb="xs">
                  <IconBell size={24} />
                </ThemeIcon>
                <Text c="dimmed" size="sm">Nenhuma notificação recente.</Text>
              </Box>
            ) : (
              notifications.map((item) => {
                const Icon = ICON_MAP[item.type] || IconInfoCircle;
                const color = COLOR_MAP[item.type] || 'blue';

                return (
                  <Box
                    key={item.id}
                    onClick={() => handleClick(item)}
                    p="sm"
                    style={{
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--mantine-color-gray-1)',
                      backgroundColor: item.read ? 'transparent' : 'var(--mantine-color-default)',
                      transition: 'background-color 0.2s ease'
                    }}
                  >
                    <Group align="flex-start" wrap="nowrap">
                      {/* Ícone do Tipo */}
                      <ThemeIcon variant="light" size="md" radius="xl" mt={2} color={color}>
                        <Icon size={16} />
                      </ThemeIcon>

                      {/* Conteúdo */}
                      <div style={{ flex: 1 }}>
                        <Group justify="space-between" align="center" mb={2}>
                          <Text size="sm" fw={item.read ? 400 : 700} lh={1.2}>
                            {item.title}
                          </Text>
                          {/* Bolinha de não lido */}
                          {!item.read && (
                            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--mantine-color-red-6)' }} />
                          )}
                        </Group>

                        <Text size="xs" c="dimmed" lineClamp={2}>
                          {item.message}
                        </Text>

                        <Text size="xs" c="dimmed" mt={4} ta="right" fs="italic">
                          {dayjs(item.timestamp).fromNow()}
                        </Text>
                      </div>
                    </Group>
                  </Box>
                );
              })
            )}
          </ScrollArea.Autosize>
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
}