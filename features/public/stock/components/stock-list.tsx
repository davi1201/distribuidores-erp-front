'use client';

import { useMemo, useState } from 'react';
import { Paper, Group, Text, Button, Stack, Tabs } from '@mantine/core';
import {
  IconBox, IconTruckDelivery, IconPackageImport,
  IconArrowsExchange, IconPlus,
  IconFileCode
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/store/auth/use-auth';
import { getWarehouses } from '../stock-service';


import { TransferRequestModal } from './modals/transfer-request-modal';
import { WarehouseFormModal } from './modals/warehouse-form-modal';
import { StockBalanceTab } from './tabs/stock-balance-tab';
import { StockTransfersTab } from './tabs/stock-transfer-tab';
import { NfeImportModal } from './modals/nfe-import-modal';
import { useRouter } from 'next/router';
import { useSearchParams } from 'next/navigation';


export function StockList() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [importModalOpen, { open: openImport, close: closeImport }] = useDisclosure(false);
  const searchParams = useSearchParams()

  const [activeTab, setActiveTab] = useState<string | null>('balance');

  const [warehouseModalOpen, { open: openWarehouse, close: closeWarehouse }] = useDisclosure(false);
  const [transferModalOpen, { open: openTransferModal, close: closeTransferModal }] = useDisclosure(false);

  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: getWarehouses
  });

  useMemo(() => {
    if (searchParams.get('transferId')) {
      setActiveTab('transfers')
    }
  }, [searchParams])

  return (
    <Stack gap="lg">
      {/* --- CABEÇALHO DA PÁGINA --- */}
      <Paper p="md" withBorder bg="var(--mantine-color-default)">
        <Group justify="space-between" align="center">
          <div>
            <Text fw={700} size="lg">Gestão de Estoque</Text>
            <Text c="dimmed" size="sm">Controle de saldos e transferências</Text>
          </div>

          <Group>
            <Button leftSection={<IconFileCode size={18} />} variant="default" onClick={openImport}>
              Importar XML
            </Button>
            {/* Lógica de Botões baseada no Perfil */}
            {user?.role === 'SELLER' ? (
              <Button leftSection={<IconPackageImport size={18} />} onClick={openTransferModal}>
                Solicitar Reposição
              </Button>
            ) : (
              <Button variant="default" leftSection={<IconArrowsExchange size={18} />} onClick={openTransferModal}>
                Nova Transferência
              </Button>
            )}

            {user?.role !== 'SELLER' && (
              <Button variant="default" leftSection={<IconPlus size={18} />} onClick={openWarehouse}>
                Novo Depósito
              </Button>
            )}
          </Group>
        </Group>
      </Paper>

      {/* --- ABAS DE CONTEÚDO --- */}
      <Tabs value={activeTab} onChange={setActiveTab} variant="outline" radius="md">
        <Tabs.List>
          <Tabs.Tab value="balance" leftSection={<IconBox size={16} />}>
            Saldos e Produtos
          </Tabs.Tab>
          <Tabs.Tab value="transfers" leftSection={<IconTruckDelivery size={16} />}>
            Transferências e Pedidos
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="balance" pt="md">
          {/* Componente isolado de Saldos */}
          <StockBalanceTab user={user} warehouses={warehouses} />
        </Tabs.Panel>

        <Tabs.Panel value="transfers" pt="md">
          {/* Componente isolado de Transferências */}
          <StockTransfersTab user={user} transferId={searchParams.get('transferId')} />
        </Tabs.Panel>
      </Tabs>

      {/* --- MODAIS GLOBAIS --- */}

      {/* Modal de Criar Depósito (Apenas Admin/Owner) */}
      <WarehouseFormModal
        opened={warehouseModalOpen}
        onClose={closeWarehouse}
      />

      {/* Modal de Solicitação de Transferência (Carrinho) */}
      <TransferRequestModal
        opened={transferModalOpen}
        onClose={closeTransferModal}
        warehouses={warehouses}
        user={user}
        onSuccess={() => {
          // Ao criar uma transferência, atualiza a lista e muda para a aba de transferências
          queryClient.invalidateQueries({ queryKey: ['transfers'] });
          setActiveTab('transfers');
        }}
      />
      <NfeImportModal opened={importModalOpen} onClose={closeImport} />
    </Stack>
  );
}