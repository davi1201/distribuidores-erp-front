'use client';

import { useMemo, useState } from 'react';
import {
  Group, Text, ActionIcon, Menu, Badge, Button,
  TextInput, Flex, Avatar, Tooltip, Stack, HoverCard,
  Paper
} from '@mantine/core';
import {
  IconDots, IconPencil, IconTrash, IconSearch, IconPlus, IconBox,
  IconAlertTriangle, IconBarcode, IconTags, IconVersions,
  IconEdit,
  IconArrowsExchange,
  IconEye
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { useRouter } from 'next/navigation';

import { getProducts, deleteProduct, Product } from '../product-service';
import { DataGrid } from '@/components/ui/data-grid/data-grid';
import { formatCurrency } from '@/utils/formatter';
import { ProductDetailsModal } from './product-details-modal';
import { useAuthStore } from '@/store/auth/use-auth';

export function ProductList() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailsDrawerOpened, setDetailsDrawerOpened] = useState(false);

  const { user } = useAuthStore();
  const IS_SELLER = user?.role === 'SELLER';


  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      notifications.show({ message: 'Produto excluído', color: 'green' });
    },
    onError: () => {
      notifications.show({ message: 'Erro ao excluir produto', color: 'red' });
    }
  });

  const handleDelete = (id: string) => {
    if (confirm('Deseja realmente excluir este produto?')) {
      deleteMutation.mutate(id);
    }
  };

  const filteredData = useMemo(() => {
    const lower = search.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(lower) ||
        p.sku.toLowerCase().includes(lower) ||
        p.ean?.toLowerCase().includes(lower) ||
        p.brand?.toLowerCase().includes(lower)
    );
  }, [products, search]);

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Produto',
        minSize: 280,
        cell: ({ row }) => {
          const product = row.original;
          const firstImage = product.imagesUrl
          // @ts-ignore
          const isVariant = !!product.parentId;

          return (
            <Group gap="sm" wrap="nowrap">
              <Avatar src={firstImage} radius="sm" size="md" color="blue">
                <IconBox size={20} />
              </Avatar>
              <div>
                <Group gap={6}>
                  {isVariant && <IconVersions size={14} style={{ opacity: 0.5 }} />}
                  <Text size="sm" fw={500} lineClamp={1}>{product.name}</Text>
                </Group>

                <Group gap={6}>
                  {isVariant && (
                    <Badge size="xs" variant="light" color="grape">Variação</Badge>
                  )}
                  <Text size="xs" c="dimmed">SKU: {product.sku}</Text>
                  {product.ean && (
                    <>
                      <Text size="xs" c="dimmed">|</Text>
                      <IconBarcode size={12} color="gray" />
                      <Text size="xs" c="dimmed">{product.ean}</Text>
                    </>
                  )}
                </Group>
              </div>
            </Group>
          );
        },
      },
      {
        accessorKey: 'brand',
        header: 'Marca',
        size: 120,
        cell: ({ getValue }) => {
          const brand = getValue() as string;
          return brand ? (
            <Badge variant="light" color="gray" leftSection={<IconTags size={10} />}>
              {brand}
            </Badge>
          ) : (
            <Text size="xs" c="dimmed">-</Text>
          );
        },
      },
      {
        header: 'Fornecedor Principal',
        id: 'supplier',
        minSize: 200,
        cell: ({ row }) => {
          const supplier = row.original.supplier || null;


          if (!supplier) return <Text size="xs" c="dimmed">Sem fornecedor</Text>;

          return (
            <div>
              <Text size="sm" fw={500} lineClamp={1}>{supplier?.name}</Text>
            </div>
          );
        }
      },
      // {
      //   header: 'Preço Venda',
      //   id: 'sellingPrice',
      //   size: 120,
      //   cell: ({ row }) => {
      //     const prices = row.original.prices || [];
      //     const mainPrice = prices[0]?.price || 0;

      //     if (mainPrice === 0) return <Text size="xs" c="dimmed">Não definido</Text>;

      //     return <Text size="sm" fw={700} c="blue">{formatCurrency(Number(mainPrice))}</Text>;
      //   }
      // },
      {
        header: 'Estoque',
        accessorKey: 'inventory.total',
        size: 140,
        cell: ({ row }) => {
          const totalQty = Number(row.original.inventory.total || 0);
          const hasVariants = (row.original.variants?.length || 0) > 0;

          // @ts-ignore
          const stockItem = Array.isArray(row.original.stock) ? row.original.stock[0] : row.original.stock;
          const min = Number(stockItem?.minStock || 0);
          const isLow = totalQty <= min;
          let color = 'gray';

          if (totalQty <= 0) color = 'red';
          else if (totalQty <= min) color = 'orange';
          else color = 'green';

          // Se tiver variações, usamos HoverCard para mostrar o detalhe
          if (hasVariants) {
            return (
              <HoverCard width={260} shadow="md" withArrow position="right-start" openDelay={200}>
                <HoverCard.Target>
                  <Group
                    gap={6}
                    style={{
                      cursor: 'pointer',
                      width: 'fit-content',
                      padding: '2px 6px',
                      borderRadius: 8,
                      transition: 'background 150ms',
                    }}
                  >
                    <Badge color={color} variant="light" radius="sm" px="xs">
                      {totalQty} UN
                    </Badge>
                    <IconVersions size={14} color="gray" />
                  </Group>
                </HoverCard.Target>

                <HoverCard.Dropdown p="md">
                  <Stack gap="xs">
                    <Text size="xs" fw={700} c="dimmed" mb={4} tt="uppercase" style={{ letterSpacing: 0.5 }}>
                      Grade de Estoque
                    </Text>

                    {row.original.variants?.map((v: any, index: number) => {
                      // @ts-ignore
                      const vStock = Array.isArray(v.stock) ? v.stock[0] : v.stock;

                      return (
                        <Group
                          key={v.id}
                          justify="space-between"
                          py={4}
                          style={{
                            borderBottom:
                              index !== row.original.variants.length - 1
                                ? '1px solid rgba(0, 0, 0, 0.05)'
                                : 'none',
                          }}
                        >
                          <Text size="xs">
                            {v.variantName || v.name}
                          </Text>
                          <Badge size="xs" radius="sm" color="blue" variant="light">
                            {Number(vStock || 0)}
                          </Badge>
                        </Group>
                      );
                    })}
                  </Stack>
                </HoverCard.Dropdown>
              </HoverCard>
            );
          }

          return (
            <Group gap={6}>
              <Badge color={color} variant="light">
                {totalQty} UN
              </Badge>
              {isLow && (
                <Tooltip label="Estoque Baixo">
                  <IconAlertTriangle size={16} color="var(--mantine-color-orange-6)" />
                </Tooltip>
              )}
            </Group>
          );
        }
      },
      {
        accessorKey: 'isActive',
        header: 'Status',
        size: 100,
        cell: ({ getValue }) => (
          getValue()
            ? <Badge color="green" size="sm" variant="dot">Ativo</Badge>
            : <Badge color="gray" size="sm" variant="dot">Inativo</Badge>
        ),
      },
      {
        id: 'actions',
        header: '',
        size: 60,
        cell: ({ row }) => (
          <Group gap={0} justify="flex-end">
            <Button
              size="xs"
              variant="light"
              mr="xs"
              leftSection={<IconEye size={14} />}
              onClick={() => {
                setSelectedProduct(row.original);
                setDetailsDrawerOpened(true);
              }}
            >
              Detalhes
            </Button>
            {IS_SELLER === false && (
              <Menu transitionProps={{ transition: 'pop' }} withArrow position="bottom-end" withinPortal>
                <Menu.Target>
                  <ActionIcon variant="subtle" color="gray">
                    <IconDots style={{ width: '70%', height: '70%' }} stroke={1.5} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item
                    leftSection={<IconEdit size={16} />}
                    onClick={() => router.push(`/registrations/products/${row.original.id}`)}
                  >
                    Editar
                  </Menu.Item>
                  <Menu.Item
                    leftSection={<IconTrash size={16} />}
                    color="red"
                    onClick={() => handleDelete(row.original.id)}
                  >
                    Excluir
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            )}
          </Group>
        ),
      },
    ],
    []
  );


  return (
    <Stack gap="md">
      <Paper p="md" withBorder>
        <Group justify="space-between">
          <TextInput
            placeholder="Buscar por nome, SKU, EAN ou marca..."
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, maxWidth: 400 }}
          />
          {IS_SELLER === false && (
            <Button
              leftSection={<IconPlus size={18} />}
              onClick={() => router.push('/registrations/products/create')}
            >
              Novo Produto
            </Button>
          )}
        </Group>
      </Paper>

      <DataGrid
        data={filteredData}
        columns={columns}
      />

      <ProductDetailsModal
        opened={detailsDrawerOpened}
        onClose={() => setDetailsDrawerOpened(false)}
        // @ts-ignore
        product={selectedProduct}
      />
    </Stack>
  );
}