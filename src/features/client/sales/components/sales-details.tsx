import { useState, useMemo, useEffect } from 'react';
import {
  Drawer, Stack, Group, Text, Badge, Divider,
  Avatar, Table, ScrollArea, Grid, Paper, ThemeIcon,
  Button, Modal, Checkbox, Alert, LoadingOverlay
} from '@mantine/core';
import {
  IconUser, IconBox, IconTruckDelivery, IconCheck, IconAlertCircle,
  IconCash
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';

// IMPORTANTE: Importe sua função de API real aqui
import { SaleListItem, OrderStatus } from '../types';
import { formatDocumentNumber } from '@/shared/utils/formatter';
import { approveManualCommission, updateSaleStatus } from '../api/sales.api';

// Helper de Moeda
const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

interface SaleDetailsDrawerProps {
  opened: boolean;
  onClose: () => void;
  sale: SaleListItem | null;
}

export function SaleDetailsDrawer({ opened, onClose, sale }: SaleDetailsDrawerProps) {
  const queryClient = useQueryClient();

  // Estados para a Conferência
  const [conferenceModalOpen, setConferenceModalOpen] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  // Reseta os checks quando o pedido muda
  useEffect(() => {
    if (sale && (sale as any).items) {
      setCheckedItems({});
    }
  }, [sale]);

  // Mutation para atualizar o status
  const statusMutation = useMutation({
    mutationFn: async () => {
      if (!sale) return;
      // Altere 'DISPATCHED' para o próximo status lógico do seu sistema (ex: READY, DELIVERED)
      return updateSaleStatus(sale.id, OrderStatus.COMPLETED);
    },
    onSuccess: () => {
      notifications.show({ message: 'Conferência realizada e pedido atualizado!', color: 'green' });
      queryClient.invalidateQueries({ queryKey: ['sales'] }); // Atualiza a lista de vendas
      setConferenceModalOpen(false);
      onClose();
    },
    onError: () => {
      notifications.show({ message: 'Erro ao atualizar status do pedido', color: 'red' });
    }
  });

  const approveCommissionMutation = useMutation({
    mutationFn: async () => {
      if (!sale) return;

      return approveManualCommission(sale.id);
    },
    onSuccess: () => {
      notifications.show({ message: 'Comissão aprovada com sucesso!', color: 'green' });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
    },
    onError: () => {
      notifications.show({ message: 'Erro ao aprovar comissão', color: 'red' });
    }
  });

  if (!sale) return null;

  const items = (sale as any).items || [];

  // Lógica de Conferência
  const allChecked = items.length > 0 && items.every((item: any) => checkedItems[item.id]);

  const toggleItemCheck = (itemId: string) => {
    setCheckedItems(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const handleConfirmConference = () => {
    if (!allChecked) {
      return notifications.show({ message: 'Você precisa conferir todos os itens antes de finalizar.', color: 'orange' });
    }
    if (confirm('Confirmar separação e atualizar status do pedido?')) {
      statusMutation.mutate();
    }
  };

  // Lógica de Cor do Status
  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.CONFIRMED: return 'green';
      case OrderStatus.DRAFT: return 'yellow';
      case OrderStatus.CANCELED: return 'red';
      case OrderStatus.SEPARATION: return 'blue';
      case OrderStatus.INVOICED: return 'teal'; // Exemplo
      default: return 'gray';
    }
  };

  return (
    <>
      <Drawer
        opened={opened}
        onClose={onClose}
        position="right"
        size="xl"
        title={<Text fw={700} size="lg">Detalhes do Pedido #{sale.code}</Text>}
      >
        <Stack gap="lg" pb="xl" h="calc(100vh - 80px)">
          <ScrollArea h="100%" type="never">
            <Stack gap="lg">
              {/* CABEÇALHO */}
              <Group justify="space-between">
                <Badge size="lg" color={getStatusColor(sale.status)}>{sale.status}</Badge>
                <Text c="dimmed" size="sm">
                  {new Date(sale.createdAt).toLocaleDateString('pt-BR', {
                    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </Text>
              </Group>

              <Divider />

              {/* INFORMAÇÕES GERAIS */}
              <Grid>
                <Grid.Col span={6}>
                  <Group align="flex-start">
                    <ThemeIcon variant="light" color="blue"><IconUser size={18} /></ThemeIcon>
                    <div>
                      <Text size="sm" fw={600} c="dimmed">Cliente</Text>
                      <Text fw={500}>{sale.customer.name}</Text>
                      <Text size="xs" c="dimmed">Doc: {formatDocumentNumber(sale.customer.document) || 'N/A'}</Text>
                    </div>
                  </Group>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Group align="flex-start">
                    <ThemeIcon variant="light" color="violet"><IconBox size={18} /></ThemeIcon>
                    <div>
                      <Text size="sm" fw={600} c="dimmed">Vendedor</Text>
                      <Text fw={500}>{sale.seller?.name || 'Sistema / Loja'}</Text>
                    </div>
                  </Group>
                </Grid.Col>
              </Grid>

              <Paper withBorder p="sm" radius="md">
                <Text fw={600} mb="sm" size="sm">Comissões</Text>
                <Stack gap="xs">
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">Comissão do Vendedor</Text>
                    <Text size="sm">{formatCurrency(sale.commissionRecord.commissionAmount || 0)}</Text>
                  </Group>
                  {parseFloat(sale.commissionRecord.commissionAmount) === 0 &&
                    <>
                      <Text size="xs" c="red">
                        Atenção: Este pedido não gerou comissão para o vendedor.
                      </Text>
                      <Button color='yellow' onClick={() => approveCommissionMutation.mutate()} loading={approveCommissionMutation.isPending}>
                        <IconCash /> Pagar Comissão Manualmente
                      </Button>
                    </>
                  }
                </Stack>
              </Paper>

              {/* LISTA DE PRODUTOS (Visualização) */}
              <Paper withBorder p="sm" radius="md">
                <Text fw={600} mb="sm" size="sm">Itens do Pedido</Text>
                <Table verticalSpacing="xs">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Produto</Table.Th>
                      <Table.Th style={{ textAlign: 'center' }}>Qtd</Table.Th>
                      <Table.Th style={{ textAlign: 'right' }}>Total</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {items.map((item: any) => (
                      <Table.Tr key={item.id}>
                        <Table.Td>
                          <Group gap="sm" wrap="nowrap">
                            <Avatar src={item.product?.images?.[0]?.url} radius="sm" size="sm" />
                            <div style={{ lineHeight: 1 }}>
                              <Text size="sm" fw={500} lineClamp={1}>{item.product?.name}</Text>
                              <Text size="xs" c="dimmed">{item.product?.sku}</Text>
                            </div>
                          </Group>
                        </Table.Td>
                        <Table.Td align="center">{item.quantity}</Table.Td>
                        <Table.Td align="right">{formatCurrency(item.totalPrice)}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Paper>

              {/* TOTAIS FINANCEIROS */}
              <Paper bg="var(--mantine-color-default)" p="md" radius="md">
                <Stack gap="xs">
                  <Group justify="space-between">
                    <Text size="sm">Subtotal</Text>
                    <Text size="sm">{formatCurrency((sale as any).subtotal || sale.total)}</Text>
                  </Group>

                  {(sale as any).discount > 0 && (
                    <Group justify="space-between" c="green">
                      <Text size="sm">Desconto</Text>
                      <Text size="sm">- {formatCurrency((sale as any).discount)}</Text>
                    </Group>
                  )}

                  {(sale as any).shipping > 0 && (
                    <Group justify="space-between">
                      <Group gap={5}>
                        <IconTruckDelivery size={14} />
                        <Text size="sm">Frete</Text>
                      </Group>
                      <Text size="sm">+ {formatCurrency((sale as any).shipping)}</Text>
                    </Group>
                  )}

                  <Divider my="xs" />

                  <Group justify="space-between">
                    <Text fw={700} size="lg">Total</Text>
                    <Text fw={700} size="lg" c="blue">{formatCurrency(sale.total)}</Text>
                  </Group>
                </Stack>
              </Paper>
            </Stack>
          </ScrollArea>

          {/* BOTÃO DE AÇÃO - Só aparece se estiver em Separação */}
          {sale.status === OrderStatus.SEPARATION && (
            <div style={{ position: 'sticky', bottom: 0, paddingTop: 10 }}>
              <Button
                fullWidth
                size="md"
                color="blue"
                onClick={() => setConferenceModalOpen(true)}
                leftSection={<IconCheck size={20} />}
              >
                Realizar Conferência e Finalizar
              </Button>
            </div>
          )}
        </Stack>
      </Drawer>

      {/* MODAL DE CONFERÊNCIA */}
      <Modal
        opened={conferenceModalOpen}
        onClose={() => setConferenceModalOpen(false)}
        title={<Text fw={700}>Conferência de Separação</Text>}
        size="lg"
      >
        <Stack>
          <Alert icon={<IconAlertCircle size={16} />} color="blue" variant="light">
            Verifique fisicamente cada item antes de marcar como conferido.
          </Alert>

          <Paper withBorder p={0} radius="md" style={{ overflow: 'hidden' }}>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ width: 40 }}></Table.Th>
                  <Table.Th>Item</Table.Th>
                  <Table.Th style={{ textAlign: 'center' }}>Qtd</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {items.map((item: any) => {
                  const isChecked = !!checkedItems[item.id];
                  return (
                    <Table.Tr
                      key={item.id}
                      style={{ cursor: 'pointer', backgroundColor: isChecked ? 'var(--mantine-color-green-0)' : undefined }}
                      onClick={() => toggleItemCheck(item.id)}
                    >
                      <Table.Td>
                        <Checkbox
                          checked={isChecked}
                          onChange={() => { }} // Gerenciado pelo onClick da Row
                          style={{ pointerEvents: 'none' }}
                        />
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" fw={500} lineClamp={2}>{item.product?.name}</Text>
                        <Text size="xs" c="dimmed">SKU: {item.product?.sku}</Text>
                      </Table.Td>
                      <Table.Td align="center">
                        <Badge size="lg" variant="outline" color="dark">{item.quantity}</Badge>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </Paper>

          <Group justify="space-between" mt="md">
            <Text size="sm" c="dimmed">
              {Object.values(checkedItems).filter(Boolean).length} de {items.length} itens conferidos
            </Text>
            <Group>
              <Button variant="default" onClick={() => setConferenceModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                color="green"
                onClick={handleConfirmConference}
                disabled={!allChecked}
                loading={statusMutation.isPending}
              >
                Confirmar Separação
              </Button>
            </Group>
          </Group>
        </Stack>
        <LoadingOverlay visible={statusMutation.isPending} />
      </Modal>
    </>
  );
}