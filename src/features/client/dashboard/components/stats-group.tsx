import { Group, Paper, SimpleGrid, Text, ThemeIcon } from '@mantine/core';
import {
  IconUserPlus,
  IconDiscount2,
  IconReceipt2,
  IconCoin,
  IconArrowUpRight,
  IconArrowDownRight,
} from '@tabler/icons-react';
import { formatCurrency } from '@/utils/formatter';

interface StatsGroupProps {
  data: {
    revenue: number;
    ordersCount: number;
    customers: number;
    growth: number;
  };
}

export function StatsGroup({ data }: StatsGroupProps) {
  const icons = {
    user: IconUserPlus,
    discount: IconDiscount2,
    receipt: IconReceipt2,
    coin: IconCoin,
  };

  const stats = [
    {
      title: 'Faturamento (Mês)',
      icon: 'coin',
      value: formatCurrency(data.revenue),
      diff: data.growth
    },
    {
      title: 'Novos Pedidos',
      icon: 'receipt',
      value: data.ordersCount,
      diff: 0 // Calcular se quiser
    },
    {
      title: 'Clientes Ativos',
      icon: 'user',
      value: data.customers,
      diff: 0
    },
  ] as const;

  return (
    <SimpleGrid cols={{ base: 1, xs: 2, md: 3 }}>
      {stats.map((stat) => {
        const Icon = icons[stat.icon];
        const DiffIcon = stat.diff > 0 ? IconArrowUpRight : IconArrowDownRight;

        return (
          <Paper withBorder p="md" radius="md" key={stat.title} shadow="sm">
            <Group justify="space-between">
              <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                {stat.title}
              </Text>
              <ThemeIcon color="gray" variant="light">
                <Icon style={{ width: 18, height: 18 }} stroke={1.5} />
              </ThemeIcon>
            </Group>

            <Group align="flex-end" gap="xs" mt={25}>
              <Text fw={700} size="xl">{stat.value}</Text>

              {stat.diff !== 0 && (
                <Text c={stat.diff > 0 ? 'teal' : 'red'} fz="sm" fw={500} style={{ display: 'flex', alignItems: 'center' }}>
                  <span>{stat.diff}%</span>
                  <DiffIcon style={{ width: 16, height: 16 }} stroke={1.5} />
                </Text>
              )}
            </Group>

            <Text fz="xs" c="dimmed" mt={7}>
              Comparado ao mês anterior
            </Text>
          </Paper>
        );
      })}
    </SimpleGrid>
  );
}