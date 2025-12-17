'use client';

import { Drawer, Stack, Text, Table, Badge, Group, ThemeIcon, Divider, Paper, SimpleGrid, ScrollArea, Flex, Modal } from '@mantine/core';
import { IconTruckDelivery, IconTag, IconPackage, IconBuildingStore, IconMail, IconPhone } from '@tabler/icons-react';
// Certifique-se que este path está correto no seu projeto
import { formatCurrency, formatDocumentNumber, formatPhoneNumber } from '@/utils/formatter';
import { DataGrid } from '@/components/ui/data-grid/data-grid';
import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { useAuthStore } from '@/store/auth/use-auth';


export function ProductDetailsModal({ opened, onClose, product }: ProductDetailsModalProps) {
  if (!product) return null;

  const { user } = useAuthStore();
  const IS_SELLER = user?.role === 'SELLER';

  // Normaliza o custo base
  const baseCost = product.financial?.baseCost ?? Number(product.costPrice ?? 0);

  // Definição das colunas do DataGrid (TanStack Table)
  const columns = useMemo<ColumnDef<Variant>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Variação / SKU',
      cell: ({ row }) => (
        <Stack gap={2}>
          <Text size="sm" fw={600} lh={1.2}>
            {row.original.name}
          </Text>
          <Group gap={4}>
            <Badge size="xs" variant="outline" color="gray">{row.original.sku}</Badge>
          </Group>
        </Stack>
      ),
    },
    {
      id: 'supplier',
      header: 'Fornecedor',
      cell: ({ row }) => {
        const supplier = row.original.supplier;
        if (!supplier) return <Text size="xs" c="dimmed">-</Text>;

        return (
          <Group gap="xs" wrap="nowrap">
            <ThemeIcon variant="light" size="sm" color="indigo">
              <IconTruckDelivery size={12} />
            </ThemeIcon>
            <Stack gap={0} style={{ maxWidth: '100%' }}>
              <Text size="xs" fw={600} lineClamp={1} title={supplier.name}>
                {supplier.name}
              </Text>
            </Stack>
          </Group>
        );
      },
    },
    {
      accessorKey: 'stock',
      header: 'Estoque',
      cell: ({ row }) => (
        <Stack gap={2} align="center">
          <IconPackage size={16} color="gray" />
          <Text size="sm" fw={500}>{row.original.stock}</Text>
        </Stack>
      ),
    },
    {
      id: 'costPrice',
      header: 'Preço custo',
      cell: ({ row }) => {
        const price = row.original.priceSales[0];
        if (!price) {
          return <Text size="xs" c="dimmed" fs="italic">Sem preços</Text>;
        }
        return (
          <Stack gap="xs">

            <Group key={price.listId} justify="space-between" wrap="nowrap" style={{ minWidth: 140 }}>
              <Text size="sm" fw={700} c="yellow.4">
                {formatCurrency(price.priceCost)}
              </Text>
            </Group>

          </Stack>
        );
      },
    },
    {
      id: 'priceSales',
      header: 'Preço venda',
      cell: ({ row }) => {
        const prices = row.original.priceSales;
        if (!prices || prices.length === 0) {
          return <Text size="xs" c="dimmed" fs="italic">Sem preços</Text>;
        }
        return (
          <Stack gap="xs">
            {prices.map((priceItem) => (
              <Group key={priceItem.listId} justify="space-between" wrap="nowrap" style={{ minWidth: 140 }}>
                <Text size="xs" c="dimmed">
                  {priceItem.listName}:
                </Text>
                <Text size="sm" fw={700} c="teal.5">
                  {formatCurrency(priceItem.price)}
                </Text>
              </Group>
            ))}
          </Stack>
        );
      },
    },
  ], []);

  // Cast necessário para satisfazer a tipagem complexa do DataGrid
  const tableColumns = columns as any;

  useMemo(() => {
    if (IS_SELLER) {

      const colsToRemove = ['supplier', 'costPrice'];

      for (const colId of colsToRemove) {
        const index = columns.findIndex(col => col.id === colId);
        if (index !== -1) {
          columns.splice(index, 1);
        }
      }
    }
  }, [user, columns]);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Text fw={700} size="lg" lineClamp={1}>Detalhes: {product.name}</Text>}
      size={IS_SELLER ? 'xl' : 'auto'}
      padding="md"
      centered
    >
      {/* ScrollArea.Autosize é ideal para modais, pois se ajusta ao conteúdo até o limite maxHeight */}
      <ScrollArea.Autosize mah="calc(90vh - 100px)" type="auto" offsetScrollbars>
        <Stack gap="lg" pb="md">

          {/* --- Cabeçalho Resumido --- */}
          {/* <Paper withBorder p="sm" bg="gray.0">
            <SimpleGrid cols={2}>
              <div>
                <Text size="xs" c="dimmed">SKU Principal</Text>
                <Group gap={4}>
                  <IconBox size={14} color="gray" />
                  <Text fw={500} size="sm">{product.sku}</Text>
                </Group>
              </div>
              <div>
                <Text size="xs" c="dimmed">EAN</Text>
                <Group gap={4}>
                  <IconBarcode size={14} color="gray" />
                  <Text fw={500} size="sm">{product.ean || '-'}</Text>
                </Group>
              </div>
              <div>
                <Text size="xs" c="dimmed">Unidade</Text>
                <Text fw={500} size="sm">{product.unit}</Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">Custo Base</Text>
                <Text fw={700} size="sm" c="blue">{formatCurrency(baseCost)}</Text>
              </div>
            </SimpleGrid>
          </Paper> */}

          {/* --- Seção de Variações e Preços de Venda (DataGrid) --- */}
          <Divider
            label={
              <Group gap={5}>
                <IconTag size={16} />
                <Text size="sm" fw={500}>Variações e Preços</Text>
              </Group>
            }
            labelPosition="center"
          />

          <DataGrid
            columns={tableColumns}
            data={product.variants || []}
            totalRows={(product.variants || []).length}
            headerTitle="Nenhuma variação encontrada."
          />

          {/* --- Seção de Fornecedor Principal (Root Product) --- */}
          {IS_SELLER === false &&
            <>
              <Divider label="Fornecedor Principal" labelPosition="center" />
              {product.supplier ? (
                <Paper withBorder p="sm">
                  <Group>
                    <ThemeIcon size="lg" variant="light" color="blue">
                      <IconBuildingStore size={20} />
                    </ThemeIcon>
                    <div style={{ flex: 1 }}>
                      <Text size="sm" fw={600}>{product.supplier.name}</Text>
                      <Text size="xs" c="dimmed">{product.supplier.corporateName}</Text>
                    </div>
                    <Badge variant="light" color="gray">
                      {(typeof formatDocumentNumber === 'function' ? formatDocumentNumber(product.supplier.document || '') : product.supplier.document) || 'S/ Doc'}
                    </Badge>
                  </Group>
                  {(product.supplier.email || product.supplier.phone) && (
                    <Group mt="xs" gap="md">
                      {product.supplier.email && (
                        <Text size="xs" c="dimmed">
                          <Flex align='center' gap={8}>
                            <IconMail size={14} /> {product.supplier.email}
                          </Flex>
                        </Text>
                      )}
                      {product.supplier.phone && (
                        <Text size="xs" c="dimmed">
                          <Flex align='center' gap={8}>
                            <IconPhone size={14} />
                            {typeof formatPhoneNumber === 'function' ? formatPhoneNumber(product.supplier.phone) : product.supplier.phone}
                          </Flex>
                        </Text>
                      )}
                    </Group>
                  )}
                </Paper>
              ) : product.suppliers && product.suppliers.length > 0 ? (
                // Fallback para o caso antigo (lista de suppliers)
                <Table striped highlightOnHover withTableBorder>
                  <Table.Tbody>
                    {product.suppliers.map((s) => (
                      <Table.Tr key={s.id}>
                        <Table.Td>
                          <Group gap="xs">
                            <ThemeIcon variant="light" size="sm" color="blue"><IconTruckDelivery size={12} /></ThemeIcon>
                            <Text size="sm" fw={500}>{s.supplier?.name || s.supplierName}</Text>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              ) : (
                <Stack align="center" py="sm" bg="gray.0" style={{ borderRadius: 8 }}>
                  <IconTruckDelivery size={24} color="gray" style={{ opacity: 0.5 }} />
                  <Text c="dimmed" size="xs">Nenhum fornecedor vinculado ao produto principal.</Text>
                </Stack>
              )}
            </>
          }


        </Stack>
      </ScrollArea.Autosize>
    </Modal>
  );
}