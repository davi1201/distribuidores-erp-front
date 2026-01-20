'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image'; // 1. Importar Next Image
import {
  Group, Text, ActionIcon, Menu, Badge, Button,
  TextInput, Avatar, Tooltip, Stack, HoverCard,
  Paper, Modal, Center, Box,
  Select,
  Flex
} from '@mantine/core';
import {
  IconDots, IconTrash, IconSearch, IconPlus, IconBox,
  IconAlertTriangle, IconBarcode, IconTags, IconVersions,
  IconEdit, IconEye, IconFileCode, IconPhotoOff
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { useRouter } from 'next/navigation';

import { getProducts, deleteProduct } from '../api/product.api';
import { DataGrid } from '@/components/ui/data-grid/data-grid';
import { ProductDetailsModal } from './product-details-modal';
import { useAuthStore } from '@/store/auth/use-auth';
import { NfeImportModal } from '../../nfe/components/nfe-import-modal';
import { getPriceLists } from '../../price-lists/api/price-lists.api';

// Componente auxiliar para renderizar a imagem com otimização e interações
const ProductImageCell = ({ src, name, onClick }: { src?: string | null, name: string, onClick: (src: string) => void }) => {
  if (!src) {
    return (
      <Avatar radius="sm" size="md" color="blue">
        <IconBox size={20} />
      </Avatar>
    );
  }

  return (
    <HoverCard width={220} shadow="md" withArrow openDelay={200} position="right">
      <HoverCard.Target>
        <Box
          onClick={(e) => {
            e.stopPropagation(); // Evita conflitos com clique na linha se houver
            onClick(src);
          }}
          style={{
            position: 'relative',
            width: 38,
            height: 38,
            cursor: 'zoom-in',
            borderRadius: '4px',
            overflow: 'hidden',
            border: '1px solid #e5e7eb'
          }}
        >
          {/* Imagem Thumbnail Otimizada */}
          <Image
            src={src}
            alt={`Thumb ${name}`}
            fill
            sizes="40px"
            style={{ objectFit: 'cover' }}
          />
        </Box>
      </HoverCard.Target>
      <HoverCard.Dropdown p="xs">
        <Stack gap="xs" align="center">
          <Text size="xs" c="dimmed">Clique para ampliar</Text>
          <Box style={{ position: 'relative', width: 200, height: 200, borderRadius: '4px', overflow: 'hidden' }}>
            {/* Imagem Hover Otimizada */}
            <Image
              src={src}
              alt={`Preview ${name}`}
              fill
              sizes="200px"
              style={{ objectFit: 'contain', backgroundColor: '#f8f9fa' }}
            />
          </Box>
        </Stack>
      </HoverCard.Dropdown>
    </HoverCard>
  );
};

export function ProductList() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [priceListSelected, setPriceListSelected] = useState<string | null>(null);

  // Estados para modais
  const [detailsDrawerOpened, setDetailsDrawerOpened] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);

  // Estado para visualização da imagem
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const openImport = () => setImportModalOpen(true);
  const closeImport = () => setImportModalOpen(false);

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

  const { data: priceLists = [] } = useQuery({
    queryKey: ['price-lists'],
    queryFn: async () => {
      const data = await getPriceLists();
      setPriceListSelected(data[0]?.id || null);
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const handleDelete = (id: string) => {
    if (confirm('Deseja realmente excluir este produto?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseImportModal = () => {
    closeImport();
    queryClient.invalidateQueries({ queryKey: ['products'] });
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
          const firstImage = product.imageUrl; // Assumindo que imageUrl é a string da URL
          // @ts-ignore
          const isVariant = !!product.parentId;

          return (
            <Group gap="sm" wrap="nowrap">
              {/* Uso do componente customizado de imagem */}
              <ProductImageCell
                src={firstImage}
                name={product.name}
                onClick={(src) => setPreviewImage(src)}
              />

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
        accessorKey: 'prices',
        header: 'Preço de Venda',
        size: 140,
        cell: ({ getValue }) => {
          // Pega o array de preços ou um array vazio para evitar erros
          const prices = (getValue() as any[]) || [];

          // Busca o preço compatível com a tabela selecionada
          const priceObj = prices.find((p: any) => p.listId === priceListSelected);

          // Valor a ser exibido
          const priceValue = priceObj ? Number(priceObj.price) : 0;

          return (
            <Text size="sm" fw={500}>
              {priceObj
                ? priceValue.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })
                : <Text span c="dimmed" size="xs">Sem preço</Text> // Fallback visual
              }
            </Text>
          );
        },
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
                    onClick={() => router.push(`/catalog/products/${row.original.id}`)}
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
    [priceListSelected, IS_SELLER, router]
  );


  return (
    <Stack gap="md">
      <Paper p="md" withBorder>

        <Group justify="space-between">
          <Flex gap="md" wrap="wrap" align="end" style={{ flex: 1 }}>
            <Select
              label="Tabelas de Preço"
              data={priceLists.map((pl) => ({ value: pl.id, label: pl.name }))}
              value={priceListSelected}
              onChange={setPriceListSelected}
              placeholder="Filtrar por tabela de preço"
              searchable
              style={{ width: 300 }}
            />
            <TextInput
              placeholder="Buscar por nome, SKU, EAN ou marca..."
              leftSection={<IconSearch size={16} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1, maxWidth: 400 }}
            />
          </Flex>
          {IS_SELLER === false && (
            <Group>
              <Button
                leftSection={<IconPlus size={18} />}
                onClick={() => router.push('/catalog/products/create')}
              >
                Novo Produto
              </Button>

              <Button leftSection={<IconFileCode size={18} />} variant="default" onClick={openImport}>
                Importar produtos
              </Button>
            </Group>
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

      <NfeImportModal opened={importModalOpen} onClose={handleCloseImportModal} />

      {/* Modal para Visualização da Imagem em Tamanho Grande */}
      <Modal
        opened={!!previewImage}
        onClose={() => setPreviewImage(null)}
        size="lg" // ou 'auto' / 'xl'
        centered
        withCloseButton
        title="Visualização do Produto"
      >
        <Center p="md" style={{ minHeight: 300 }}>
          {previewImage && (
            <Box style={{ position: 'relative', width: '100%', height: '500px' }}>
              <Image
                src={previewImage}
                alt="Produto ampliado"
                fill
                sizes="100vw"
                style={{ objectFit: 'contain' }}
                priority // Carrega com prioridade pois é um modal
              />
            </Box>
          )}
        </Center>
      </Modal>
    </Stack>
  );
}