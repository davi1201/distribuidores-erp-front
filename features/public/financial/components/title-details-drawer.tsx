'use client';

import { Drawer, Stack, Group, Text, Badge, Timeline, ThemeIcon, Paper, Divider, Loader, Center } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { getFinancialTitleById } from '../financial-service';
import { formatCurrency } from '@/utils/formatter';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { IconCash, IconArrowBackUp, IconPercentage } from '@tabler/icons-react';

interface TitleDetailsDrawerProps {
  opened: boolean;
  onClose: () => void;
  titleId: string | null;
}

export function TitleDetailsDrawer({ opened, onClose, titleId }: TitleDetailsDrawerProps) {
  const { data: title, isLoading } = useQuery({
    queryKey: ['financial-title', titleId],
    queryFn: () => getFinancialTitleById(titleId!),
    enabled: !!titleId && opened,
  });

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title={<Text fw={700} size="lg">Extrato do Título</Text>}
      position="right"
      size="md"
    >
      {isLoading || !title ? (
        <Center h={200}><Loader /></Center>
      ) : (
        <Stack>
          <Paper withBorder p="md" bg="var(--mantine-color-default)">
            <Stack gap="xs">
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Nº Título</Text>
                <Text fw={500}>{title.titleNumber}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Cliente</Text>
                <Text fw={500}>{title.customer?.name}</Text>
              </Group>
              <Divider />
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Valor Original</Text>
                <Text fw={500}>{formatCurrency(Number(title.originalAmount))}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Saldo Atual</Text>
                <Text fw={700} c="red">{formatCurrency(Number(title.balance))}</Text>
              </Group>
            </Stack>
          </Paper>

          <Text fw={700} mt="md">Histórico de Movimentações</Text>

          <Timeline active={99} bulletSize={24} lineWidth={2}>
            {title.movements?.map((mov) => (
              <Timeline.Item
                key={mov.id}
                bullet={
                  <ThemeIcon size={22} color={mov.type === 'PAYMENT' ? 'green' : 'blue'} radius="xl">
                    {mov.type === 'PAYMENT' ? <IconCash size={12} /> : <IconArrowBackUp size={12} />}
                  </ThemeIcon>
                }
                title={mov.type === 'PAYMENT' ? 'Pagamento Recebido' : mov.type}
              >
                <Text c="dimmed" size="xs">
                  {format(new Date(mov.paymentDate), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                </Text>
                <Text fw={700} size="sm" mt={4}>
                  {formatCurrency(Number(mov.amount))}
                </Text>
                {mov.observation && (
                  <Text size="xs" mt={4} fs="italic">
                    Obs: {mov.observation}
                  </Text>
                )}
                <Text size="xs" c="dimmed" mt={4}>
                  Por: {mov.user?.name || 'Sistema'}
                </Text>
              </Timeline.Item>
            ))}

            <Timeline.Item title="Título Gerado" bullet={<ThemeIcon size={22} radius="xl" color="gray"><IconPercentage size={12} /></ThemeIcon>}>
              <Text c="dimmed" size="xs">
                {format(new Date(title.issueDate), "dd/MM/yyyy", { locale: ptBR })}
              </Text>
              <Text size="xs" mt={4}>Gerado automaticamente pelo pedido</Text>
            </Timeline.Item>
          </Timeline>
        </Stack>
      )}
    </Drawer>
  );
}