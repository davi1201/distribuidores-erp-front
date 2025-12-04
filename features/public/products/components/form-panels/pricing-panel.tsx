import { getPriceLists } from '@/features/public/price-lists/price-lists-service';
import {
  SimpleGrid, NumberInput, Divider, Text, Paper, Group, Button,
  ThemeIcon, Stack, Tooltip, HoverCard, Badge, Modal, List, Code, Alert, Select
} from '@mantine/core';
import { UseFormReturnType } from '@mantine/form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useDisclosure } from '@mantine/hooks';
import {
  IconCalculator, IconInfoCircle, IconPlus, IconEqual,
  IconReceiptTax, IconHelp, IconCheck, IconX, IconMapPin, IconPercentage
} from '@tabler/icons-react';

import { useEffect, useState, useMemo } from 'react';
import { getTaxProfileById } from '@/features/public/tax-profiles/tax-profiles-service';
import { formatCurrency } from '@/utils/formatter';
import api from '@/lib/api';

interface ExtendedPriceList {
  id: string;
  name: string;
  isActive: boolean;
  percentageAdjustment?: number;
}

export function PricingPanel({ form }: { form: UseFormReturnType<any> }) {
  // Controle do Modal de Explicação
  const [openedCalculationModal, { open: openCalcModal, close: closeCalcModal }] = useDisclosure(false);

  // Estado para simulação: Agora guarda o ID da regra específica, não apenas a UF
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);

  // Estado para armazenar o resultado do cálculo vindo do servidor
  const [calculationData, setCalculationData] = useState<any>(null);

  // 1. Busca tabelas de preço
  const { data: priceLists = [] } = useQuery({
    queryKey: ['price-lists'],
    queryFn: getPriceLists,
  });

  // 2. Busca o Perfil Tributário selecionado no formulário
  const selectedTaxProfileId = form.values.taxProfileId;
  const { data: taxProfile } = useQuery({
    queryKey: ['tax-profile', selectedTaxProfileId],
    queryFn: () => getTaxProfileById(selectedTaxProfileId),
    enabled: !!selectedTaxProfileId,
  });

  // Define uma regra padrão para simulação assim que o perfil carrega
  useEffect(() => {
    if (taxProfile && taxProfile.rules.length > 0 && !selectedRuleId) {
      // Tenta pegar a regra onde origem == destino (regra interna) como padrão
      const internalRule = taxProfile.rules.find((r: any) => r.originState === r.destinationState);
      // Se não tiver, pega a primeira da lista
      // @ts-ignore
      setSelectedRuleId(internalRule ? internalRule.id : taxProfile.rules[0].id);
    }
  }, [taxProfile]);

  // Inicializa array de preços
  useEffect(() => {
    if (priceLists.length > 0 && form.values.prices.length === 0) {
      const initialPrices = priceLists.map((pl: any) => ({
        priceListId: pl.id,
        price: 0,
      }));
      form.setFieldValue('prices', initialPrices);
    } else if (priceLists.length > 0) {
      const currentPrices = [...form.values.prices];
      priceLists.forEach((pl: any) => {
        if (!currentPrices.find((cp) => cp.priceListId === pl.id)) {
          currentPrices.push({ priceListId: pl.id, price: 0 });
        }
      });
      if (currentPrices.length !== form.values.prices.length) {
        form.setFieldValue('prices', currentPrices);
      }
    }
  }, [priceLists]);

  const getPriceIndex = (priceListId: string) => {
    return form.values.prices.findIndex((p: any) => p.priceListId === priceListId);
  };

  // --- MUTATION: CÁLCULO NO BACKEND ---
  // Agora aceita opcionalmente o ruleId para garantir que usa o valor mais recente
  const calculateMutation = useMutation({
    mutationFn: async (ruleIdOverride?: string) => {
      const currentRuleId = ruleIdOverride || selectedRuleId;
      // Encontra o estado de destino baseado na regra selecionada
      const rule = taxProfile?.rules.find((r: any) => r.id === currentRuleId);

      const payload = {
        costPrice: Number(form.values.costPrice),
        expenses: Number(form.values.expenses),
        markup: Number(form.values.markup),
        taxProfileId: form.values.taxProfileId,
        destinationState: rule?.destinationState
      };

      const { data } = await api.post('/products/calculate-price', payload);
      return data;
    },
    onSuccess: (data) => {
      setCalculationData(data.calculationDetails);

      const basePrice = data.basePrice;

      const updatedPrices = form.values.prices.map((p: any) => {
        const currentList = priceLists.find((pl: any) => pl.id === p.priceListId) as ExtendedPriceList | undefined;
        const listAdjustment = Number(currentList?.percentageAdjustment || 0);
        const adjustedPrice = basePrice * (1 + (listAdjustment / 100));

        return { ...p, price: Math.round(adjustedPrice * 100) / 100 };
      });

      form.setFieldValue('prices', updatedPrices);
    }
  });

  // --- EFEITO: Recalcula automaticamente ao trocar a Regra (Simulação) ---
  useEffect(() => {
    // Só calcula se já tiver um custo preenchido e uma regra selecionada
    if (selectedRuleId && form.values.costPrice > 0) {
      calculateMutation.mutate(selectedRuleId);
    }
  }, [selectedRuleId]);

  // Opções para o select de simulação
  const simulationOptions = useMemo(() => {
    if (!taxProfile || !taxProfile.rules) return [];
    return taxProfile.rules.map((r: any) => ({
      value: r.id,
      label: `${r.originState} ➝ ${r.destinationState}`
    }));
  }, [taxProfile]);

  // --- DADOS VISUAIS (Lidos do state calculationData ou defaults) ---
  const details = calculationData || {
    taxValues: { icms: 0, pis: 0, cofins: 0, ipi: 0, others: 0, totalTaxes: 0 },
    rates: { icmsRate: 0, pisRate: 0, cofinsRate: 0, ipiRate: 0, expensesPct: 0 },
    profitValue: 0,
    netValueRequired: 0,
    totalDeductionsPct: 0,
    activeRuleName: '...',
    cost: 0
  };

  const hasCalculation = !!calculationData;

  // Recalcula o preço final para exibição no Card (baseado nos dados do backend)
  const finalSuggestedPrice = hasCalculation
    ? details.netValueRequired / ((100 - details.totalDeductionsPct) / 100)
    : 0;

  return (
    <>
      <Group justify="space-between" align="center" mb="xs">
        <Group gap="xs">
          <Text fw={700} c="dimmed">Precificação Inteligente</Text>
          {taxProfile && (
            <Badge variant="light" color="blue" leftSection={<IconReceiptTax size={12} />}>
              Perfil: {taxProfile.name}
            </Badge>
          )}
        </Group>
        <Button
          variant="light"
          size="xs"
          leftSection={<IconCalculator size={14} />}
          onClick={() => calculateMutation.mutate(undefined)} // Click manual
          loading={calculateMutation.isPending}
          disabled={!form.values.costPrice}
        >
          Calcular e Aplicar Sugestão
        </Button>
      </Group>

      <Paper withBorder p="md" bg="var(--mantine-color-default)" mb="md">
        <SimpleGrid cols={3}>
          <NumberInput
            label="Preço de Custo"
            prefix="R$ "
            decimalScale={2}
            fixedDecimalScale
            min={0}
            {...form.getInputProps('costPrice')}
          />
          <NumberInput
            label="Outras Despesas (%)"
            description="Comissões, Taxa Cartão, etc."
            suffix="%"
            min={0}
            max={99.9}
            {...form.getInputProps('expenses')}
          />
          <NumberInput
            label="Margem de Lucro (%)"
            suffix="%"
            min={0}
            description="Lucro líquido sobre o custo"
            {...form.getInputProps('markup')}
          />
        </SimpleGrid>
      </Paper>

      {/* CARD DE COMPOSIÇÃO (SÓ MOSTRA APÓS CÁLCULO) */}
      {hasCalculation && (
        <Paper withBorder p="md" radius="md" bg="var(--mantine-color-default)" mb="xl">
          <Group mb="lg" justify="space-between">
            <Group gap="xs">
              <ThemeIcon variant="light" color="blue" size="sm" radius="xl">
                <IconInfoCircle size={14} />
              </ThemeIcon>
              <Text size="sm" fw={600} tt="uppercase" c="dimmed">Demonstrativo do Cálculo</Text>
            </Group>

            <Group gap="xs">
              {taxProfile ? (
                <Select
                  size="xs"
                  placeholder="Simular Regra"
                  data={simulationOptions}
                  value={selectedRuleId}
                  onChange={setSelectedRuleId}
                  leftSection={<IconMapPin size={12} />}
                  w={180}
                  allowDeselect={false}
                  searchable
                />
              ) : (
                <Text size="xs" c="dimmed">Sem perfil fiscal selecionado.</Text>
              )}

              <Button variant="subtle" size="xs" leftSection={<IconHelp size={14} />} onClick={openCalcModal}>
                Entenda
              </Button>
            </Group>
          </Group>

          <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="xl" style={{ alignItems: 'center' }}>
            {/* 1. CUSTO */}
            <Stack gap={4}>
              <Text size="xs" c="dimmed" fw={700}>1. CUSTO</Text>
              <Text size="lg" fw={500}>{formatCurrency(details.cost)}</Text>
            </Stack>

            {/* 2. MARGEM */}
            <Stack gap={4}>
              <Group gap={4}>
                <IconPlus size={12} color="gray" />
                <Text size="xs" c="dimmed" fw={700}>2. LUCRO ({form.values.markup}%)</Text>
              </Group>
              <Text size="lg" c="green.8" fw={500}>+ {formatCurrency(details.profitValue)}</Text>
              <Text size="xs" c="dimmed">Liq: <b>{formatCurrency(details.netValueRequired)}</b></Text>
            </Stack>

            {/* 3. TAXAS */}
            <Stack gap={4}>
              <Group gap={4}>
                <IconPlus size={12} color="gray" />
                <Text size="xs" c="dimmed" fw={700}>3. TAXAS ({details.totalDeductionsPct.toFixed(2)}%)</Text>
              </Group>

              <HoverCard width={280} shadow="md">
                <HoverCard.Target>
                  <Text size="lg" c="red.8" fw={500} style={{ cursor: 'help', textDecoration: 'underline dotted' }}>
                    + {formatCurrency(details.taxValues.totalTaxes + details.taxValues.others)}
                  </Text>
                </HoverCard.Target>
                <HoverCard.Dropdown>
                  <Stack gap="xs">
                    <Text size="sm" fw={700} c="dimmed">
                      {details.activeRuleName ? `Regra: ${details.activeRuleName}` : 'Impostos'}
                    </Text>

                    {details.rates.icmsRate > 0 && (
                      <Group justify="space-between">
                        <Text size="sm">ICMS ({details.rates.icmsRate}%)</Text>
                        <Text size="sm" fw={500}>{formatCurrency(details.taxValues.icms)}</Text>
                      </Group>
                    )}

                    {details.rates.pisRate > 0 && (
                      <Group justify="space-between">
                        <Text size="sm">PIS ({details.rates.pisRate}%)</Text>
                        <Text size="sm" fw={500}>{formatCurrency(details.taxValues.pis)}</Text>
                      </Group>
                    )}

                    {details.rates.cofinsRate > 0 && (
                      <Group justify="space-between">
                        <Text size="sm">COFINS ({details.rates.cofinsRate}%)</Text>
                        <Text size="sm" fw={500}>{formatCurrency(details.taxValues.cofins)}</Text>
                      </Group>
                    )}

                    {details.rates.ipiRate > 0 && (
                      <Group justify="space-between">
                        <Text size="sm">IPI ({details.rates.ipiRate}%)</Text>
                        <Text size="sm" fw={500}>{formatCurrency(details.taxValues.ipi)}</Text>
                      </Group>
                    )}

                    {details.rates.expensesPct > 0 && (
                      <>
                        <Divider my="xs" />
                        <Group justify="space-between">
                          <Text size="sm">Outras ({details.rates.expensesPct}%)</Text>
                          <Text size="sm" fw={500}>{formatCurrency(details.taxValues.others)}</Text>
                        </Group>
                      </>
                    )}
                  </Stack>
                </HoverCard.Dropdown>
              </HoverCard>

              <Text size="xs" c="dimmed">Passe o mouse para ver detalhes</Text>
            </Stack>

            {/* 4. PREÇO BASE */}
            <Paper withBorder p="sm" bg="white" radius="md">
              <Stack gap={2}>
                <Text size="xs" c="dimmed" fw={700} tt="uppercase">Preço Base</Text>
                <Text size="xl" fw={800} c="blue">
                  {formatCurrency(finalSuggestedPrice)}
                </Text>
              </Stack>
            </Paper>
          </SimpleGrid>
        </Paper>
      )}

      {/* MODAL DE EXPLICAÇÃO MATEMÁTICA */}
      <Modal opened={openedCalculationModal} onClose={closeCalcModal} title="Entenda o Cálculo" size="lg">
        <Stack gap="md">
          <Alert color="blue" icon={<IconInfoCircle />}>
            Cálculo realizado no servidor para garantir conformidade fiscal.
            Fórmula: <b>Preço = (Custo + Lucro) / (1 - Taxas%)</b>
          </Alert>
          <Paper withBorder p="sm" bg="gray.0">
            <Stack gap="xs">
              <Group justify="space-between">
                <Text size="sm">1. Valor Líquido Desejado (Custo + Lucro):</Text>
                <Text fw={700}>{formatCurrency(details.netValueRequired)}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm">2. Soma das Taxas:</Text>
                <Text fw={700} c="red">{details.totalDeductionsPct}%</Text>
              </Group>
              <Divider label="Fórmula do Divisor" labelPosition="center" />
              <Group justify="center">
                <Code block style={{ width: '100%', textAlign: 'center' }}>
                  Preço = Valor Líquido / (1 - Taxas)
                </Code>
              </Group>
              <Group justify="center">
                <Code block style={{ width: '100%', textAlign: 'center' }}>
                  {formatCurrency(finalSuggestedPrice)} = {formatCurrency(details.netValueRequired)} / (1 - {details.totalDeductionsPct / 100})
                </Code>
              </Group>
            </Stack>
          </Paper>

          <Text size="sm" fw={700} mt="sm">Prova Real (Onde vai o dinheiro):</Text>
          <List spacing="xs" size="sm" center icon={<IconCheck size={16} color="green" />}>
            <List.Item>
              Você vende por <b>{formatCurrency(finalSuggestedPrice)}</b>
            </List.Item>
            <List.Item icon={<IconX size={16} color="red" />}>
              O governo/despesas ficam com <b>{formatCurrency(details.taxValues.totalTaxes + details.taxValues.others)}</b> ({details.totalDeductionsPct}%)
            </List.Item>
            <List.Item>
              Sobra no caixa: <b>{formatCurrency(details.netValueRequired)}</b>
            </List.Item>
            <List.Item>
              Você paga o custo: <b>{formatCurrency(details.cost)}</b>
            </List.Item>
            <List.Item icon={<ThemeIcon color="green" size={20} radius="xl"><IconCheck size={12} /></ThemeIcon>}>
              Lucro Real: <b>{formatCurrency(details.profitValue)}</b> (Exatamente {form.values.markup}% do custo)
            </List.Item>
          </List>
        </Stack>
      </Modal>

      <Divider label="Tabelas de Preço" labelPosition="center" mb="md" />

      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
        {priceLists.map((pl: any) => {
          const index = getPriceIndex(pl.id);
          if (index === -1) return null;
          const adjustment = Number(pl.percentageAdjustment || 0);
          let badgeColor = 'gray';
          if (adjustment > 0) badgeColor = 'orange';
          if (adjustment < 0) badgeColor = 'green';

          return (
            <div key={pl.id}>
              <Group justify="space-between" mb={4}>
                <Text size="sm" fw={500}>{pl.name}</Text>
                {adjustment !== 0 && (
                  <Badge size="xs" variant="light" color={badgeColor} leftSection={<IconPercentage size={10} />}>
                    {adjustment > 0 ? '+' : ''}{adjustment}% sobre o valor
                  </Badge>
                )}
              </Group>
              <NumberInput
                key={pl.id}
                description={!pl.isActive ? '(Inativa)' : undefined}
                prefix="R$ "
                decimalScale={2}
                fixedDecimalScale
                thousandSeparator="."
                decimalSeparator=","
                min={0}
                {...form.getInputProps(`prices.${index}.price`)}
              />
            </div>
          );
        })}
      </SimpleGrid>

      {priceLists.length === 0 && (
        <Text c="dimmed" ta="center" fs="italic">
          Nenhuma tabela de preço cadastrada. Vá em Cadastros - Tabelas de Preço.
        </Text>
      )}
    </>
  );
}