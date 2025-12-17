'use client';

import { useState } from 'react';
import {
  TextInput,
  Textarea,
  Select,
  NumberInput,
  Button,
  Group,
  Stack,
  ActionIcon,
  Text,
  Paper,
  Divider,
  Alert,
  Box,
  Badge,
  Switch,
  Tooltip,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
  IconPlus,
  IconTrash,
  IconDeviceFloppy,
  IconAlertTriangle,
  IconCheck,
  IconInfoCircle
} from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '@/shared/hooks/use-api-client';


export function PaymentConditionsForm({
  initialValues,
  onSuccess,
  onCancel,
}: PaymentTermFormProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const api = useApiClient()

  const form = useForm<PaymentTermFormValues>({
    initialValues: initialValues || {
      name: '',
      description: '',
      type: 'RECEIVABLE',
      isFlexible: false, // Padrão: Regras rígidas
      rules: [{ days: 0, percent: 100 }],
    },

    validate: {
      name: (value) =>
        value.trim().length < 3 ? 'Nome deve ter pelo menos 3 caracteres' : null,
      type: (value) => (!value ? 'Selecione um tipo' : null),
      rules: {
        days: (value) => (value < 0 ? 'Dias não podem ser negativos' : null),
        percent: (value) =>
          value <= 0 || value > 100 ? 'Percentual inválido' : null,
      },
    },
  });

  // --- Lógica de Validação de Percentual Total ---
  const totalPercent = form.values.rules.reduce(
    (acc, rule) => acc + (Number(rule.percent) || 0),
    0
  );
  // Aceita pequena margem de erro para ponto flutuante
  const isValidTotal = Math.abs(totalPercent - 100) < 0.1;

  // --- Mutação de Criação ---
  const createMutation = useMutation({
    mutationFn: async (values: PaymentTermFormValues) => {
      await api.post('/payment-terms', values);
    },
    onSuccess: () => {
      notifications.show({
        title: 'Sucesso',
        message: 'Condição de pagamento cadastrada!',
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: ['payment-terms'] });
      onSuccess?.();
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Erro',
        message: error.response?.data?.message || 'Erro ao salvar condição.',
        color: 'red',
      });
    },
    onSettled: () => setIsSubmitting(false),
  });

  const handleSubmit = (values: PaymentTermFormValues) => {
    // Se não for flexível, exigimos 100% exato nas regras
    if (!values.isFlexible && !isValidTotal) {
      notifications.show({
        message: 'A soma das porcentagens deve ser 100% para condições fixas.',
        color: 'orange',
      });
      return;
    }

    setIsSubmitting(true);
    createMutation.mutate(values);
  };

  // --- Helpers de Regras ---
  const addRule = () => {
    const lastRule = form.values.rules[form.values.rules.length - 1];
    const nextDays = lastRule ? lastRule.days + 30 : 30;

    const currentTotal = form.values.rules.reduce((acc, r) => acc + r.percent, 0);
    const remaining = Math.max(0, 100 - currentTotal);

    form.insertListItem('rules', { days: nextDays, percent: remaining > 0 ? remaining : 0 });
  };

  return (
    <Box component="form" onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="md">
        {/* CABEÇALHO DO FORMULÁRIO */}
        <Group align="flex-start" grow>
          <TextInput
            label="Nome da Condição"
            placeholder="Ex: Carteira / A Combinar"
            required
            {...form.getInputProps('name')}
          />
          <Select
            label="Tipo de Operação"
            placeholder="Selecione"
            data={[
              { value: 'RECEIVABLE', label: 'Contas a Receber (Vendas)' },
              { value: 'PAYABLE', label: 'Contas a Pagar (Compras)' },
              { value: 'BOTH', label: 'Ambos' },
            ]}
            allowDeselect={false}
            {...form.getInputProps('type')}
          />
        </Group>

        <Textarea
          label="Descrição Interna"
          placeholder="Detalhes sobre essa condição..."
          rows={2}
          {...form.getInputProps('description')}
        />

        {/* CONTROLE DE FLEXIBILIDADE */}
        <Paper p="sm" bg="blue.0" withBorder style={{ borderColor: 'var(--mantine-color-blue-3)' }}>
          <Group justify="space-between">
            <Group gap="xs">
              <Switch
                label="Modo Flexível (A Combinar)"
                fw={500}
                {...form.getInputProps('isFlexible', { type: 'checkbox' })}
              />
              <Tooltip label="Habilita a edição manual de parcelas e datas no momento da venda/compra. Ideal para negociações 'Carteira'.">
                <IconInfoCircle size={18} style={{ opacity: 0.6 }} />
              </Tooltip>
            </Group>
            {form.values.isFlexible && <Badge color="blue">Editável na Venda</Badge>}
          </Group>
        </Paper>

        <Divider
          label={form.values.isFlexible ? "Sugestão de Parcelamento (Padrão)" : "Regras de Parcelamento (Fixo)"}
          labelPosition="left"
        />

        {/* LISTA DE REGRAS DINÂMICAS */}
        <Paper withBorder p="md" bg="gray.0">
          <Stack>
            {form.values.rules.map((item, index) => (
              <Group key={index} align="flex-start">
                <NumberInput
                  label={index === 0 ? 'Dias (Vencimento)' : undefined}
                  description={index === 0 ? '0 = À Vista / Entrada' : undefined}
                  placeholder="0"
                  min={0}
                  step={15}
                  w={180}
                  required
                  {...form.getInputProps(`rules.${index}.days`)}
                />

                <NumberInput
                  label={index === 0 ? 'Percentual (%)' : undefined}
                  description={index === 0 ? 'Parte do valor total' : undefined}
                  placeholder="100"
                  min={0.01}
                  max={100}
                  decimalScale={2}
                  fixedDecimalScale
                  suffix="%"
                  w={150}
                  required
                  {...form.getInputProps(`rules.${index}.percent`)}
                />

                <ActionIcon
                  color="red"
                  variant="subtle"
                  mt={index === 0 ? 26 : 0}
                  onClick={() => form.removeListItem('rules', index)}
                  disabled={form.values.rules.length === 1}
                >
                  <IconTrash size={18} />
                </ActionIcon>
              </Group>
            ))}

            <Group justify="space-between" mt="xs">
              <Button
                variant="default"
                size="xs"
                leftSection={<IconPlus size={14} />}
                onClick={addRule}
              >
                Adicionar Parcela
              </Button>

              {/* Indicador de Total */}
              <Group gap="xs">
                <Text size="sm" c="dimmed">Total:</Text>
                <Badge
                  color={isValidTotal ? 'green' : 'red'}
                  variant="light"
                  size="lg"
                  leftSection={isValidTotal ? <IconCheck size={14} /> : <IconAlertTriangle size={14} />}
                >
                  {totalPercent.toFixed(2)}%
                </Badge>
              </Group>
            </Group>
          </Stack>
        </Paper>

        {/* FEEDBACK VISUAL RÁPIDO */}
        {!isValidTotal && (
          <Alert variant="light" color={form.values.isFlexible ? "blue" : "red"} title="Atenção" icon={<IconAlertTriangle />}>
            {form.values.isFlexible
              ? `A soma está em ${totalPercent.toFixed(2)}%. Como é flexível, isso será apenas uma sugestão.`
              : `A soma das parcelas deve ser exatamente 100%. Atualmente está em ${totalPercent.toFixed(2)}%.`
            }
          </Alert>
        )}

        <Group justify="flex-end" mt="md">
          {onCancel && (
            <Button variant="default" onClick={onCancel} disabled={isSubmitting}>
              Cancelar
            </Button>
          )}
          <Button
            type="submit"
            color="blue"
            loading={isSubmitting}
            // Se for flexível, permite salvar mesmo sem 100%
            disabled={!form.values.isFlexible && !isValidTotal}
            leftSection={<IconDeviceFloppy size={18} />}
          >
            Salvar Condição
          </Button>
        </Group>
      </Stack>
    </Box>
  );
}