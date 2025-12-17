'use client';

import React, { useState, useMemo, useEffect, useCallback, memo } from 'react';
import {
  Modal, Stack, Group, Text, Button, FileButton, Paper,
  Table, Badge, Alert, ScrollArea, Divider, Loader, Center,
  Select, NumberInput, Checkbox, Transition, Tooltip,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  IconUpload, IconFileCode, IconCheck, IconBuildingStore,
  IconGripVertical, IconArrowBackUp, IconPercentage, IconCurrencyReal,
  IconCalendar, IconInfoCircle
} from '@tabler/icons-react';
import api from '@/lib/api';
import dayjs from 'dayjs';

// ============================================================================
// 1. TIPOS E CONSTANTES
// ============================================================================

type ACTION_TYPE = 'NEW' | 'LINK_XML_INDEX' | 'LINK_EXISTING' | 'LINK_VARIANT';

export interface NfeItem {
  index: number;
  code: string;
  name: string;
  ean: string | null;
  ncm: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  suggestedAction: ACTION_TYPE;
  suggestedTargetIndex?: number;
  supplierCode: string;
}

interface Mapping {
  action: ACTION_TYPE;
  targetIndex?: number | null;
  targetId?: string;
  markup: number;
}

interface NfeImportModalProps {
  opened: boolean;
  onClose: () => void;
  initialData?: any;
  onImportSuccess?: () => void;
}

interface PaymentTerm {
  id: string;
  name: string;
  type: string;
  isFlexible: boolean;
  rules: { days: number; percent: number }[];
}

interface FinancialConfig {
  generate: boolean;
  entryAmount: number;
  installmentsCount: number;
  daysInterval: number;
  firstDueDate: Date | null;
  paymentMethod: string;
  paymentTermId?: string | null;
}

const PAYMENT_METHODS = [
  { value: 'BOLETO', label: 'Boleto Bancário' },
  { value: 'PIX', label: 'PIX' },
  { value: 'BANK_TRANSFER', label: 'Transferência Bancária' },
  { value: 'CREDIT_CARD', label: 'Cartão de Crédito' },
  { value: 'CASH', label: 'Dinheiro' },
  { value: 'OTHER', label: 'Outro' },
];

// Helper puro para gerar mapeamentos iniciais
const generateInitialMappings = (products: NfeItem[]): Record<number, Mapping> => {
  const initialMappings: Record<number, Mapping> = {};
  products.forEach((item) => {
    initialMappings[item.index] = {
      action: item.suggestedAction === 'LINK_XML_INDEX' ? 'LINK_XML_INDEX' : item.suggestedAction,
      targetIndex: item.suggestedTargetIndex,
      markup: 50 // Default Markup
    };
  });
  return initialMappings;
};

// ============================================================================
// 2. SUB-COMPONENTES (Separados para performance e organização)
// ============================================================================

/**
 * Componente isolado e memoizado para a linha do produto.
 * Evita que toda a tabela renderize ao digitar em um input.
 */
