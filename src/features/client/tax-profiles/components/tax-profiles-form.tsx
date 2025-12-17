'use client';

import { useEffect, useState } from 'react';
import {
  Button, Group, TextInput, Textarea, Stack, Paper,
  Title, ActionIcon, Table, Modal, SimpleGrid, NumberInput, Select,
  Text, Badge, LoadingOverlay
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { IconPlus, IconTrash, IconDeviceFloppy, IconEdit, IconPercentage } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';

import { createTaxProfile, updateTaxProfile } from '../api/tax-profiles.api';
import { getStates } from '@/shared/services/locations';
import { TaxProfile, TaxRule } from '../types';


interface TaxProfileFormProps {
  initialData?: TaxProfile | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function TaxProfileForm({ initialData, onSuccess, onCancel }: TaxProfileFormProps) {
  const queryClient = useQueryClient();

  // Controle do Modal de Regra
  const [ruleModalOpen, { open: openRuleModal, close: closeRuleModal }] = useDisclosure(false);
  const [editingRuleIndex, setEditingRuleIndex] = useState<number | null>(null);

  // Busca estados para o select de regras
  const { data: states = [] } = useQuery({
    queryKey: ['states'],
    queryFn: getStates,
    staleTime: Infinity
  });

  const stateOptions = states.map((s: any) => ({ value: s.uf, label: s.uf }));

  // Formulário Principal (Perfil)
  const form = useForm({
    initialValues: {
      name: '',
      description: '',
      rules: [] as TaxRule[],
    },
    validate: {
      name: (val) => (val.length < 3 ? 'Nome obrigatório' : null),
    },
  });

  // Formulário da Regra (Modal)
  const ruleForm = useForm({
    initialValues: {
      originState: '',
      destinationState: '',
      icmsRate: 0,
      ipiRate: 0,
      pisRate: 0,
      cofinsRate: 0,
    },
    validate: {
      originState: (val) => !val ? 'Origem obrigatória' : null,
      destinationState: (val) => !val ? 'Destino obrigatório' : null,
    }
  });

  useEffect(() => {
    if (initialData) {
      form.setValues({
        name: initialData.name,
        description: initialData.description || '',
        rules: initialData.rules || [],
      });
    }
  }, [initialData]);

  // --- MUTATION ---
  const mutation = useMutation({
    mutationFn: async (values: typeof form.values) => {
      if (initialData?.id) {
        return updateTaxProfile(initialData.id, values);
      }
      return createTaxProfile(values);
    },
    onSuccess: () => {
      notifications.show({ message: 'Perfil tributário salvo!', color: 'green' });
      queryClient.invalidateQueries({ queryKey: ['tax-profiles'] });
      onSuccess();
    },
    onError: (err: any) => {
      notifications.show({
        title: 'Erro',
        message: err.response?.data?.message || 'Falha ao salvar',
        color: 'red'
      });
    }
  });

  // --- HANDLERS DE REGRA ---
  const handleOpenRule = (index?: number) => {
    if (index !== undefined) {
      const rule = form.values.rules[index];
      ruleForm.setValues(rule);
      setEditingRuleIndex(index);
    } else {
      ruleForm.reset();
      setEditingRuleIndex(null);
    }
    openRuleModal();
  };

  const handleSaveRule = () => {
    if (ruleForm.validate().hasErrors) return;

    if (editingRuleIndex !== null) {
      // Editar existente
      form.setFieldValue(`rules.${editingRuleIndex}`, ruleForm.values);
    } else {
      // Adicionar nova
      form.insertListItem('rules', ruleForm.values);
    }
    closeRuleModal();
  };

  const handleDeleteRule = (index: number) => {
    form.removeListItem('rules', index);
  };

  return (
    <Stack gap="lg" pos="relative">
      <LoadingOverlay visible={mutation.isPending} overlayProps={{ radius: "sm", blur: 2 }} />

      <Paper withBorder p="md" bg="var(--mantine-color-default)">
        <Title order={5} mb="md">Dados do Perfil</Title>
        <SimpleGrid cols={2}>
          <TextInput
            label="Nome do Perfil"
            placeholder="Ex: Revenda - Eletrônicos"
            required
            {...form.getInputProps('name')}
          />
          <Textarea
            label="Descrição"
            placeholder="Detalhes sobre este perfil..."
            rows={1}
            autosize
            {...form.getInputProps('description')}
          />
        </SimpleGrid>
      </Paper>

      <Paper withBorder p="md" bg="var(--mantine-color-default)">
        <Group justify="space-between" mb="md">
          <div>
            <Title order={5}>Regras Fiscais (Exceções)</Title>
            <Text size="xs" c="dimmed">Defina alíquotas específicas por estado de origem/destino.</Text>
          </div>
          <Button size="xs" leftSection={<IconPlus size={16} />} onClick={() => handleOpenRule()}>
            Nova Regra
          </Button>
        </Group>

        {form.values.rules.length > 0 ? (
          <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Origem</Table.Th>
                <Table.Th>Destino</Table.Th>
                <Table.Th>ICMS</Table.Th>
                <Table.Th>IPI</Table.Th>
                <Table.Th>PIS/COFINS</Table.Th>
                <Table.Th style={{ width: 80 }} />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {form.values.rules.map((rule, index) => (
                <Table.Tr key={index}>
                  <Table.Td><Badge>{rule.originState}</Badge></Table.Td>
                  <Table.Td><Badge color="blue">{rule.destinationState}</Badge></Table.Td>
                  <Table.Td>{Number(rule.icmsRate).toFixed(2)}%</Table.Td>
                  <Table.Td>{Number(rule.ipiRate).toFixed(2)}%</Table.Td>
                  <Table.Td>
                    {Number(rule.pisRate).toFixed(2)}% / {Number(rule.cofinsRate).toFixed(2)}%
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4} justify="flex-end">
                      <ActionIcon variant="subtle" color="gray" onClick={() => handleOpenRule(index)}>
                        <IconEdit size={16} />
                      </ActionIcon>
                      <ActionIcon variant="subtle" color="red" onClick={() => handleDeleteRule(index)}>
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        ) : (
          <Text ta="center" c="dimmed" fs="italic" py="lg">
            Nenhuma regra cadastrada. O sistema usará tributação padrão se não houver regra específica.
          </Text>
        )}
      </Paper>

      <Group justify="flex-end" mt="md">
        <Button variant="default" onClick={onCancel}>Cancelar</Button>
        <Button onClick={() => form.onSubmit((values) => mutation.mutate(values))()} leftSection={<IconDeviceFloppy size={18} />}>
          Salvar Perfil
        </Button>
      </Group>

      {/* MODAL DE EDIÇÃO DE REGRA */}
      <Modal opened={ruleModalOpen} onClose={closeRuleModal} title="Configurar Regra Fiscal">
        <Stack>
          <Group grow>
            <Select
              label="Origem (UF)"
              data={stateOptions}
              searchable
              required
              {...ruleForm.getInputProps('originState')}
            />
            <Select
              label="Destino (UF)"
              data={stateOptions}
              searchable
              required
              {...ruleForm.getInputProps('destinationState')}
            />
          </Group>

          <SimpleGrid cols={2}>
            <NumberInput label="ICMS (%)" rightSection={<IconPercentage size={16} color="gray" />} min={0} {...ruleForm.getInputProps('icmsRate')} />
            <NumberInput label="IPI (%)" rightSection={<IconPercentage size={16} color="gray" />} min={0} {...ruleForm.getInputProps('ipiRate')} />
            <NumberInput label="PIS (%)" rightSection={<IconPercentage size={16} color="gray" />} min={0} {...ruleForm.getInputProps('pisRate')} />
            <NumberInput label="COFINS (%)" rightSection={<IconPercentage size={16} color="gray" />} min={0} {...ruleForm.getInputProps('cofinsRate')} />
          </SimpleGrid>

          <Button fullWidth mt="md" onClick={handleSaveRule}>
            {editingRuleIndex !== null ? 'Atualizar Regra' : 'Adicionar Regra'}
          </Button>
        </Stack>
      </Modal>
    </Stack>
  );
}