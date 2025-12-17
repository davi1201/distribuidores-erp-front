import { Table, Paper, Text, Badge, Group, ActionIcon } from '@mantine/core';
import { IconArrowRight } from '@tabler/icons-react';
import { formatCurrency } from '@/utils/formatter';
import { format } from 'date-fns';

interface Sale {
  id: string;
  customer: string;
  amount: number;
  status: string;
  date: string;
}

export function RecentSalesTable({ data }: { data: Sale[] }) {
  const rows = data.map((row) => (
    <Table.Tr key={row.id}>
      <Table.Td>
        <Text size="sm" fw={500}>{row.customer}</Text>
        <Text size="xs" c="dimmed">{format(new Date(row.date), 'dd/MM/yy')}</Text>
      </Table.Td>
      <Table.Td>
        <Badge
          size="sm"
          variant="light"
          color={row.status === 'CONFIRMED' ? 'green' : row.status === 'DRAFT' ? 'yellow' : 'gray'}
        >
          {row.status}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Text size="sm" fw={500}>{formatCurrency(row.amount)}</Text>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Paper withBorder p="md" radius="md" shadow="sm" h="100%">
      <Group justify="space-between" mb="md">
        <Text fw={600}>Últimos Pedidos</Text>
        <ActionIcon variant="subtle" color="gray" component="a" href="/backoffice/sales">
          <IconArrowRight size={16} />
        </ActionIcon>
      </Group>

      <Table verticalSpacing="xs">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Cliente</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Valor</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </Paper>
  );
}