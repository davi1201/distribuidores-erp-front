'use client';

import { useState } from 'react';
import {
  Tabs, Paper, Table, Checkbox, Button, Group, Badge,
  Text, Modal, Textarea, Avatar, Stack, Alert
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconCheck, IconCash, IconHistory, IconFileText, IconAlertCircle
} from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import api from '@/lib/api';

// --- API CALLS (Pode mover para arquivo separado) ---
const fetchPending = async () => (await api.get('/commissions/admin/pending')).data;
const fetchReadyToPay = async () => (await api.get('/commissions/admin/ready-to-pay')).data; // Agrupado por seller
const fetchHistory = async () => (await api.get('/commissions/admin/payouts')).data;

const approveCommissions = async (ids: string[]) => api.post('/commissions/approve', { ids });
const registerPayout = async (data: any) => api.post('/commissions/payout', data);

export function AdminCommissionManager() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string | null>('approval');

  // --- ABA 1: APROVAÇÃO ---
  const { data: pendingList } = useQuery({ queryKey: ['commissions-pending'], queryFn: fetchPending });
  const [selectedPending, setSelectedPending] = useState<string[]>([]);

  const approveMutation = useMutation({
    mutationFn: approveCommissions,
    onSuccess: () => {
      notifications.show({ message: 'Comissões aprovadas!', color: 'green' });
      queryClient.invalidateQueries({ queryKey: ['commissions-pending'] });
      queryClient.invalidateQueries({ queryKey: ['commissions-ready'] });
      setSelectedPending([]);
    }
  });

  // --- ABA 2: PAGAMENTO ---
  const { data: readyList } = useQuery({ queryKey: ['commissions-ready'], queryFn: fetchReadyToPay });
  const [payoutModalOpened, { open: openPayout, close: closePayout }] = useDisclosure(false);
  const [selectedSellerPay, setSelectedSellerPay] = useState<any>(null);
  const [payoutNotes, setPayoutNotes] = useState('');

  const payoutMutation = useMutation({
    mutationFn: registerPayout,
    onSuccess: () => {
      notifications.show({ message: 'Pagamento registrado no histórico!', color: 'green' });
      queryClient.invalidateQueries({ queryKey: ['commissions-ready'] });
      queryClient.invalidateQueries({ queryKey: ['payouts-history'] });
      closePayout();
    }
  });

  const handleOpenPay = (sellerGroup: any) => {
    setSelectedSellerPay(sellerGroup);
    setPayoutNotes('');
    openPayout();
  };

  const handleConfirmPay = () => {
    if (!selectedSellerPay) return;
    payoutMutation.mutate({
      sellerId: selectedSellerPay.sellerId,
      commissionIds: selectedSellerPay.commissionIds, // Array de IDs vindo do backend
      notes: payoutNotes
    });
  };

  // --- ABA 3: HISTÓRICO ---
  const { data: historyList } = useQuery({ queryKey: ['payouts-history'], queryFn: fetchHistory });

  return (
    <Paper p="md">
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List mb="md">
          <Tabs.Tab value="approval" leftSection={<IconCheck size={16} />}>
            Aprovar Vendas
          </Tabs.Tab>
          <Tabs.Tab value="payment" leftSection={<IconCash size={16} />}>
            Realizar Pagamentos
          </Tabs.Tab>
          <Tabs.Tab value="history" leftSection={<IconHistory size={16} />}>
            Histórico de Pagamentos
          </Tabs.Tab>
        </Tabs.List>

        {/* 1. PAINEL DE APROVAÇÃO */}
        <Tabs.Panel value="approval">
          <Group justify="space-between" mb="md">
            <Text c="dimmed">Selecione as vendas válidas para liberar o saldo ao vendedor.</Text>
            <Button
              color="green"
              disabled={selectedPending.length === 0}
              loading={approveMutation.isPending}
              onClick={() => approveMutation.mutate(selectedPending)}
            >
              Aprovar Selecionados ({selectedPending.length})
            </Button>
          </Group>

          <Table striped withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th w={40}>
                  <Checkbox
                    onChange={() => {
                      if (selectedPending.length === pendingList?.length) setSelectedPending([]);
                      else setSelectedPending(pendingList?.map((c: any) => c.id) || []);
                    }}
                    checked={pendingList?.length > 0 && selectedPending.length === pendingList?.length}
                    indeterminate={selectedPending.length > 0 && selectedPending.length < pendingList?.length}
                  />
                </Table.Th>
                <Table.Th>Data</Table.Th>
                <Table.Th>Vendedor</Table.Th>
                <Table.Th>Venda</Table.Th>
                <Table.Th>Valor Comissão</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {pendingList?.map((item: any) => (
                <Table.Tr key={item.id}>
                  <Table.Td>
                    <Checkbox
                      checked={selectedPending.includes(item.id)}
                      onChange={() => {
                        setSelectedPending(prev =>
                          prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id]
                        );
                      }}
                    />
                  </Table.Td>
                  <Table.Td>{new Date(item.referenceDate).toLocaleDateString()}</Table.Td>
                  <Table.Td>{item.seller.name}</Table.Td>
                  <Table.Td>#{item.order.code}</Table.Td>
                  <Table.Td fw={700} c="yellow.8">
                    R$ {Number(item.commissionAmount).toFixed(2)}
                  </Table.Td>
                </Table.Tr>
              ))}
              {pendingList?.length === 0 && <Table.Tr><Table.Td colSpan={5} align="center">Nada pendente.</Table.Td></Table.Tr>}
            </Table.Tbody>
          </Table>
        </Tabs.Panel>

        {/* 2. PAINEL DE PAGAMENTO (AGRUPADO POR SELLER) */}
        <Tabs.Panel value="payment">
          <Alert icon={<IconAlertCircle size={16} />} title="Atenção" mb="md">
            O pagamento deve ser feito por fora (Banco/PIX). Aqui você apenas registra que pagou para dar baixa no sistema.
          </Alert>

          <Table withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Vendedor</Table.Th>
                <Table.Th>Vendas Aprovadas</Table.Th>
                <Table.Th>Total a Pagar</Table.Th>
                <Table.Th>Ação</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {readyList?.map((group: any) => (
                <Table.Tr key={group.sellerId}>
                  <Table.Td>
                    <Group gap="sm">
                      <Avatar color="blue" radius="xl">{group.sellerName.slice(0, 2)}</Avatar>
                      <Text fw={500}>{group.sellerName}</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td>{group.count} vendas</Table.Td>
                  <Table.Td fw={700} c="green">
                    R$ {Number(group.totalAmount).toFixed(2)}
                  </Table.Td>
                  <Table.Td>
                    <Button size="xs" onClick={() => handleOpenPay(group)}>
                      Registrar Pagamento
                    </Button>
                  </Table.Td>
                </Table.Tr>
              ))}
              {readyList?.length === 0 && <Table.Tr><Table.Td colSpan={4} align="center">Nenhum saldo aprovado para pagar.</Table.Td></Table.Tr>}
            </Table.Tbody>
          </Table>
        </Tabs.Panel>

        {/* 3. PAINEL DE HISTÓRICO */}
        <Tabs.Panel value="history">
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Data Pagto</Table.Th>
                <Table.Th>Vendedor</Table.Th>
                <Table.Th>Vendas Baixadas</Table.Th>
                <Table.Th>Total Pago</Table.Th>
                <Table.Th>Notas</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {historyList?.map((payout: any) => (
                <Table.Tr key={payout.id}>
                  <Table.Td>{new Date(payout.paidAt).toLocaleDateString()} {new Date(payout.paidAt).toLocaleTimeString()}</Table.Td>
                  <Table.Td fw={500}>{payout.seller.name}</Table.Td>
                  <Table.Td>{payout._count.records} vendas</Table.Td>
                  <Table.Td fw={700} c="blue">R$ {Number(payout.totalAmount).toFixed(2)}</Table.Td>
                  <Table.Td style={{ maxWidth: 200 }} >{payout.notes || '-'}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Tabs.Panel>
      </Tabs>

      {/* MODAL DE CONFIRMAÇÃO DE PAGAMENTO */}
      <Modal opened={payoutModalOpened} onClose={closePayout} title="Registrar Pagamento Realizado">
        {selectedSellerPay && (
          <Stack>
            <Text size="sm">
              Você confirma que realizou o pagamento de
              <Text span fw={700} c="green"> R$ {Number(selectedSellerPay.totalAmount).toFixed(2)} </Text>
              para <strong>{selectedSellerPay.sellerName}</strong>?
            </Text>

            <Textarea
              label="Anotações / Comprovante"
              placeholder="Ex: PIX realizado em 19/12 às 14:00. Comprovante XYZ."
              value={payoutNotes}
              onChange={(e) => setPayoutNotes(e.target.value)}
            />

            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={closePayout}>Cancelar</Button>
              <Button
                color="blue"
                onClick={handleConfirmPay}
                loading={payoutMutation.isPending}
                leftSection={<IconFileText size={16} />}
              >
                Confirmar Registro
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Paper>
  );
}