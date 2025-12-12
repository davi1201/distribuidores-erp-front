import { useState } from 'react';
import { SimpleGrid, NumberInput, Alert, Button, Group, Text, Divider, Stack } from '@mantine/core';
import { UseFormReturnType } from '@mantine/form';
import { IconInfoCircle, IconExchange, IconArrowRight } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import Link from 'next/link';
import { ProductKardex } from '@/features/public/stock/components/product-kardex';
import { StockMovementModal } from '@/features/public/stock/components/modals/stock-movement-modal';

interface StockPanelProps {
  form: UseFormReturnType<any>;
  productId?: string;
  productName?: string;
  product?: any;
}

export function StockPanel({ form, productId, productName, product }: StockPanelProps) {
  const [modalOpened, { open, close }] = useDisclosure(false);
  const isEditing = !!productId;

  return (
    <>
      <SimpleGrid cols={3} mb="xl">
        <NumberInput
          label="Saldo Atual"
          min={0}
          decimalScale={3}
          // BLOQUEIO: O saldo não pode ser editado diretamente no update
          disabled={isEditing}
          description={isEditing ? "Gerenciado via movimentações (Kardex)" : "Saldo inicial"}
          {...form.getInputProps('stock.quantity')}
        />

        <NumberInput
          label="Estoque Mínimo"
          description="Alerta de reposição"
          min={0}
          {...form.getInputProps('stock.minStock')}
        />

        <NumberInput
          label="Estoque Máximo"
          description="Teto para compras"
          min={0}
          {...form.getInputProps('stock.maxStock')}
        />
      </SimpleGrid>

      {isEditing ? (
        <Stack gap="md">
          {/* AVISO EDUCATIVO E AÇÕES */}
          <Alert variant="light" color="orange" title="Gestão de Estoque" icon={<IconInfoCircle />}>
            <Text size="sm" mb="xs">
              Por questões de segurança e rastreabilidade, o saldo não pode ser alterado manualmente.
              Qualquer mudança deve ser registrada como uma entrada ou saída.
            </Text>
            <Group mt="sm">
              <Button
                variant="white"
                color="orange"
                size="xs"
                leftSection={<IconExchange size={14} />}
                onClick={open}
              >
                Novo Ajuste / Movimentação
              </Button>
              <Button
                component={Link}
                href="/registrations/stock"
                variant="subtle"
                color="orange"
                size="xs"
                rightSection={<IconArrowRight size={14} />}
              >
                Ir para Módulo de Estoque
              </Button>
            </Group>
          </Alert>

          <Divider label="Histórico Recente" labelPosition="center" />

          <ProductKardex productId={productId} />

          <StockMovementModal
            opened={modalOpened}
            onClose={close}
            // Garante compatibilidade passando um objeto mínimo se 'product' for undefined
            product={product || { id: productId, name: productName, variants: [] }}
          />
        </Stack>
      ) : (
        <Alert variant="light" color="blue" title="Estoque Inicial" icon={<IconInfoCircle />}>
          Defina o saldo inicial para começar. Movimentações futuras serão registradas no histórico automaticamente.
        </Alert>
      )}
    </>
  );
}