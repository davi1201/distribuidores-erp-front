'use client';

import { Table, Badge, Text, Group, Skeleton, Alert, Paper } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { getProductHistory, MovementType } from '../stock-service';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { IconArrowUp, IconArrowDown, IconInfoCircle } from '@tabler/icons-react';

interface ProductKardexProps {
  productId: string;
}

export function ProductKardex({ productId }: ProductKardexProps) {
  const { data: history = [], isLoading } = useQuery({
    queryKey: ['product-history', productId],
    queryFn: () => getProductHistory(productId),
    enabled: !!productId,
  });

  if (isLoading) {
    return <Skeleton height={200} />;
  }

  if (history.length === 0) {
    return (
      <Alert color="gray" icon={<IconInfoCircle />}>
        Nenhuma movimentação registrada para este produto.
      </Alert>
    );
  }

  return (
    <Paper withBorder radius="sm" style={{ overflow: 'hidden' }}>
      <Table striped highlightOnHover verticalSpacing="sm">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Data</Table.Th>
            <Table.Th>Tipo</Table.Th>
            <Table.Th>Qtd</Table.Th>
            <Table.Th>Motivo</Table.Th>
            <Table.Th>Saldo Após</Table.Th>
            <Table.Th>Usuário</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {history.map((mov) => {
            const isEntry = mov.type === MovementType.ENTRY;
            return (
              <Table.Tr key={mov.id}>
                <Table.Td>
                  <Text size="sm">{format(new Date(mov.createdAt), "dd/MM/yy HH:mm")}</Text>
                </Table.Td>
                <Table.Td>
                  <Badge
                    size="sm"
                    variant="light"
                    color={isEntry ? 'green' : 'red'}
                    leftSection={isEntry ? <IconArrowUp size={10} /> : <IconArrowDown size={10} />}
                  >
                    {isEntry ? 'ENTRADA' : 'SAÍDA'}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" fw={700} c={isEntry ? 'green' : 'red'}>
                    {isEntry ? '+' : '-'}{Number(mov.quantity)}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" lineClamp={1} title={mov.reason}>{mov.reason}</Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" fw={500}>{Number(mov.balanceAfter)}</Text>
                </Table.Td>
                <Table.Td>
                  <Text size="xs" c="dimmed">{mov.user?.name || 'Sistema'}</Text>
                </Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>
    </Paper>
  );
}