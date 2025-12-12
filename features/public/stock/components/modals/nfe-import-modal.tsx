'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Modal, Stack, Group, Text, Button, FileButton, Paper,
  Table, Badge, Alert, ScrollArea, Divider, Loader, Center,
  Select, ActionIcon, NumberInput, Checkbox, Tooltip, Transition,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation } from '@tanstack/react-query';
import {
  IconUpload, IconFileCode, IconCheck, IconBuildingStore,
  IconGripVertical, IconArrowBackUp, IconPercentage
} from '@tabler/icons-react';
import api from '@/lib/api';

type ACTION_TYPE = 'NEW' | 'LINK_XML_INDEX' | 'LINK_EXISTING' | 'LINK_VARIANT';

// --- TIPOS ---
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
}

interface Mapping {
  action: ACTION_TYPE;
  targetIndex?: number | null; // Para link interno (XML)
  targetId?: string; // Para link externo (Banco)
  markup: number; // Margem de lucro
}

interface NfeImportModalProps {
  opened: boolean;
  onClose: () => void;
  initialData?: any; // <--- NOVO: Recebe os dados da nota já parseados (da Inbox)
  onImportSuccess?: () => void;
}

// Helper para gerar mapeamentos iniciais
const generateInitialMappings = (products: NfeItem[]): Record<number, Mapping> => {
  const initialMappings: Record<number, Mapping> = {};
  products.forEach((item) => {
    if (item.suggestedAction === 'LINK_XML_INDEX') {
      initialMappings[item.index] = {
        action: 'LINK_XML_INDEX',
        targetIndex: item.suggestedTargetIndex,
        markup: 50 // Default Markup
      };
    } else {
      initialMappings[item.index] = {
        action: item.suggestedAction,
        markup: 50 // Default Markup
      };
    }
  });
  return initialMappings;
};

// ============================================================================
// 1. COMPONENTE PRINCIPAL (ORQUESTRADOR)
// ============================================================================
export function NfeImportModal({ opened, onClose, initialData, onImportSuccess }: NfeImportModalProps) {
  const [parsedData, setParsedData] = useState<any | null>(null);
  const [mappings, setMappings] = useState<Record<number, Mapping>>({});

  // Efeito para carregar dados iniciais se fornecidos (Fluxo Inbox)
  useEffect(() => {
    if (initialData && opened) {
      setParsedData(initialData);
      setMappings(generateInitialMappings(initialData.products));
    }
  }, [initialData, opened]);

  // Reset ao fechar
  const handleClose = () => {
    setParsedData(null);
    setMappings({});
    onClose();
  };

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!parsedData) return;
      // Envia os dados + os mapeamentos (agora com markup)
      await api.post('/nfe/import', { ...parsedData, mappings });
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
        }} />
      ) : (
        <NfeReviewStep
          data={parsedData}
          mappings={mappings}
          setMappings={setMappings}
          onCancel={handleClose}
          onConfirm={() => importMutation.mutate()}
          loading={importMutation.isPending}
        />
      )}
    </Modal>
  );
}

