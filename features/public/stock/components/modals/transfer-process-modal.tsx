'use client';

import { useState, useEffect } from 'react';
import { Modal, Stack, Text, Button, Checkbox, Group, Paper, Divider, Alert, ScrollArea, Avatar, Badge } from '@mantine/core';
import { IconCheck, IconTruckDelivery, IconBox, IconAlertCircle } from '@tabler/icons-react';
import { StockTransfer } from '../../stock-service';

interface TransferProcessModalProps {
  opened: boolean;
  onClose: () => void;
  transfer: StockTransfer | null;
  mode: 'APPROVE' | 'COMPLETE'; // APPROVE = Matriz separando, COMPLETE = Vendedor recebendo
  onConfirm: () => void;
  loading: boolean;
}

export function TransferProcessModal({ opened, onClose, transfer, mode, onConfirm, loading }: TransferProcessModalProps) {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  // Reinicia o estado quando o modal abre ou a transferência muda
  useEffect(() => {
    if (opened && transfer) {
      setCheckedItems({});
    }
  }, [opened, transfer]);

  if (!transfer) return null;

  const handleCheck = (productId: string, checked: boolean) => {
    setCheckedItems((prev) => ({ ...prev, [productId]: checked }));
  };

  const handleCheckAll = () => {
    const all = transfer.items.reduce((acc, item) => {
      // Nota: item.product é um objeto, precisamos acessar o ID dele. 
      // Supondo que o backend retorne item.productId ou item.product.id
      // Ajuste conforme sua interface real. Aqui usaremos item.product.sku como chave única se id não estiver direto no item
      const key = (item as any).productId || item.product.sku;
      acc[key] = true;
      return acc;
    }, {} as Record<string, boolean>);
    setCheckedItems(all);
  };

  // Verifica se todos os itens foram marcados
  const allChecked = transfer.items.every((item) => {
    const key = (item as any).productId || item.product.sku;
    return checkedItems[key];
  });

  const isApprove = mode === 'APPROVE';

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group>
          {isApprove ? <IconTruckDelivery size={22} color="#228be6" /> : <IconCheck size={22} color="#40c057" />}
          <Text fw={700} size="lg">
            {isApprove ? `Conferência de Separação #${transfer.code}` : `Conferência de Recebimento #${transfer.code}`}
          </Text>
        </Group>
      }
      size="lg"
    >
      <Stack gap="md">
        <Alert icon={<IconAlertCircle size={16} />} color={isApprove ? 'blue' : 'green'} variant="light">
          {isApprove
            ? 'Atenção: Confirme que você separou fisicamente cada item abaixo antes de despachar.'
            : 'Atenção: Abra a caixa e confira se todos os produtos chegaram corretamente antes de dar entrada no estoque.'
          }
        </Alert>

        <Group justify="space-between" align="center">
          <Text size="sm" fw={500}>Itens da Transferência ({transfer.items.length})</Text>
          <Button variant="subtle" size="xs" onClick={handleCheckAll}>Marcar Todos</Button>
        </Group>

        <Paper withBorder p={0} h={300} style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <ScrollArea flex={1} p="sm">
            <Stack gap="sm">
              {transfer.items.map((item, idx) => {
                // Garantindo chave única
                const key = (item as any).productId || item.product.sku;
                return (
                  <Paper key={idx} withBorder p="sm" bg={checkedItems[key] ? 'var(--mantine-color-gray-0)' : undefined}>
                    <Checkbox
                      label={
                        <Group align="center" wrap="nowrap">
                          <Avatar color="blue" radius="xl" size="sm"><IconBox size={14} /></Avatar>
                          <div style={{ flex: 1 }}>
                            <Text size="sm" fw={600}>{item.product.name}</Text>
                            <Text size="xs" c="dimmed">SKU: {item.product.sku}</Text>
                          </div>
                          <Badge variant="outline" size="lg" color="gray" ml="auto">
                            {item.quantity} {item.product.unit}
                          </Badge>
                        </Group>
                      }
                      checked={!!checkedItems[key]}
                      onChange={(event) => handleCheck(key, event.currentTarget.checked)}
                      styles={{ body: { alignItems: 'center', width: '100%' }, labelWrapper: { width: '100%' } }}
                    />
                  </Paper>
                );
              })}
            </Stack>
          </ScrollArea>
        </Paper>

        <Divider />

        <Group justify="flex-end">
          <Button variant="default" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button
            color={isApprove ? 'blue' : 'green'}
            onClick={onConfirm}
            loading={loading}
            disabled={!allChecked} // Botão só habilita se tudo estiver checado
          >
            {isApprove ? 'Confirmar Separação & Despachar' : 'Confirmar Recebimento'}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}