import { useState, useEffect } from 'react';
import {
  Group, NumberInput, ActionIcon, Text, Stack, Button,
  SimpleGrid, Paper, Alert
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { IconTrash, IconPlus, IconAlertCircle } from '@tabler/icons-react';
import { addDays } from 'date-fns';
import { formatCurrency } from '@/utils/formatter'; // Certifique-se que este import existe ou use uma formatação simples

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

  // Inicializa com 1 parcela à vista se estiver vazio
  useEffect(() => {
    if (installments.length === 0 && totalAmount > 0) {
      generateSuggestion(1);
    }
  }, [totalAmount]);

  // --- LÓGICA CENTRAL DE CÁLCULO ---
  const recalculateValues = (items: Installment[]) => {
    const count = items.length;
    if (count === 0) return [];

    // Calcula valor base e o resto (centavos)
    const baseValue = Math.floor((totalAmount / count) * 100) / 100;
    const remainder = totalAmount - (baseValue * count);

    // Retorna nova lista com valores ajustados
    return items.map((item, index) => ({
      ...item,
      number: index + 1, // Garante numeração sequencial correta (1, 2, 3...)
      // Adiciona a diferença de centavos na primeira parcela
      amount: index === 0 ? baseValue + remainder : baseValue
    }));
  };

  // Gera sugestão do zero (resetando datas para 30/60/90)
  const generateSuggestion = (count: number) => {
    const tempInstallments: Installment[] = Array.from({ length: count }).map((_, index) => ({
      id: Math.random().toString(36).substr(2, 9),
      number: index + 1,
      dueDate: addDays(new Date(), (index + 1) * 30),
      amount: 0 // Será calculado abaixo
    }));

    const finalInstallments = recalculateValues(tempInstallments);
    setInstallments(finalInstallments);
    onChange(finalInstallments);
  };

  const updateInstallment = (id: string, field: keyof Installment, value: any) => {
    const updated = installments.map(inst =>
      inst.id === id ? { ...inst, [field]: value } : inst
    );
    setInstallments(updated);
    onChange(updated);
  };

  // --- ADICIONAR COM RECÁLCULO ---
  const addInstallment = () => {
    const lastDate = installments[installments.length - 1]?.dueDate || new Date();

    // Cria a nova parcela
    const newInst: Installment = {
      id: Math.random().toString(36).substr(2, 9),
      number: installments.length + 1, // Temporário, será corrigido no recalculate
      dueDate: addDays(new Date(lastDate), 30), // Pega a última data + 30 dias
      amount: 0 // Valor temporário
    };

    // Adiciona na lista e Recalcula tudo
    const newList = [...installments, newInst];
    const recalculatedList = recalculateValues(newList);

    setInstallments(recalculatedList);
    onChange(recalculatedList);
  };

  // --- REMOVER COM RECÁLCULO ---
  const removeInstallment = (id: string) => {
    // Filtra
    const filtered = installments.filter(i => i.id !== id);

    // Recalcula valores e renumera (1, 2, 3...)
    const recalculatedList = recalculateValues(filtered);

    setInstallments(recalculatedList);
    onChange(recalculatedList);
  };

  // Validação de Soma (apenas visual, pois o recálculo garante a soma, exceto edição manual)
  const currentSum = installments.reduce((acc, i) => acc + Number(i.amount), 0);
  const difference = totalAmount - currentSum;
  // Aumentei um pouco a tolerância para floating point issues, mas o cálculo manual resolve isso
  const isValid = Math.abs(difference) < 0.05;

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
          {installments.map((inst) => (
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
                  hideControls
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
            A soma das parcelas ({currentSum.toFixed(2)}) difere do total ({totalAmount.toFixed(2)}).
            Diferença: <b>{difference.toFixed(2)}</b>
          </Text>
        </Alert>
      )}
    </Stack>
  );
}