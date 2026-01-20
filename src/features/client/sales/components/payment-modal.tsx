'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Modal, Button, Group, Text, Stack,
  Alert, Divider, Select, Paper, LoadingOverlay, Badge, Table
} from '@mantine/core';
import {
  IconCheck, IconInfoCircle, IconCalendar, IconCurrencyReal
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { addDays, format } from 'date-fns';

import api from '@/lib/api';
import { formatCurrency } from '@/utils/formatter';
import { InstallmentBuilder, Installment } from './installment-builder';
import { usePaymentMethods } from '../../financial/hooks/use-financial';

interface PaymentTerm {
  id: string;
  name: string;
  type: string;
  isFlexible: boolean;
  rules: { days: number; percent: number; fixedAmount?: number }[];
}

interface PaymentMethod {
  id: string;
  name: string;
}

interface PaymentModalProps {
  opened: boolean;
  onClose: () => void;
  totalAmount: number;
  onConfirm: (paymentData: any) => void;
  loading: boolean;
}

// Constante global para garantir estabilidade referencial do array vazio
const EMPTY_ARRAY: any[] = [];

export function PaymentModal({ opened, onClose, totalAmount, onConfirm, loading }: PaymentModalProps) {
  const [selectedTermId, setSelectedTermId] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [manualInstallments, setManualInstallments] = useState<Installment[]>([]);

  // Carrega Condições de Pagamento
  const { data: termsData, isLoading: loadingTerms } = useQuery({
    queryKey: ['payment-terms', 'RECEIVABLE'],
    queryFn: async () => {
      const res = await api.get('/payment-terms?type=RECEIVABLE');
      return res.data as PaymentTerm[];
    },
    enabled: opened,
  });

  // FIX: Garante que 'terms' seja estável (mesma referência) quando data é undefined
  const terms = termsData || EMPTY_ARRAY;

  const { data: methodsData, isLoading: loadingMethods } = usePaymentMethods();

  const methods = methodsData || EMPTY_ARRAY;

  // Efeito 1: Resetar estado APENAS quando o modal fecha
  useEffect(() => {
    if (!opened) {
      setManualInstallments([]);
      setSelectedTermId(null);
      setSelectedMethod(null);
    }
  }, [opened]);

  // Efeito 2: Selecionar termo padrão quando a lista carregar e o modal estiver aberto
  useEffect(() => {
    if (opened && terms.length > 0 && !selectedTermId) {
      const defaultTerm = terms.find((t: PaymentTerm) => t.name.toLowerCase().includes('vista')) || terms[0];
      setSelectedTermId(defaultTerm.id);
    }
  }, [opened, terms, selectedTermId]);

  const selectedTerm = useMemo(() => terms.find((t: PaymentTerm) => t.id === selectedTermId), [terms, selectedTermId]);
  const isFlexible = selectedTerm?.isFlexible || false;

  // Simulação para termos fixos
  const simulatedInstallments = useMemo(() => {
    if (!selectedTerm || isFlexible) return [];
    let remainingBalance = totalAmount;

    return selectedTerm.rules.map((rule: any, index: number) => {
      const isLast = index === selectedTerm.rules.length - 1;
      let amount = 0;
      if (rule.fixedAmount) {
        amount = rule.fixedAmount;
      } else {
        amount = Number(((totalAmount * rule.percent) / 100).toFixed(2));
      }
      if (isLast) amount = Number(remainingBalance.toFixed(2));
      remainingBalance -= amount;

      return {
        number: index + 1,
        dueDate: addDays(new Date(), rule.days),
        amount,
        days: rule.days
      };
    });
  }, [selectedTerm, totalAmount, isFlexible]);

  const isTotalValid = useMemo(() => {
    if (!selectedTermId || !selectedMethod) return false;
    if (isFlexible) {
      const sum = manualInstallments.reduce((a, b) => a + Number(b.amount || 0), 0);
      return Math.abs(totalAmount - sum) < 0.05;
    }
    return true;
  }, [selectedTermId, selectedMethod, isFlexible, manualInstallments, totalAmount]);

  const handleConfirm = () => {
    const payload = {
      paymentTermId: selectedTermId,
      paymentMethodId: selectedMethod,
      totalAmount,
      installmentsPlan: isFlexible
        ? manualInstallments.map(i => ({
          //@ts-ignore
          days: Math.ceil((new Date(i.dueDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)),
          percent: (Number(i.amount) / totalAmount) * 100,
          fixedAmount: Number(i.amount),
          dueDate: i.dueDate // Opcional, se o backend suportar data fixa
        }))
        : undefined
    };
    onConfirm(payload);
  };

  return (
    <Modal opened={opened} onClose={onClose} title={<Text fw={700} size="lg">Finalizar Venda</Text>} size="lg" centered closeOnClickOutside={false}>
      <Stack gap="md">
        <Paper bg="blue.0" p="md" radius="md">
          <Group justify="space-between">
            <Group gap="xs">
              <IconCurrencyReal size={24} color="var(--mantine-color-blue-6)" />
              <Text fw={600} c="blue.9">Total a Pagar</Text>
            </Group>
            <Text fw={800} size="xl" c="blue.9">{formatCurrency(totalAmount)}</Text>
          </Group>
        </Paper>

        <Group grow align="flex-start">
          <Select
            label="Condição de Pagamento"
            placeholder="Selecione..."
            data={terms.map((t: PaymentTerm) => ({ value: t.id, label: t.name }))}
            value={selectedTermId}
            onChange={setSelectedTermId}
            disabled={loadingTerms}
            rightSection={loadingTerms ? <LoadingOverlay visible /> : null}
            allowDeselect={false}
          />
          <Select
            label="Forma de Pagamento"
            placeholder="Selecione..."
            data={methods.map((m: PaymentMethod) => ({ value: m.id, label: m.name }))}
            value={selectedMethod}
            onChange={setSelectedMethod}
            disabled={loadingMethods}
            searchable
          />
        </Group>

        <Divider />

        <div style={{ minHeight: 200 }}>
          {!selectedTermId ? (
            <Alert color="gray" icon={<IconInfoCircle />}>Selecione uma condição de pagamento.</Alert>
          ) : isFlexible ? (
            <Stack>
              <Alert variant="light" color="blue" title="Modo Flexível">Defina parcelas manualmente.</Alert>
              <InstallmentBuilder totalAmount={totalAmount} onChange={setManualInstallments} />
            </Stack>
          ) : (
            <Stack gap="xs">
              <Text size="sm" fw={500} c="dimmed">Previsão de Parcelas</Text>
              <Paper withBorder>
                <Table striped>
                  <Table.Thead>
                    <Table.Tr><Table.Th>#</Table.Th><Table.Th>Vencimento</Table.Th><Table.Th>Dias</Table.Th><Table.Th style={{ textAlign: 'right' }}>Valor</Table.Th></Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {simulatedInstallments.map((inst: any) => (
                      <Table.Tr key={inst.number}>
                        <Table.Td>{inst.number}</Table.Td>
                        <Table.Td><Group gap="xs"><IconCalendar size={14} color="gray" />{format(inst.dueDate, 'dd/MM/yyyy')}</Group></Table.Td>
                        <Table.Td><Badge variant="outline" color="gray" size="sm">{inst.days === 0 ? 'À Vista' : `+${inst.days} dias`}</Badge></Table.Td>
                        <Table.Td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(inst.amount)}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Paper>
            </Stack>
          )}
        </div>

        <Divider />
        <Button fullWidth size="lg" color="green" loading={loading} onClick={handleConfirm} disabled={!isTotalValid} leftSection={<IconCheck />}>Confirmar Venda</Button>
      </Stack>
    </Modal>
  );
}