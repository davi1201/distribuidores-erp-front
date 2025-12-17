'use client';

import { useEffect } from 'react';
import { Modal, Stack, NumberInput, TextInput, Button, Text, Group, Paper, SimpleGrid, Alert, ThemeIcon } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconInfoCircle, IconArrowDownRight } from '@tabler/icons-react';
import { registerPayment } from '../api/financial.api';
import { formatCurrency } from '@/utils/formatter';
import { PaymentModalProps } from '../types';


export function PaymentRegistrationModal({ opened, onClose, title }: PaymentModalProps) {
  const queryClient = useQueryClient();

  const form = useForm({
    initialValues: {
      amount: 0,
      interest: 0,
      discount: 0,
      paymentDate: new Date(),
      observation: '',
    },
    validate: {
      amount: (val) => (val <= 0 ? 'Valor deve ser maior que zero' : null),
      paymentDate: (val) => (!val ? 'Data obrigatória' : null),
    },
  });

  // Ao abrir, sugere o valor total restante (saldo)
  useEffect(() => {
    if (title && opened) {
      form.setValues({
        amount: Number(title.balance),
        interest: 0,
        discount: 0,
        paymentDate: new Date(),
        observation: '',
      });
    }
  }, [title, opened]);

  const mutation = useMutation({
    mutationFn: async (values: typeof form.values) => {
      if (!title) return;
      return registerPayment({
        titleId: title.id,
        amount: values.amount,
        interest: values.interest,
        discount: values.discount,
        paymentDate: values.paymentDate,
        observation: values.observation,
      });
    },
    onSuccess: (data: any) => {
      // Feedback inteligente baseado no retorno do backend
      const msg = data.creditGenerated > 0
        ? `Pagamento processado! Crédito gerado: ${formatCurrency(data.creditGenerated)}`
        : 'Pagamento registrado com sucesso!';

      notifications.show({ message: msg, color: 'green' });
      queryClient.invalidateQueries({ queryKey: ['financial-titles'] });
      onClose();
    },
    onError: (err: any) => {
      notifications.show({ title: 'Erro', message: err.response?.data?.message, color: 'red' });
    }
  });

  if (!title) return null;

  // Cálculos visuais
  const currentBalance = Number(title.balance);
  const paymentAmount = form.values.amount;

  // Calcula o excedente (Cascata)
  const surplus = Math.max(0, paymentAmount - currentBalance);

  const totalPaid = paymentAmount + (form.values.interest || 0) - (form.values.discount || 0);
  const remainingBalance = Math.max(0, currentBalance - paymentAmount);

  return (
    <Modal opened={opened} onClose={onClose} title={<Text fw={700}>Registrar Pagamento: {title.titleNumber}</Text>} centered>
      <form onSubmit={form.onSubmit((values) => mutation.mutate(values))}>
        <Stack>
          <Paper withBorder p="xs" bg="var(--mantine-color-default)">
            <Group justify="space-between">
              <Text size="sm">Saldo Devedor deste Título:</Text>
              <Text fw={700} c="blue.9">{formatCurrency(currentBalance)}</Text>
            </Group>
          </Paper>

          <SimpleGrid cols={2}>
            <NumberInput
              label="Valor a Pagar (Principal)"
              description="Quanto o cliente entregou"
              prefix="R$ "
              decimalScale={2}
              fixedDecimalScale
              data-autofocus
              required
              // REMOVIDO: max={currentBalance} -> Agora permitimos pagar a mais para cascata
              {...form.getInputProps('amount')}
            />
            <DateInput
              label="Data do Pagamento"
              placeholder="DD/MM/AAAA"
              required
              maxDate={new Date()}
              {...form.getInputProps('paymentDate')}
            />
          </SimpleGrid>

          {/* FEEDBACK DE CASCATA / CRÉDITO */}
          {surplus > 0 && (
            <Alert variant="light" color="orange" title="Pagamento Excedente" icon={<IconInfoCircle />}>
              <Text size="sm">
                O valor excede a dívida deste título em <b>{formatCurrency(surplus)}</b>.
              </Text>
              <Group gap="xs" mt="xs" align="flex-start">
                <ThemeIcon size="xs" color="orange" variant="transparent" mt={2}><IconArrowDownRight /></ThemeIcon>
                <Text size="xs" lh={1.3}>
                  O sistema irá abater este valor automaticamente das <b>próximas parcelas em aberto</b> deste cliente.
                  Se não houver mais débitos, será gerado um <b>crédito</b>.
                </Text>
              </Group>
            </Alert>
          )}

          <SimpleGrid cols={2}>
            <NumberInput
              label="Juros / Multa"
              description="Acréscimo"
              prefix="R$ "
              decimalScale={2}
              fixedDecimalScale
              min={0}
              {...form.getInputProps('interest')}
            />
            <NumberInput
              label="Desconto"
              description="Abatimento"
              prefix="R$ "
              decimalScale={2}
              fixedDecimalScale
              min={0}
              {...form.getInputProps('discount')}
            />
          </SimpleGrid>

          <TextInput
            label="Observação"
            placeholder="Ex: Pix enviado por WhatsApp"
            {...form.getInputProps('observation')}
          />

          {/* RESUMO DA OPERAÇÃO */}
          <Paper withBorder p="sm" bg="var(--mantine-color-default)">
            <Stack gap="xs">
              <Group justify="space-between">
                <Text size="sm">Total Recebido (Caixa):</Text>
                <Text fw={700} c="green">{formatCurrency(totalPaid)}</Text>
              </Group>

              {remainingBalance > 0 ? (
                <Group justify="space-between">
                  <Text size="sm">Saldo Restante (Deste título):</Text>
                  <Text fw={700} c="orange">
                    {formatCurrency(remainingBalance)}
                  </Text>
                </Group>
              ) : (
                <Group justify="space-between">
                  <Text size="sm">Status Final:</Text>
                  <Text fw={700} c="green">LIQUIDADO (PAID)</Text>
                </Group>
              )}
            </Stack>
          </Paper>

          <Button
            type="submit"
            fullWidth
            color="green"
            loading={mutation.isPending}
            leftSection={<IconCheck size={18} />}
          >
            Confirmar Baixa
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}