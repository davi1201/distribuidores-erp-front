import React, { memo } from 'react';
import { Paper, Stack, Group, Checkbox, Divider, Select, NumberInput, Alert, Text } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { IconCalendar, IconInfoCircle } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { FinancialConfig, PaymentTerm } from '../../types';
import { usePaymentMethods } from '@/features/client/financial/hooks/use-financial';

interface FinancialSettingsProps {
  config: FinancialConfig;
  onChange: (updates: Partial<FinancialConfig>) => void;
  totalAmount: number;
  paymentTerms: PaymentTerm[];
  isLoadingTerms: boolean;
}

export const FinancialSettings = memo(({
  config,
  onChange,
  totalAmount,
  paymentTerms,
  isLoadingTerms
}: FinancialSettingsProps) => {

  const selectedTerm = paymentTerms?.find(t => t.id === config.paymentTermId);
  const showManualInputs = !selectedTerm || selectedTerm.isFlexible;
  const remainingAmount = Math.max(0, totalAmount - config.entryAmount);

  const { data: methodsData, isLoading: loadingMethods } = usePaymentMethods();

  const installmentValue = showManualInputs && config.installmentsCount > 0
    ? remainingAmount / config.installmentsCount
    : 0;

  return (
    <Paper withBorder p="sm"
      bg={config.generate ? 'var(--mantine-color-green-light)' : 'var(--mantine-color-default)'}
      style={{
        borderColor: config.generate ? 'var(--mantine-color-green-filled)' : 'var(--mantine-color-default-border)',
        transition: 'all 0.2s ease'
      }}
    >
      <Stack gap="xs">
        <Group>
          <Checkbox
            label="Gerar Contas a Pagar Automaticamente"
            checked={config.generate}
            onChange={(e) => onChange({ generate: e.currentTarget.checked })}
            styles={{ label: { fontWeight: 600 } }}
          />
        </Group>

        {config.generate && (
          <>
            <Divider label="Condições de Pagamento" labelPosition="left" />

            <Group align="flex-start" grow>
              <Select
                label="Condição de Pagamento"
                placeholder={isLoadingTerms ? "Carregando..." : "Selecione a condição"}
                data={[
                  { value: '', label: 'Personalizado / Manual' },
                  ...(paymentTerms || []).map(t => ({ value: t.id, label: t.name }))
                ]}
                value={config.paymentTermId || ''}
                onChange={(val) => onChange({ paymentTermId: val === '' ? null : val })}
                allowDeselect={false}
                disabled={isLoadingTerms}
              />

              <Select
                label="Forma de Pagamento"
                data={(methodsData || []).map(m => ({ value: m.id, label: m.name }))}
                value={config.paymentMethod}
                onChange={(v) => onChange({ paymentMethod: v || 'BOLETO' })}
                allowDeselect={false}
              />
            </Group>

            {showManualInputs ? (
              <Group align="flex-end">
                <NumberInput
                  label="Valor de Entrada"
                  leftSection="R$"
                  decimalScale={2} fixedDecimalScale
                  value={config.entryAmount}
                  onChange={(v) => onChange({ entryAmount: Number(v) })}
                  w={160} max={totalAmount}
                />
                <NumberInput
                  label="Parcelas"
                  value={config.installmentsCount}
                  onChange={(v) => onChange({ installmentsCount: Math.max(1, Number(v)) })}
                  min={1} max={60} w={100}
                />
                <DateInput
                  label="1º Vencimento"
                  value={config.firstDueDate}
                  //@ts-ignore
                  onChange={(d) => onChange({ firstDueDate: d })}
                  valueFormat="DD/MM/YYYY"
                  w={160}
                  leftSection={<IconCalendar size={16} />}
                />
                <NumberInput
                  label="Intervalo (Dias)"
                  value={config.daysInterval}
                  onChange={(v) => onChange({ daysInterval: Number(v) })}
                  min={0} w={100}
                />
              </Group>
            ) : (
              <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light" py="xs">
                Regra aplicada: <strong>{selectedTerm?.name}</strong>.
              </Alert>
            )}

            {showManualInputs && (
              <Alert variant="light" color="green" title="Simulação" py="xs">
                <Text size="xs">
                  {config.entryAmount > 0 && `Entrada: R$ ${config.entryAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} + `}
                  {config.installmentsCount}x de R$ {installmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  {' '}(Início: {dayjs(config.firstDueDate).format('DD/MM/YYYY')})
                </Text>
              </Alert>
            )}
          </>
        )}
      </Stack>
    </Paper>
  );
});

FinancialSettings.displayName = 'FinancialSettings';