import { useState } from 'react';
import { Paper, Title, Group, Text, Divider, Button, Stack, NumberInput } from '@mantine/core';
import { useMutation } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { useDisclosure } from '@mantine/hooks';
import { IconArrowRight, IconCheck } from '@tabler/icons-react';

import api from '@/lib/api';
import { formatCurrency } from '@/utils/formatter';
import { useCartStore } from '../stores/use-cart-store';
import { PaymentModal } from './payment-modal';

interface PaymentModalData {
  paymentTermId?: string | null;
  paymentMethod?: string | null;
  installmentsPlan?: any[]; // Plano manual (opcional)
  totalAmount: number;
}

export function OrderSummary() {
  const { items, customerId, priceListId, getSubtotal, getTotal, clearCart } = useCartStore();

  // Estados locais de valores extras
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [shipping, setShipping] = useState(0);

  // Controle do Modal de Pagamento
  const [isPaymentModalOpen, { open: openPayment, close: closePayment }] = useDisclosure(false);

  const subtotal = getSubtotal();
  // Total Final = Total dos Itens (já com desc. unitário) - Desconto Global + Frete
  const total = getTotal() - globalDiscount + shipping;

  const createOrderMutation = useMutation({
    mutationFn: async (paymentData: PaymentModalData) => {
      // Validações de segurança antes do envio
      if (!customerId) throw new Error('Cliente não selecionado.');
      if (!priceListId) throw new Error('Tabela de preço não selecionada.');
      if (items.length === 0) throw new Error('O carrinho está vazio.');

      const payload = {
        customerId,
        priceListId,
        shipping,
        discount: globalDiscount,

        // --- NOVOS CAMPOS FINANCEIROS ---
        // Envia exatamente o que o PaymentModal preparou e o Backend espera
        paymentMethod: paymentData.paymentMethod, // Ex: 'BOLETO', 'PIX'
        paymentTermId: paymentData.paymentTermId, // ID da condição (se fixa)
        installmentsPlan: paymentData.installmentsPlan, // Array manual (se flexível)

        // Mapeia itens do carrinho
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          discount: i.discount || 0,
        })),
      };

      const { data } = await api.post('/sales', payload);
      return data;
    },
    onSuccess: () => {
      notifications.show({ message: 'Venda realizada com sucesso!', color: 'green' });
      clearCart();
      setGlobalDiscount(0);
      setShipping(0);
      closePayment();
      // Opcional: Redirecionar para a lista de pedidos ou detalhes do pedido criado
    },
    onError: (err: any) => {
      notifications.show({
        title: 'Erro ao finalizar',
        message: err.response?.data?.message || 'Falha ao criar pedido',
        color: 'red'
      });
    }
  });

  // Handler para confirmar no modal
  const handleConfirmPayment = (paymentData: any) => {
    createOrderMutation.mutate(paymentData);
  };

  const isCartEmpty = items.length === 0;
  const isMissingData = !customerId || !priceListId;

  return (
    <>
      <Paper withBorder p="md" radius="md" bg="var(--mantine-color-default)">
        <Title order={4} mb="md">Resumo do Pedido</Title>

        <Stack gap="xs">
          <Group justify="space-between">
            <Text size="sm" c="dimmed">Subtotal ({items.length} itens)</Text>
            <Text size="sm">{formatCurrency(subtotal)}</Text>
          </Group>

          <Group justify="space-between">
            <Text size="sm" c="dimmed">Desconto Extra (R$)</Text>
            <NumberInput
              prefix="R$ "
              value={globalDiscount}
              onChange={(v) => setGlobalDiscount(Number(v))}
              size="xs"
              w={110}
              min={0}
              max={subtotal} // Não pode dar desconto maior que o valor
              allowNegative={false}
            />
          </Group>

          <Group justify="space-between">
            <Text size="sm" c="dimmed">Frete (R$)</Text>
            <NumberInput
              prefix="R$ "
              value={shipping}
              onChange={(v) => setShipping(Number(v))}
              size="xs"
              w={110}
              min={0}
              allowNegative={false}
            />
          </Group>

          <Divider my="sm" />

          <Group justify="space-between">
            <Text size="lg" fw={700}>Total</Text>
            <Text size="xl" fw={800} c="blue">{formatCurrency(total)}</Text>
          </Group>

          <Button
            fullWidth
            mt="md"
            size="lg"
            leftSection={<IconArrowRight />}
            onClick={openPayment}
            disabled={isCartEmpty || isMissingData}
          >
            Avançar para Pagamento
          </Button>

          {isMissingData && !isCartEmpty && (
            <Text size="xs" c="red" ta="center">
              Selecione um cliente e uma tabela de preço para continuar.
            </Text>
          )}
        </Stack>
      </Paper>

      {/* MODAL DE PAGAMENTO (Orquestrador Financeiro) */}
      <PaymentModal
        opened={isPaymentModalOpen}
        onClose={closePayment}
        totalAmount={total}
        loading={createOrderMutation.isPending}
        onConfirm={handleConfirmPayment}
      />
    </>
  );
}