'use client';

import {
  Button, Group, Text, Table, ActionIcon, Badge, Tooltip, Alert, ThemeIcon
} from '@mantine/core';
import { UseFormReturnType } from '@mantine/form';
import { IconPlus, IconTrash, IconStar, IconStarFilled, IconInfoCircle, IconTruckDelivery } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { formatCurrency } from '@/utils/formatter';
import { useDisclosure } from '@mantine/hooks';
import { LinkSupplierModal } from '../link-supplier-modal';

export function SuppliersPanel({ form }: { form: UseFormReturnType<any> }) {
  const [modalOpened, { open, close }] = useDisclosure(false);

  // Manipula a adição de um novo vínculo
  const handleAddLink = (data: any) => {
    const currentList = [...form.values.suppliers];
    let shouldUpdateCost = false;

    // Se marcou como principal, desmarca os outros
    if (data.isMain) {
      currentList.forEach(item => item.isMain = false);
      shouldUpdateCost = true;
    }

    // Se é o primeiro da lista, força ser principal
    if (currentList.length === 0) {
      data.isMain = true;
      shouldUpdateCost = true;
    }

    // ATUALIZAÇÃO AUTOMÁTICA DO CUSTO
    if (shouldUpdateCost && Number(data.lastPrice) > 0) {
      form.setFieldValue('costPrice', Number(data.lastPrice));
      notifications.show({
        title: 'Custo Base Atualizado',
        message: `O preço de custo do produto foi atualizado para ${formatCurrency(data.lastPrice)} com base no fornecedor principal.`,
        color: 'blue',
        autoClose: 4000
      });
    }

    form.insertListItem('suppliers', data);
  };

  const handleRemoveLink = (index: number) => {
    form.removeListItem('suppliers', index);
  };

  const handleSetMain = (index: number) => {
    const updatedList = form.values.suppliers.map((item: any, idx: number) => ({
      ...item,
      isMain: idx === index // Só o clicado vira true
    }));
    form.setFieldValue('suppliers', updatedList);

    // Ao trocar o principal, atualiza o custo base do produto
    const newMain = updatedList[index];
    if (newMain && Number(newMain.lastPrice) > 0) {
      form.setFieldValue('costPrice', Number(newMain.lastPrice));
      notifications.show({
        title: 'Custo Base Atualizado',
        message: `O preço de custo foi alterado para ${formatCurrency(newMain.lastPrice)} (Fornecedor: ${newMain.supplierName || 'Selecionado'}). Verifique a aba de Precificação.`,
        color: 'blue',
        autoClose: 4000
      });
    }
  };

  return (
    <>
      <Alert variant="light" color="blue" title="Automação de Compras e Custos" icon={<IconInfoCircle />} mb="lg">
        Defina um <b>Fornecedor Principal</b> (Estrela) para atualizar automaticamente o <b>Preço de Custo</b> do produto.
        Isso recalculará suas margens de venda na aba "Preços".
      </Alert>

      <Group justify="flex-end" mb="md">
        <Button leftSection={<IconPlus size={16} />} variant="light" onClick={open}>
          Vincular Fornecedor
        </Button>
      </Group>

      {form.values.suppliers.length > 0 ? (
        <Table striped highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Principal</Table.Th>
              <Table.Th>Fornecedor</Table.Th>
              <Table.Th>Cód. Fornecedor</Table.Th>
              <Table.Th>Último Custo</Table.Th>
              <Table.Th>Prazo</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {form.values.suppliers.map((item: any, index: number) => (
              <Table.Tr key={index}>
                <Table.Td>
                  <Tooltip label={item.isMain ? "Fornecedor Principal" : "Clique para tornar principal"}>
                    <ActionIcon
                      variant="subtle"
                      color={item.isMain ? 'yellow' : 'gray'}
                      onClick={() => handleSetMain(index)}
                    >
                      {item.isMain ? <IconStarFilled size={18} /> : <IconStar size={18} />}
                    </ActionIcon>
                  </Tooltip>
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <ThemeIcon variant="light" size="sm" color="blue"><IconTruckDelivery size={12} /></ThemeIcon>
                    <Text size="sm" fw={500}>{item.supplier?.name || item.supplierName || 'Fornecedor'}</Text>
                  </Group>
                </Table.Td>
                <Table.Td>
                  {item.supplierProductCode ? (
                    <Badge variant="outline" color="gray">{item.supplierProductCode}</Badge>
                  ) : (
                    <Text size="xs" c="dimmed">-</Text>
                  )}
                </Table.Td>
                <Table.Td>{formatCurrency(item.lastPrice)}</Table.Td>
                <Table.Td>{item.leadTimeDays ? `${item.leadTimeDays} dias` : '-'}</Table.Td>
                <Table.Td>
                  <ActionIcon color="red" variant="subtle" onClick={() => handleRemoveLink(index)}>
                    <IconTrash size={16} />
                  </ActionIcon>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      ) : (
        <Text c="dimmed" fs="italic" ta="center" py="xl" bg="var(--mantine-color-gray-0)" style={{ borderRadius: 8 }}>
          Nenhum fornecedor vinculado a este produto.
        </Text>
      )}

      <LinkSupplierModal
        opened={modalOpened}
        onClose={close}
        onConfirm={handleAddLink}
      />
    </>
  );
}