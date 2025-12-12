'use client';

import { useState } from 'react';
import {
  Paper, Text, Group, Badge, ActionIcon, Tooltip, Button,
  Stack, Code, LoadingOverlay, Alert
} from '@mantine/core';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import {
  IconCheck, IconTrash, IconFileInvoice, IconRefresh,
  IconMail, IconAlertCircle
} from '@tabler/icons-react';
import { getNfeInbox, ignoreNfeInboxItem, processNfeInboxItem, NfeInboxItem, completeInboxImport } from '../nfe-service';
import { DataGrid } from '@/components/ui/data-grid/data-grid';
import { ColumnDef } from '@tanstack/react-table';
import dayjs from 'dayjs';
import { NfeImportModal } from '../../stock/components/modals/nfe-import-modal';


export function NfeInboxList() {
  const queryClient = useQueryClient();

  // Estado para controlar o loading global da ação
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Estado persistente para saber qual nota está sendo importada no modal
  const [activeImportId, setActiveImportId] = useState<string | null>(null);

  // Estados para o Modal de Importação
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importData, setImportData] = useState<any>(null);

  // --- QUERY ---
  const { data: items = [], isLoading, isError } = useQuery({
    queryKey: ['nfe-inbox'],
    queryFn: getNfeInbox,
    refetchInterval: 30000, // Polling a cada 30s
  });

  // --- MUTAÇÃO: IGNORAR ---
  const ignoreMutation = useMutation({
    mutationFn: ignoreNfeInboxItem,
    onSuccess: () => {
      notifications.show({ message: 'Nota ignorada/arquivada.', color: 'gray' });
      queryClient.invalidateQueries({ queryKey: ['nfe-inbox'] });
    },
    onError: () => notifications.show({ message: 'Erro ao ignorar nota.', color: 'red' })
  });

  // --- MUTAÇÃO: CONCLUIR (Atualizar status na inbox) ---
  const updateMutation = useMutation({
    mutationFn: completeInboxImport,
    onSuccess: () => {
      // Opcional: notifications.show({ message: 'Status da nota atualizado.', color: 'green' });
      queryClient.invalidateQueries({ queryKey: ['nfe-inbox'] });
      // Limpa estado após conclusão total
      setActiveImportId(null);
    },
    onError: () => notifications.show({ message: 'Erro ao finalizar status da nota.', color: 'red' })
  });

  // --- AÇÃO: IMPORTAR ---
  const handleImport = async (item: NfeInboxItem) => {
    setProcessingId(item.id);
    setActiveImportId(item.id); // Salva ID para usar no callback de sucesso

    try {
      // 1. Chama o backend para parsear o XML salvo
      const parsedData = await processNfeInboxItem(item.id);

      // 2. Abre o Modal com os dados carregados
      setImportData(parsedData);
      setImportModalOpen(true);

    } catch (error: any) {
      setActiveImportId(null); // Limpa se der erro ao abrir
      notifications.show({
        title: 'Erro no Processamento',
        message: error.response?.data?.message || 'Falha ao ler o XML.',
        color: 'red'
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleCloseImport = () => {
    setImportModalOpen(false);
    setImportData(null);
    // Se fechou sem sucesso (cancelou), limpamos o ID ativo
    if (!updateMutation.isPending) {
      setActiveImportId(null);
    }
  };

  // --- DEFINIÇÃO DAS COLUNAS ---
  const columns: ColumnDef<NfeInboxItem>[] = [
    {
      accessorKey: 'receivedAt',
      header: 'Recebido em',
      cell: ({ getValue }) => (
        <Text size="sm">{dayjs(getValue() as string).format('DD/MM/YYYY HH:mm')}</Text>
      ),
    },
    {
      accessorKey: 'senderEmail',
      header: 'Enviado por',
      cell: ({ getValue }) => (
        <Group gap="xs">
          <IconMail size={14} color="gray" />
          <Text size="sm">{getValue() as string}</Text>
        </Group>
      ),
    },
    {
      accessorKey: 'accessKey',
      header: 'Chave de Acesso',
      cell: ({ getValue }) => {
        const key = getValue() as string;
        // Formata visualmente: 3523 1234 ...
        const formatted = key ? key.replace(/(\d{4})(?=\d)/g, '$1 ') : 'Sem Chave';
        return (
          <Tooltip label={key} withArrow>
            <Code color="blue.1" c="blue.9" style={{ whiteSpace: 'nowrap' }}>
              {formatted.substring(0, 24)}...
            </Code>
          </Tooltip>
        );
      },
    },
    {
      id: 'status',
      header: 'Status',
      cell: () => <Badge color="yellow" variant="light">Pendente</Badge>
    },
    {
      id: 'actions',
      header: 'Ações',
      cell: ({ row }) => {
        const item = row.original;
        const isProcessing = processingId === item.id;

        return (
          <Group gap="xs">
            <Tooltip label="Importar Nota">
              <ActionIcon
                color="green"
                variant="light"
                size="lg"
                loading={isProcessing}
                onClick={() => handleImport(item)}
              >
                <IconCheck size={18} />
              </ActionIcon>
            </Tooltip>

            <Tooltip label="Ignorar/Arquivar">
              <ActionIcon
                color="gray"
                variant="subtle"
                size="lg"
                onClick={() => {
                  if (confirm('Tem certeza que deseja ignorar esta nota?')) {
                    ignoreMutation.mutate(item.id);
                  }
                }}
              >
                <IconTrash size={18} />
              </ActionIcon>
            </Tooltip>
          </Group>
        );
      }
    }
  ];

  if (isError) {
    return <Alert color="red" icon={<IconAlertCircle />}>Erro ao carregar inbox.</Alert>;
  }

  return (
    <>
      <Stack>
        <Group justify="space-between">
          <div>
            <Text size="lg" fw={700}>Caixa de Entrada de Notas</Text>
            <Text size="sm" c="dimmed">Notas fiscais recebidas por e-mail aguardando importação.</Text>
          </div>
          <Button
            variant="default"
            leftSection={<IconRefresh size={16} />}
            onClick={() => queryClient.invalidateQueries({ queryKey: ['nfe-inbox'] })}
            loading={isLoading}
          >
            Atualizar
          </Button>
        </Group>

        <Paper withBorder p={0} radius="md" style={{ overflow: 'hidden' }}>
          <LoadingOverlay visible={isLoading && !items.length} />

          {items.length === 0 && !isLoading ? (
            <Stack align="center" py={50} c="dimmed">
              <IconFileInvoice size={48} stroke={1.5} />
              <Text>Nenhuma nota pendente encontrada.</Text>
              <Text size="xs">Configure o e-mail do sistema e peça para seus fornecedores enviarem o XML.</Text>
            </Stack>
          ) : (
            <DataGrid
              data={items}
              columns={columns}
            />
          )}
        </Paper>
      </Stack>

      {/* Modal de Importação com dados pré-carregados */}
      <NfeImportModal
        opened={importModalOpen}
        onClose={handleCloseImport}
        initialData={importData}
        onImportSuccess={() => {
          // Callback chamado pelo modal quando a importação termina com sucesso
          if (activeImportId) {
            updateMutation.mutate(activeImportId);
          }
        }}
      />
    </>
  );
}