// ============================================================================
// 2. PASSO DE UPLOAD (Fluxo Manual)
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
    onSuccess: (data) => {
      onParsed(data);
    },
    onError: (err: any) => {
      notifications.show({ title: 'Erro ao ler XML', message: err.response?.data?.message, color: 'red' });
    }
  });

  return (
    <Paper withBorder p={60} bg="gray.0" style={{ borderStyle: 'dashed' }}>
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
              <Text size="sm" c="dimmed" ta="center">O sistema irá identificar produtos, fornecedores e custos automaticamente.</Text>
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
// 3. PASSO DE REVISÃO (TABELA COMPLEXA)
// ============================================================================
function NfeReviewStep({ data, mappings, setMappings, onCancel, onConfirm, loading }: any) {
  // --- ESTADOS LOCAIS DA TABELA ---
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [bulkMarkup, setBulkMarkup] = useState<number | string>(50);

  // --- MANIPULAÇÃO DE DADOS ---

  // Organiza Hierarquia para Renderização
  const hierarchicalItems = useMemo(() => {
    const parents: any[] = [];
    const childrenMap: Record<number, any[]> = {};

    data.products.forEach((item: NfeItem) => {
      const mapping = mappings[item.index] || {};
      if (mapping.action === 'LINK_XML_INDEX' && mapping.targetIndex !== undefined) {
        const pIdx = mapping.targetIndex!;
        if (!childrenMap[pIdx]) childrenMap[pIdx] = [];
        childrenMap[pIdx].push(item);
      } else {
        parents.push(item);
      }
    });
    return { parents, childrenMap };
  }, [data, mappings]);

  // --- HANDLERS DE SELEÇÃO ---

  const toggleAll = () => {
    if (selectedIndices.length === data.products.length) {
      setSelectedIndices([]);
    } else {
      setSelectedIndices(data.products.map((p: any) => p.index));
    }
  };

  const toggleRow = (index: number) => {
    setSelectedIndices(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  // --- HANDLERS DE AÇÃO EM MASSA ---

  const applyBulkMarkup = () => {
    const newMappings = { ...mappings };
    selectedIndices.forEach(idx => {
      if (newMappings[idx]) {
        newMappings[idx] = { ...newMappings[idx], markup: Number(bulkMarkup) };
      }
    });
    setMappings(newMappings);
    notifications.show({ message: `Markup atualizado para ${selectedIndices.length} produtos`, color: 'blue' });
    setSelectedIndices([]);
  };

  // --- HANDLERS DE DRAG & DROP ---

  const handleDrop = (sourceIndex: number, targetIndex: number) => {
    if (sourceIndex === targetIndex) return;

    // Se soltou na zona de "Tornar Principal"
    if (targetIndex === -1) {
      setMappings((prev: any) => ({ ...prev, [sourceIndex]: { ...prev[sourceIndex], action: 'NEW', targetIndex: null } }));
      return;
    }

    // Se soltou em cima de outro produto
    setMappings((prev: any) => {
      const next = { ...prev };

      // CORREÇÃO: Se o alvo já é um filho (variação), pegamos o pai dele.
      let finalTargetId = targetIndex;
      const targetMapping = next[targetIndex];

      if (targetMapping && targetMapping.action === 'LINK_XML_INDEX' && targetMapping.targetIndex !== undefined) {
        finalTargetId = targetMapping.targetIndex;
      }

      // Previne aninhamento profundo (se arrastou um pai, solta os filhos dele)
      Object.keys(next).forEach(key => {
        const idx = Number(key);
        if (next[idx].action === 'LINK_XML_INDEX' && next[idx].targetIndex === sourceIndex) {
          next[idx] = { ...next[idx], action: 'NEW', targetIndex: null };
        }
      });

      next[sourceIndex] = { ...next[sourceIndex], action: 'LINK_XML_INDEX', targetIndex: finalTargetId };
      return next;
    });
  };

  return (
    <Stack h="100%">
      {/* CABEÇALHO DO FORNECEDOR */}
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
      </Group>

      <Divider />

      {/* BARRA DE FERRAMENTAS / BULK ACTIONS */}
      <Group justify="space-between" align="center" style={{ minHeight: 40 }}>
        <Group>
          <Checkbox
            label="Selecionar Todos"
            checked={selectedIndices.length === data.products.length && data.products.length > 0}
            indeterminate={selectedIndices.length > 0 && selectedIndices.length < data.products.length}
            onChange={toggleAll}
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
                <Button size="xs" onClick={applyBulkMarkup}>Aplicar Markup</Button>
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
                  <>
                    <ProductRow
                      key={parent.index} item={parent}
                      mappings={mappings} setMappings={setMappings}
                      selected={selectedIndices.includes(parent.index)}
                      onToggle={() => toggleRow(parent.index)}
                      onDrop={handleDrop}
                    />
                    {children.map((child: NfeItem, idx: number) => (
                      <ProductRow
                        key={child.index} item={child} isChild
                        isLastChild={idx === children.length - 1}
                        mappings={mappings} setMappings={setMappings}
                        selected={selectedIndices.includes(child.index)}
                        onToggle={() => toggleRow(child.index)}
                        onDrop={handleDrop}
                      />
                    ))}
                  </>
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
// 4. SUB-COMPONENTE: LINHA DO PRODUTO
// ============================================================================
function ProductRow({ item, isChild, isLastChild, mappings, setMappings, selected, onToggle, onDrop }: any) {
  const currentMapping = mappings[item.index] || { action: 'NEW', markup: 50 };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('idx', String(item.index));
    e.dataTransfer.effectAllowed = 'move';
  };

  const updateMapping = (field: string, value: any) => {
    setMappings((prev: any) => ({
      ...prev,
      [item.index]: { ...prev[item.index], [field]: value }
    }));
  };

  return (
    <Table.Tr
      draggable
      onDragStart={handleDragStart}
      onDrop={(e) => { e.preventDefault(); onDrop(Number(e.dataTransfer.getData('idx')), item.index); }}
      onDragOver={(e) => e.preventDefault()}
      bg={selected ? 'var(--mantine-color-default-hover)' : isChild ? 'var(--mantine-color-default-hover)' : 'var(--mantine-color-default)'}
      style={{ cursor: 'grab' }}
    >
      <Table.Td>
        <Checkbox checked={selected} onChange={onToggle} />
      </Table.Td>

      {/* COLUNA DE IDENTIFICAÇÃO E ÁRVORE */}
      <Table.Td pl={0}>
        <Group gap={0} wrap="nowrap" style={{ position: 'relative', height: '100%' }}>
          {/* Linhas de Conexão */}
          {isChild && (
            <div style={{
              position: 'absolute', left: 20, top: -25,
              height: isLastChild ? 45 : 60,
              borderLeft: '2px solid #dee2e6',
              zIndex: 0
            }} />
          )}
          {isChild && (
            <div style={{
              position: 'absolute', left: 20, top: 20, width: 15,
              borderTop: '2px solid #dee2e6'
            }} />
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
        <Text size="sm" fw={500} title={item.name}>{item.name}</Text>
        <Group gap={5}>
          <Badge size="xs" variant="outline" color="gray">{item.code}</Badge>
          {item.ean && <Badge size="xs" variant="dot">{item.ean}</Badge>}
        </Group>
      </Table.Td>

      <Table.Td>{item.quantity} {item.unit}</Table.Td>
      <Table.Td>R$ {item.unitPrice.toFixed(2)}</Table.Td>

      {/* COLUNA MARKUP */}
      <Table.Td>
        <NumberInput
          value={currentMapping.markup}
          onChange={(val) => updateMapping('markup', val)}
          min={0} max={500}
          rightSection={<IconPercentage size={12} color="gray" />}
          size="xs"
          styles={{ input: { textAlign: 'center' } }}
        />
      </Table.Td>

      {/* COLUNA AÇÃO */}
      <Table.Td>
        {isChild ? (
          <Text size="xs" c="dimmed" fs="italic">Vinculado ao Pai</Text>
        ) : (
          <Group gap={5}>
            <Select
              size="xs" w={160}
              data={[
                { value: 'NEW', label: '✨ Criar Novo' },
                { value: 'LINK_EXISTING', label: '🔗 Vincular (Auto)' }
              ]}
              value={currentMapping.action === 'LINK_XML_INDEX' ? 'NEW' : currentMapping.action}
              onChange={(val) => updateMapping('action', val)}
              allowDeselect={false}
            />
          </Group>
        )}
      </Table.Td>
    </Table.Tr>
  );
}