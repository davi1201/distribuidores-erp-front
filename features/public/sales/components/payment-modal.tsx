import { useState } from 'react';
import {
  Modal, Tabs, Button, Group, Text, Stack,
  Alert, ThemeIcon, Divider
} from '@mantine/core';
import {
  IconCreditCard, IconWallet, IconCash, IconCheck
} from '@tabler/icons-react';
import { InstallmentBuilder, Installment } from './installment-builder';
import { formatCurrency } from '@/utils/formatter';

interface PaymentModalProps {
  opened: boolean;
  onClose: () => void;
  totalAmount: number;
  onConfirm: (paymentData: any) => void;
  loading: boolean;
}

export function PaymentModal({ opened, onClose, totalAmount, onConfirm, loading }: PaymentModalProps) {
  const [activeTab, setActiveTab] = useState<string | null>('wallet');
  const [installments, setInstallments] = useState<Installment[]>([]);

  const handleConfirm = () => {
    const payload = {
      method: activeTab, // 'wallet', 'credit_card', 'cash'
      // Se for carteira, manda as parcelas customizadas
      installments: activeTab === 'wallet' ? installments.map(i => ({
        dueDate: i.dueDate,
        amount: i.amount,
        number: i.number
      })) : [],
      // Se for cash, manda 1 parcela à vista
      amount: totalAmount
    };

    onConfirm(payload);
  };

  // Validação para habilitar botão
  const isWalletValid = activeTab === 'wallet'
    ? Math.abs(totalAmount - installments.reduce((a, b) => a + Number(b.amount), 0)) < 0.05
    : true;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Finalizar Venda"
      size="lg"
      centered
    >
      <Stack>
        <Group justify="space-between" bg="blue.0" p="md" style={{ borderRadius: 8 }}>
          <Text fw={600} c="blue.9">Total a Pagar</Text>
          <Text fw={800} size="xl" c="blue.9">{formatCurrency(totalAmount)}</Text>
        </Group>

        <Tabs value={activeTab} onChange={setActiveTab} variant="outline">
          <Tabs.List grow>
            <Tabs.Tab value="wallet" leftSection={<IconWallet size={16} />}>
              Carteira / Crediário
            </Tabs.Tab>
            <Tabs.Tab value="credit_card" leftSection={<IconCreditCard size={16} />}>
              Cartão / Pagar.me
            </Tabs.Tab>
            <Tabs.Tab value="cash" leftSection={<IconCash size={16} />}>
              Dinheiro / Pix
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="wallet" pt="md">
            <Alert variant="light" color="gray" mb="md" title="Acordo com Cliente">
              Configure as datas e valores conforme combinado com o cliente.
              Esses títulos serão gerados no Contas a Receber.
            </Alert>

            <InstallmentBuilder
              totalAmount={totalAmount}
              onChange={setInstallments}
            />
          </Tabs.Panel>

          <Tabs.Panel value="credit_card" pt="md">
            <Stack align="center" py="xl">
              <ThemeIcon size={60} radius="xl" variant="light"><IconCreditCard size={32} /></ThemeIcon>
              <Text ta="center" c="dimmed">
                Integração com Pagar.me (Maquininha ou Link)
                <br />O pagamento será processado externamente.
              </Text>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="cash" pt="md">
            <Stack align="center" py="xl">
              <ThemeIcon size={60} radius="xl" variant="light" color="green"><IconCash size={32} /></ThemeIcon>
              <Text ta="center" c="dimmed">
                Pagamento à Vista (Caixa Local)
                <br />O pedido será baixado imediatamente.
              </Text>
            </Stack>
          </Tabs.Panel>
        </Tabs>

        <Divider mt="md" />

        <Button
          fullWidth
          size="lg"
          color="green"
          loading={loading}
          onClick={handleConfirm}
          disabled={!isWalletValid}
          leftSection={<IconCheck />}
        >
          Confirmar Venda
        </Button>
      </Stack>
    </Modal>
  );
}