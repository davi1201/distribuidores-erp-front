import { useState, useEffect } from 'react';
import {
  Group, NumberInput, ActionIcon, Text, Stack, Button,
  SimpleGrid, Paper, Alert, ThemeIcon
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { IconTrash, IconPlus, IconAlertCircle, IconCalendar } from '@tabler/icons-react';
import { addDays } from 'date-fns';
import { formatCurrency } from '@/utils/formatter';

export interface Installment {
  id: string;
  number: number;
  dueDate: Date | null;
  amount: number;
  observation?: string;
}

interface InstallmentBuilderProps {
  totalAmount: number;
  onChange: (installments: Installment[]) => void;
}

export function InstallmentBuilder({ totalAmount, onChange }: InstallmentBuilderProps) {
  const [installments, setInstallments] = useState<Installment[]>([]);

  // Inicializa com 1 parcela à vista (30 dias)
  useEffect(() => {
    if (installments.length === 0) {
      generateSuggestion(1);
    }
  }, [totalAmount]);

  // Gera sugestão padrão (30/60/90...)
  const generateSuggestion = (count: number) => {
    const baseValue = Math.floor((totalAmount / count) * 100) / 100;
    const remainder = totalAmount - (baseValue * count);

    const newInstallments: Installment[] = Array.from({ length: count }).map((_, index) => ({
      id: Math.random().toString(36).substr(2, 9),
      number: index + 1,
      dueDate: addDays(new Date(), (index + 1) * 30), // Padrão 30 dias
      // Adiciona o centavo que sobra na primeira parcela
      amount: index === 0 ? baseValue + remainder : baseValue
    }));

    setInstallments(newInstallments);
    onChange(newInstallments);
  };

  const updateInstallment = (id: string, field: keyof Installment, value: any) => {
    const updated = installments.map(inst =>
      inst.id === id ? { ...inst, [field]: value } : inst
    );
    setInstallments(updated);
    onChange(updated);
  };

  const addInstallment = () => {
    const lastDate = installments[installments.length - 1]?.dueDate || new Date();
    const newInst: Installment = {
      id: Math.random().toString(36).substr(2, 9),
      number: installments.length + 1,
      dueDate: addDays(new Date(lastDate), 30),
      amount: 0
    };
    const updated = [...installments, newInst];
    setInstallments(updated);
    onChange(updated);
  };

  const removeInstallment = (id: string) => {
    const updated = installments.filter(i => i.id !== id).map((i, idx) => ({
      ...i,
      number: idx + 1 // Renumera
    }));
    setInstallments(updated);
    onChange(updated);
  };

  // Validação de Soma
  const currentSum = installments.reduce((acc, i) => acc + Number(i.amount), 0);
  const difference = totalAmount - currentSum;
  const isValid = Math.abs(difference) < 0.05; // Margem de erro de centavos

  return (
    <Stack>
      <Group justify="space-between" align="center">
        <Text fw={600} size="sm">Simulação de Parcelas</Text>
        <Group gap="xs">
          <Button variant="default" size="xs" onClick={() => generateSuggestion(1)}>1x</Button>
          <Button variant="default" size="xs" onClick={() => generateSuggestion(3)}>3x</Button>
          <Button variant="default" size="xs" onClick={() => generateSuggestion(6)}>6x</Button>
        </Group>
      </Group>

      <Paper withBorder p="sm" bg="var(--mantine-color-default)">
        <Stack gap="xs">
          {installments.map((inst, index) => (
            <SimpleGrid cols={12} key={inst.id} spacing="xs" style={{ alignItems: 'center' }}>
              <div style={{ gridColumn: 'span 1' }}>
                <Text size="xs" ta="center" fw={700}>{inst.number}x</Text>
              </div>

              <div style={{ gridColumn: 'span 5' }}>
                <DateInput
                  value={inst.dueDate}
                  onChange={(date) => updateInstallment(inst.id, 'dueDate', date)}
                  placeholder="Vencimento"
                  valueFormat="DD/MM/YYYY"
                  size="xs"
                  popoverProps={{ withinPortal: true }}
                />
              </div>

              <div style={{ gridColumn: 'span 5' }}>
                <NumberInput
                  value={inst.amount}
                  onChange={(val) => updateInstallment(inst.id, 'amount', val)}
                  decimalScale={2}
                  fixedDecimalScale
                  prefix="R$ "
                  size="xs"
                />
              </div>

              <div style={{ gridColumn: 'span 1' }}>
                <ActionIcon
                  color="red"
                  variant="subtle"
                  size="sm"
                  onClick={() => removeInstallment(inst.id)}
                  disabled={installments.length === 1}
                >
                  <IconTrash size={14} />
                </ActionIcon>
              </div>
            </SimpleGrid>
          ))}
        </Stack>

        <Button
          fullWidth
          variant="subtle"
          size="xs"
          mt="sm"
          leftSection={<IconPlus size={14} />}
          onClick={addInstallment}
        >
          Adicionar Parcela Manual
        </Button>
      </Paper>

      {!isValid && (
        <Alert color="red" variant="light" icon={<IconAlertCircle size={16} />} py="xs">
          <Text size="xs">
            A soma das parcelas ({formatCurrency(currentSum)}) difere do total ({formatCurrency(totalAmount)}).
            Diferença: <b>{formatCurrency(difference)}</b>
          </Text>
        </Alert>
      )}
    </Stack>
  );
}