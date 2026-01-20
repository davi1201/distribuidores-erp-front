import React, { useState, useMemo, useCallback } from 'react';
import { Stack, Group, Paper, Text, Checkbox, Badge, Transition, NumberInput, Button, ScrollArea, Table, Center } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconBuildingStore, IconFileCode, IconCurrencyReal, IconPercentage, IconArrowBackUp, IconCheck } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { NfeItem, Mapping, FinancialConfig, PaymentTerm } from '../../types';
import { FinancialSettings } from './financial-settings';
import { ProductRow } from './product-row';

interface NfeReviewStepProps {
  data: any;
  mappings: Record<number, Mapping>;
  setMappings: React.Dispatch<React.SetStateAction<Record<number, Mapping>>>;
  financialConfig: FinancialConfig;
  setFinancialConfig: React.Dispatch<React.SetStateAction<FinancialConfig>>;
  onCancel: () => void;
  onConfirm: () => void;
  loading: boolean;
}

export function NfeReviewStep({
  data,
  mappings,
  setMappings,
  financialConfig,
  setFinancialConfig,
  onCancel,
  onConfirm,
  loading
}: NfeReviewStepProps) {
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [bulkMarkup, setBulkMarkup] = useState<number | string>(50);

  // --- BUSCA CONDIÇÕES DE PAGAMENTO ---
  const { data: paymentTerms, isLoading: isLoadingTerms } = useQuery({
    queryKey: ['payment-terms'],
    queryFn: async () => {
      const response = await api.get('/payment-terms?type=PAYABLE');
      return response.data as PaymentTerm[];
    },
    initialData: [],
  });

  // --- OTIMIZAÇÃO: Cálculo de Hierarquia ---
  const hierarchicalItems = useMemo(() => {
    const parents: NfeItem[] = [];
    const childrenMap: Record<number, NfeItem[]> = {};

    data.products.forEach((item: NfeItem) => {
      const mapping = mappings[item.index] || {};
      if (mapping.action === 'LINK_XML_INDEX' && mapping.targetIndex !== undefined && mapping.targetIndex !== null) {
        const pIdx = mapping.targetIndex;
        if (!childrenMap[pIdx]) childrenMap[pIdx] = [];
        childrenMap[pIdx].push(item);
      } else {
        parents.push(item);
      }
    });
    return { parents, childrenMap };
  }, [data.products, mappings]);

  // --- HANDLERS OTIMIZADOS ---
  const handleToggle = useCallback((index: number) => {
    setSelectedIndices(prev => prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]);
  }, []);

  const handleToggleAll = useCallback(() => {
    if (selectedIndices.length === data.products.length) {
      setSelectedIndices([]);
    } else {
      setSelectedIndices(data.products.map((p: any) => p.index));
    }
  }, [selectedIndices.length, data.products]);

  const handleChangeMapping = useCallback((index: number, field: keyof Mapping, value: any) => {
    setMappings((prev: any) => ({
      ...prev,
      [index]: { ...prev[index], [field]: value }
    }));
  }, [setMappings]);

  const handleApplyBulkMarkup = useCallback(() => {
    if (selectedIndices.length === 0) return;
    setMappings((prev: any) => {
      const next = { ...prev };
      selectedIndices.forEach(idx => {
        if (next[idx]) next[idx] = { ...next[idx], markup: Number(bulkMarkup) };
      });
      return next;
    });
    notifications.show({ message: `Markup atualizado para ${selectedIndices.length} produtos`, color: 'blue' });
    setSelectedIndices([]);
  }, [selectedIndices, bulkMarkup, setMappings]);

  const handleDrop = useCallback((sourceIndex: number, targetIndex: number) => {
    if (sourceIndex === targetIndex) return;

    setMappings((prev: any) => {
      if (targetIndex === -1) {
        return { ...prev, [sourceIndex]: { ...prev[sourceIndex], action: 'NEW', targetIndex: null } };
      }

      const next = { ...prev };
      let finalTargetId = targetIndex;
      const targetMapping = next[targetIndex];
      if (targetMapping && targetMapping.action === 'LINK_XML_INDEX' && targetMapping.targetIndex !== undefined) {
        finalTargetId = targetMapping.targetIndex!;
      }

      Object.keys(next).forEach(key => {
        const idx = Number(key);
        if (next[idx].action === 'LINK_XML_INDEX' && next[idx].targetIndex === sourceIndex) {
          next[idx] = { ...next[idx], action: 'NEW', targetIndex: null };
        }
      });

      next[sourceIndex] = { ...next[sourceIndex], action: 'LINK_XML_INDEX', targetIndex: finalTargetId };
      return next;
    });
  }, [setMappings]);

  const handleFinancialChange = useCallback((updates: Partial<FinancialConfig>) => {
    setFinancialConfig((prev: any) => ({ ...prev, ...updates }));
  }, [setFinancialConfig]);

  return (
    <Stack h="100%">
      {/* CABEÇALHO */}
      <Group grow>
        <Paper withBorder p="xs">
          <Group>
            <IconBuildingStore size={20} color="gray" />
            <div>
              <Text size="xs" c="dimmed">Fornecedor</Text>
              <Text fw={600} size="sm">{data.supplier.name}</Text>
            </div>
          </Group>
        </Paper>
        <Paper withBorder p="xs">
          <Group>
            <IconFileCode size={20} color="gray" />
            <div>
              <Text size="xs" c="dimmed">Nota Fiscal</Text>
              <Text fw={600} size="sm">Nº {data.nfe.number}</Text>
            </div>
          </Group>
        </Paper>
        <Paper withBorder p="xs">
          <Group>
            <IconCurrencyReal size={20} color="gray" />
            <div>
              <Text size="xs" c="dimmed">Total da Nota</Text>
              <Text fw={700} size="sm" c="blue">R$ {Number(data.nfe.totalAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
            </div>
          </Group>
        </Paper>
      </Group>

      {/* FINANCEIRO */}
      <FinancialSettings
        config={financialConfig}
        onChange={handleFinancialChange}
        totalAmount={data.nfe.totalAmount}
        paymentTerms={paymentTerms || []}
        isLoadingTerms={isLoadingTerms}
      />

      {/* BARRA DE FERRAMENTAS */}
      <Group justify="space-between" align="center" style={{ minHeight: 40 }}>
        <Group>
          <Checkbox
            label="Selecionar Todos"
            checked={selectedIndices.length === data.products.length && data.products.length > 0}
            indeterminate={selectedIndices.length > 0 && selectedIndices.length < data.products.length}
            onChange={handleToggleAll}
          />
          {selectedIndices.length > 0 && (
            <Badge color="blue" variant="light">{selectedIndices.length} selecionados</Badge>
          )}
        </Group>

        <Transition mounted={selectedIndices.length > 0} transition="pop" duration={200}>
          {(styles) => (
            <Paper withBorder p={5} style={styles} bg="blue.0" bd="blue.2">
              <Group gap="xs">
                <Text size="sm" fw={500} c="blue.9" pl="xs">Edição em Massa:</Text>
                <NumberInput
                  placeholder="Markup"
                  size="xs" w={100}
                  rightSection={<IconPercentage size={12} />}
                  value={bulkMarkup}
                  onChange={setBulkMarkup}
                />
                <Button size="xs" onClick={handleApplyBulkMarkup}>Aplicar</Button>
              </Group>
            </Paper>
          )}
        </Transition>
      </Group>

      {/* TABELA DE PRODUTOS */}
      <Paper withBorder style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <ScrollArea style={{ flex: 1 }}>
          <Table verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th w={40}></Table.Th>
                <Table.Th w={140}>Item</Table.Th>
                <Table.Th>Produto (XML)</Table.Th>
                <Table.Th w={100}>Qtd</Table.Th>
                <Table.Th w={100}>Custo</Table.Th>
                <Table.Th w={100}>Preço venda</Table.Th>
                <Table.Th w={120}>Markup %</Table.Th>
                <Table.Th w={200}>Ação</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {/* ZONA DE DROP PARA DESFAZER */}
              <Table.Tr
                onDrop={(e) => { e.preventDefault(); handleDrop(Number(e.dataTransfer.getData('idx')), -1); }}
                onDragOver={(e) => e.preventDefault()}
                style={{ height: 10, borderBottom: '2px dashed #dee2e6' }}
              >
                <Table.Td colSpan={7} p={0} h={60}>
                  <Center h="100%" style={{ pointerEvents: 'none' }}>
                    <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                      <IconArrowBackUp size={10} style={{ marginRight: 5 }} />
                      Arraste aqui para tornar produto principal
                    </Text>
                  </Center>
                </Table.Td>
              </Table.Tr>

              {/* LISTA HIERÁRQUICA */}
              {hierarchicalItems.parents.map((parent: NfeItem) => {
                const children = hierarchicalItems.childrenMap[parent.index] || [];
                return (
                  <React.Fragment key={parent.index}>
                    <ProductRow
                      item={parent}
                      mapping={mappings[parent.index] || { action: 'NEW', markup: 100 }}
                      selected={selectedIndices.includes(parent.index)}
                      onToggle={handleToggle}
                      onDrop={handleDrop}
                      onChangeMapping={handleChangeMapping}
                    />
                    {children.map((child, idx) => (
                      <ProductRow
                        key={child.index}
                        item={child}
                        isChild
                        isLastChild={idx === children.length - 1}
                        mapping={mappings[child.index] || { action: 'NEW', markup: 100 }}
                        selected={selectedIndices.includes(child.index)}
                        onToggle={handleToggle}
                        onDrop={handleDrop}
                        onChangeMapping={handleChangeMapping}
                      />
                    ))}
                  </React.Fragment>
                );
              })}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      </Paper>

      <Group justify="flex-end" mt="md">
        <Button variant="default" onClick={onCancel} disabled={loading}>Cancelar</Button>
        <Button color="green" onClick={onConfirm} loading={loading} leftSection={<IconCheck size={18} />}>
          Confirmar Entrada
        </Button>
      </Group>
    </Stack>
  );
}