const ProductRow = memo(({
  item,
  isChild,
  isLastChild,
  mapping,
  selected,
  onToggle,
  onDrop,
  onChangeMapping
}: {
  item: NfeItem;
  isChild?: boolean;
  isLastChild?: boolean;
  mapping: Mapping;
  selected: boolean;
  onToggle: (index: number) => void;
  onDrop: (source: number, target: number) => void;
  onChangeMapping: (index: number, field: keyof Mapping, value: any) => void;
}) => {

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('idx', String(item.index));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDropLocal = (e: React.DragEvent) => {
    e.preventDefault();
    onDrop(Number(e.dataTransfer.getData('idx')), item.index);
  };

  const handleChangeAction = (val: string | null) => {
    if (val) onChangeMapping(item.index, 'action', val as ACTION_TYPE);
  };

  const handleChangeMarkup = (val: number | string) => {
    onChangeMapping(item.index, 'markup', Number(val));
  };

  return (
    <Table.Tr
      draggable
      onDragStart={handleDragStart}
      onDrop={handleDropLocal}
      onDragOver={(e) => e.preventDefault()}
      bg={selected ? 'var(--mantine-color-blue-0)' : isChild ? 'var(--mantine-color-gray-0)' : undefined}
      style={{ cursor: 'grab' }}
    >
      <Table.Td>
        <Checkbox checked={selected} onChange={() => onToggle(item.index)} />
      </Table.Td>

      {/* Árvore Visual */}
      <Table.Td pl={0}>
        <Group gap={0} wrap="nowrap" style={{ position: 'relative', height: '100%' }}>
          {isChild && (
            <>
              <div style={{
                position: 'absolute', left: 20, top: -25,
                height: isLastChild ? 45 : 60,
                borderLeft: '2px solid #dee2e6', zIndex: 0
              }} />
              <div style={{
                position: 'absolute', left: 20, top: 20, width: 15,
                borderTop: '2px solid #dee2e6'
              }} />
            </>
          )}
          <div style={{ marginLeft: isChild ? 40 : 5, zIndex: 1, display: 'flex', alignItems: 'center' }}>
            <IconGripVertical size={14} style={{ opacity: 0.3 }} />
            {isChild ? (
              <Badge size="xs" color="indigo" variant="light" ml={5}>Variação</Badge>
            ) : (
              <Badge size="xs" color="gray" variant="outline" ml={5}>{item.index + 1}</Badge>
            )}
          </div>
        </Group>
      </Table.Td>

      <Table.Td>
        <Text size="sm" fw={500} lineClamp={1} title={item.name}>{item.name}</Text>
        <Group gap={5}>
          <Badge size="xs" variant="outline" color="gray">{item.code}</Badge>
          {item.ean && <Badge size="xs" variant="dot">{item.ean}</Badge>}
        </Group>
      </Table.Td>

      <Table.Td>{item.quantity} {item.unit}</Table.Td>
      <Table.Td>R$ {item.unitPrice.toFixed(2)}</Table.Td>

      <Table.Td>
        <NumberInput
          value={mapping.markup}
          onChange={handleChangeMarkup}
          min={0} max={500}
          rightSection={<IconPercentage size={12} color="gray" />}
          size="xs"
          styles={{ input: { textAlign: 'center' } }}
        />
      </Table.Td>

      <Table.Td>
        {isChild ? (
          <Text size="xs" c="dimmed" fs="italic">Vinculado ao Pai</Text>
        ) : (
          <Select
            size="xs" w={160}
            data={[
              { value: 'NEW', label: '✨ Criar Novo' },
              { value: 'LINK_EXISTING', label: '🔗 Vincular (Auto)' }
            ]}
            value={mapping.action === 'LINK_XML_INDEX' ? 'NEW' : mapping.action}
            onChange={handleChangeAction}
            allowDeselect={false}
          />
        )}
      </Table.Td>
    </Table.Tr>
  );
});

ProductRow.displayName = 'ProductRow';

/**
 * Componente de Configurações Financeiras
 */
