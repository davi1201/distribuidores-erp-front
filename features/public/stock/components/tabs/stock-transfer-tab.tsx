'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button, Badge, Group, Tooltip, Text, Flex, Loader, Center } from '@mantine/core';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { ColumnDef } from '@tanstack/react-table';
import { IconCheck, IconTruckDelivery, IconArrowRight } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';

import { DataGrid } from '@/components/ui/data-grid/data-grid';
import { getTransfers, approveTransfer, completeTransfer, StockTransfer } from '../../stock-service';
import { TransferProcessModal } from '../modals/transfer-process-modal';

interface StockTransfersTabProps {
  user: any;
  transferId?: string | null; // Tipagem ajustada para string ou null
}

export function StockTransfersTab({ user, transferId = null }: StockTransfersTabProps) {
  const queryClient = useQueryClient();

  // --- ESTADOS DO MODAL DE PROCESSO ---
  const [processModalOpen, { open: openProcessModal, close: closeProcessModal }] = useDisclosure(false);
  const [selectedTransfer, setSelectedTransfer] = useState<StockTransfer | null>(null);
  const [processMode, setProcessMode] = useState<'APPROVE' | 'COMPLETE'>('APPROVE');

  // Busca transferências com polling para atualizar status em tempo real
  const { data: transfers = [], isLoading } = useQuery({
    queryKey: ['transfers'],
    queryFn: getTransfers,
    refetchInterval: 10000
  });

  // Mutações
  const approveMutation = useMutation({
    mutationFn: approveTransfer,
    onSuccess: () => {
      notifications.show({ message: 'Conferência realizada! Transferência despachada.', color: 'green' });
      handleSuccess();
    },
    onError: (err: any) => notifications.show({ title: 'Erro', message: err.response?.data?.message, color: 'red' })
  });

  const completeMutation = useMutation({
    mutationFn: completeTransfer,
    onSuccess: () => {
      notifications.show({ message: 'Conferência realizada! Estoque atualizado.', color: 'green' });
      handleSuccess();
    },
    onError: (err: any) => notifications.show({ title: 'Erro', message: err.response?.data?.message, color: 'red' })
  });

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['transfers'] });
    queryClient.invalidateQueries({ queryKey: ['stock-products'] });
    closeProcessModal();
    setSelectedTransfer(null);
  }

  // Handler para abrir o modal no modo correto
  const handleOpenProcess = (transfer: StockTransfer, mode: 'APPROVE' | 'COMPLETE') => {
    setSelectedTransfer(transfer);
    setProcessMode(mode);
    openProcessModal();
  };

  // Executa a ação final (chamado pelo botão "Confirmar" do modal)
  const handleConfirmProcess = () => {
    if (!selectedTransfer) return;

    if (processMode === 'APPROVE') {
      approveMutation.mutate(selectedTransfer.id);
    } else {
      completeMutation.mutate(selectedTransfer.id);
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, any> = {
      'PENDING': { color: 'yellow', label: 'Aguardando Aprovação' },
      'APPROVED': { color: 'blue', label: 'Em Separação' },
      'IN_TRANSIT': { color: 'cyan', label: 'Pronto p/ Retirada' },
      'COMPLETED': { color: 'green', label: 'Recebido' },
      'REJECTED': { color: 'red', label: 'Rejeitado' },
    };
    const s = map[status] || { color: 'gray', label: status };
    return <Badge color={s.color} variant="light">{s.label}</Badge>;
  };

  const columns = useMemo<ColumnDef<StockTransfer>[]>(
    () => [
      {
        accessorKey: 'code',
        header: 'Solicitação',
        cell: ({ row }) => (
          <div>
            <Text fw={500}>#{row.original.code}</Text>
            <Text size="xs" c="dimmed">{new Date(row.original.createdAt).toLocaleDateString()} por {row.original.requester?.name}</Text>
          </div>
        )
      },
      {
        id: 'route',
        header: 'Rota',
        cell: ({ row }) => (
          <Flex align="center" gap="xs">
            <Badge variant="dot" color="gray">{row.original.origin?.name}</Badge>
            <IconArrowRight size={14} color="gray" />
            <Badge variant="dot" color="blue">{row.original.destination?.name}</Badge>
          </Flex>
        )
      },
      {
        id: 'items',
        header: 'Itens',
        cell: ({ row }) => (
          <Tooltip label={row.original.items.map(i => `${i.quantity}x ${i.product.name}`).join('\n')} multiline>
            <Text size="sm" style={{ cursor: 'help' }}>{row.original.items.length} produtos</Text>
          </Tooltip>
        )
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => getStatusBadge(row.original.status)
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const t = row.original;
          return (
            <Group gap="xs" justify="flex-end">
              {/* VENDEDOR: Receber (Abre Modal de Check) */}
              {t.status === 'IN_TRANSIT' && (
                <Button
                  size="xs" color="green" leftSection={<IconCheck size={14} />}
                  onClick={() => handleOpenProcess(t, 'COMPLETE')}
                >
                  Conferir & Receber
                </Button>
              )}

              {/* MATRIZ: Aprovar (Abre Modal de Check) */}
              {user?.role !== 'SELLER' && t.status === 'PENDING' && (
                <Button
                  size="xs" color="blue" leftSection={<IconTruckDelivery size={14} />}
                  onClick={() => handleOpenProcess(t, 'APPROVE')}
                >
                  Separar & Aprovar
                </Button>
              )}

              {t.status === 'COMPLETED' && (
                <Button size="xs" variant="subtle" color="gray">Detalhes</Button>
              )}
            </Group>
          );
        }
      }
    ],
    [user]
  );

  // --- EFEITO PARA ABRIR AUTOMATICAMENTE SE VIER DA NOTIFICAÇÃO ---
  useMemo(() => {
    if (transferId && !isLoading && transfers.length > 0) {
      const transfer = transfers.find((t) => t.id === transferId);

      if (transfer) {
        if (transfer.status === 'PENDING') {
          handleOpenProcess(transfer, 'APPROVE');
        } else if (transfer.status === 'IN_TRANSIT') {
          handleOpenProcess(transfer, 'COMPLETE');
        }
      }
    }
  }, [transferId, isLoading, transfers]);

  if (isLoading) return <Center h={200}><Loader color="blue" /></Center>;

  return (
    <>
      <DataGrid data={transfers} columns={columns} />

      {/* MODAL DE CHECKLIST */}
      <TransferProcessModal
        opened={processModalOpen}
        onClose={closeProcessModal}
        transfer={selectedTransfer}
        mode={processMode}
        onConfirm={handleConfirmProcess}
        loading={approveMutation.isPending || completeMutation.isPending}
      />
    </>
  );
}