const FinancialSettings = memo(({
  config,
  onChange,
  totalAmount,
  paymentTerms,
  isLoadingTerms
}: {
  config: FinancialConfig;
  onChange: (updates: Partial<FinancialConfig>) => void;
  totalAmount: number;
  paymentTerms: PaymentTerm[];
  isLoadingTerms: boolean;
}) => {

  const selectedTerm = paymentTerms?.find(t => t.id === config.paymentTermId);
  const showManualInputs = !selectedTerm || selectedTerm.isFlexible;
  const remainingAmount = Math.max(0, totalAmount - config.entryAmount);

  const installmentValue = showManualInputs && config.installmentsCount > 0
    ? remainingAmount / config.installmentsCount
    : 0;

  return (
    <Paper withBorder p="sm" bg={config.generate ? 'green.0' : 'gray.0'} style={{ borderColor: config.generate ? 'var(--mantine-color-green-4)' : undefined }}>
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
                data={PAYMENT_METHODS}
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

// ============================================================================
// 3. STEP: UPLOAD
// ============================================================================
function NfeUploadStep({ onParsed }: { onParsed: (data: any) => void }) {
  const parseMutation = useMutation({
    mutationFn: async (fileToUpload: File) => {
      const formData = new FormData();
      formData.append('file', fileToUpload);
      const { data } = await api.post('/nfe/parse', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return data;
    },
    onSuccess: (data) => onParsed(data),
    onError: (err: any) => notifications.show({ title: 'Erro ao ler XML', message: err.response?.data?.message, color: 'red' })
  });

  return (
    <Paper withBorder p={60} style={{ borderStyle: 'dashed' }}>
      <Center>
        <Stack align="center">
          {parseMutation.isPending ? (
            <>
              <Loader type="dots" />
              <Text size="sm">Analisando estrutura do XML...</Text>
            </>
          ) : (
            <>
              <IconFileCode size={48} color="gray" />
              <Text ta="center" fw={500}>Arraste ou selecione o arquivo XML da Nota Fiscal</Text>
              <FileButton onChange={(file) => file && parseMutation.mutate(file)} accept="text/xml,application/xml">
                {(props) => <Button {...props} mt="md" leftSection={<IconUpload size={16} />}>Selecionar Arquivo</Button>}
              </FileButton>
            </>
          )}
        </Stack>
      </Center>
    </Paper>
  );
}

// ============================================================================
// 4. STEP: REVISÃO (Onde a mágica acontece)
// ============================================================================
function NfeReviewStep({
  data,
  mappings,
  setMappings,
  financialConfig,
  setFinancialConfig,
  onCancel,
  onConfirm,
  loading
}: any) {
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [bulkMarkup, setBulkMarkup] = useState<number | string>(50);

  // --- BUSCA CONDIÇÕES DE PAGAMENTO (Cacheada pelo React Query) ---
  const { data: paymentTerms, isLoading: isLoadingTerms } = useQuery({
    queryKey: ['payment-terms'],
    queryFn: async () => {
      const response = await api.get('/payment-terms?type=PAYABLE');
      return response.data as PaymentTerm[];
    },
    initialData: [],
  });

  // --- OTIMIZAÇÃO: Cálculo de Hierarquia ---
  // Apenas recalcula se data ou mappings mudarem
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

  // --- HANDLERS OTIMIZADOS (useCallback) ---

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
      // Se soltar na área "Desfazer" (targetIndex -1)
      if (targetIndex === -1) {
        return { ...prev, [sourceIndex]: { ...prev[sourceIndex], action: 'NEW', targetIndex: null } };
      }

      const next = { ...prev };

      // Lógica: Se o alvo já for um filho, apontamos para o pai dele (evita aninhamento infinito)
      let finalTargetId = targetIndex;
      const targetMapping = next[targetIndex];
      if (targetMapping && targetMapping.action === 'LINK_XML_INDEX' && targetMapping.targetIndex !== undefined) {
        finalTargetId = targetMapping.targetIndex!;
      }

      // Previne que um Pai vire filho de si mesmo ou de seus filhos (simples: reseta filhos se pai mover)
      // Iteração rápida para "soltar" filhos se o pai virar filho
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

  // Handler para Financial Config
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
                      mapping={mappings[parent.index] || { action: 'NEW', markup: 50 }}
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
                        mapping={mappings[child.index] || { action: 'NEW', markup: 50 }}
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

// ============================================================================
// 5. COMPONENTE PRINCIPAL (MODAL)
// ============================================================================
export function NfeImportModal({ opened, onClose, initialData, onImportSuccess }: NfeImportModalProps) {
  const [parsedData, setParsedData] = useState<any | null>(null);
  const [mappings, setMappings] = useState<Record<number, Mapping>>({});

  const [financialConfig, setFinancialConfig] = useState<FinancialConfig>({
    generate: false,
    entryAmount: 0,
    installmentsCount: 1,
    daysInterval: 30,
    firstDueDate: new Date(),
    paymentMethod: 'BOLETO',
    paymentTermId: null,
  });

  useEffect(() => {
    if (initialData && opened) {
      setParsedData(initialData);
      setMappings(generateInitialMappings(initialData.products));

      const issueDate = initialData.nfe?.issueDate ? new Date(initialData.nfe.issueDate) : new Date();
      const suggestDueDate = new Date(issueDate);
      suggestDueDate.setDate(suggestDueDate.getDate() + 30);

      setFinancialConfig(prev => ({ ...prev, firstDueDate: suggestDueDate }));
    }
  }, [initialData, opened]);

  const handleClose = () => {
    setParsedData(null);
    setMappings({});
    setFinancialConfig({
      generate: false, entryAmount: 0, installmentsCount: 1,
      daysInterval: 30, firstDueDate: new Date(), paymentMethod: 'BOLETO', paymentTermId: null
    });
    onClose();
  };

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!parsedData) return;
      await api.post('/nfe/import', {
        ...parsedData,
        mappings,
        financial: {
          generate: financialConfig.generate,
          entryAmount: financialConfig.entryAmount,
          installmentsCount: financialConfig.installmentsCount,
          daysInterval: financialConfig.daysInterval,
          firstDueDate: financialConfig.firstDueDate,
          paymentMethod: financialConfig.paymentMethod,
          paymentTermId: financialConfig.paymentTermId || undefined
        }
      });
    },
    onSuccess: () => {
      notifications.show({ message: 'Importação finalizada com sucesso!', color: 'green' });
      onImportSuccess?.()
      handleClose();
    },
    onError: (err: any) => notifications.show({ title: 'Erro', message: err.response?.data?.message, color: 'red' })
  });

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={<Text fw={700}>Importação de NFe (XML)</Text>}
      size="90%"
      padding="lg"
      closeOnClickOutside={false}
    >
      {!parsedData ? (
        <NfeUploadStep onParsed={(data) => {
          setParsedData(data);
          setMappings(generateInitialMappings(data.products));
          const suggestDueDate = new Date();
          suggestDueDate.setDate(suggestDueDate.getDate() + 30);
          setFinancialConfig(prev => ({ ...prev, firstDueDate: suggestDueDate }));
        }} />
      ) : (
        <NfeReviewStep
          data={parsedData}
          mappings={mappings}
          setMappings={setMappings}
          financialConfig={financialConfig}
          setFinancialConfig={setFinancialConfig}
          onCancel={handleClose}
          onConfirm={() => importMutation.mutate()}
          loading={importMutation.isPending}
        />
      )}
    </Modal>
  );
}