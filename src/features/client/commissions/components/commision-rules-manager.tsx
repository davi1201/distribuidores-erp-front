'use client';

import React, { useState } from 'react';
import {
  Paper, Title, Text, Button, Group, Modal, Stack,
  TextInput, Select, NumberInput, Badge, Table,
  Card, Divider, Grid, Alert, Loader
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconPlus, IconUsers, IconPackage, IconWorld
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';

// Hooks e Tipos
import { useCommissionRules, useCreateRule } from '../hooks/use-commissions';
import { CommissionScope, CommissionType, CreateCommissionRuleDTO } from '../types';
import { getAllSellers } from '../../user/api/users.api';
import { getSellableProducts } from '../../products/api/product.api';


export function CommissionRulesManager() {
  const [opened, { open, close }] = useDisclosure(false);

  // Hooks de Comissões
  const { data: rules, isLoading } = useCommissionRules();
  const createMutation = useCreateRule();

  // --- BUSCA DE DADOS AUXILIARES ---

  // 1. Vendedores
  const { data: sellers, isLoading: loadingSellers } = useQuery({
    queryKey: ['sellers-list'],
    queryFn: getAllSellers,
    staleTime: 1000 * 60 * 5,
  });

  // 2. Produtos (Novo)
  const { data: products, isLoading: loadingProducts } = useQuery({
    queryKey: ['products-list-simple'], // Key diferente para não conflitar com outras listas
    queryFn: getSellableProducts,
    staleTime: 1000 * 60 * 5,
  });

  // --- ESTADO DO FORMULÁRIO ---
  const [formData, setFormData] = useState<CreateCommissionRuleDTO>({
    name: '',
    scope: CommissionScope.GLOBAL,
    type: CommissionType.PERCENTAGE,
    percentage: 0,
    fixedValue: 0,
    specificUserId: undefined,
    specificProductId: undefined,
  });

  // --- HANDLERS ---
  const handleSubmit = () => {
    if (!formData.name) return;

    createMutation.mutate(formData, {
      onSuccess: () => {
        close();
        setFormData({
          ...formData,
          name: '',
          percentage: 0,
          fixedValue: 0,
          specificUserId: undefined,
          specificProductId: undefined
        });
      }
    });
  };

  const getScopeIcon = (scope: CommissionScope) => {
    switch (scope) {
      case CommissionScope.GLOBAL: return <IconWorld size={16} />;
      case CommissionScope.SELLER: return <IconUsers size={16} />;
      case CommissionScope.PRODUCT: return <IconPackage size={16} />;
    }
  };

  const getScopeColor = (scope: CommissionScope) => {
    switch (scope) {
      case CommissionScope.GLOBAL: return 'blue';
      case CommissionScope.SELLER: return 'violet';
      case CommissionScope.PRODUCT: return 'orange';
    }
  };

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <div>
          <Title order={3}>Regras de Comissão</Title>
          <Text c="dimmed" size="sm">Defina quanto seus vendedores ganham por venda.</Text>
        </div>
        <Button leftSection={<IconPlus size={16} />} onClick={open}>
          Nova Regra
        </Button>
      </Group>

      {/* --- LISTA DE REGRAS EXISTENTES --- */}
      <Paper withBorder p="md" radius="md">
        <Table verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Nome da Regra</Table.Th>
              <Table.Th>Escopo</Table.Th>
              <Table.Th>Tipo</Table.Th>
              <Table.Th>Valor</Table.Th>
              <Table.Th>Status</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rules?.map((rule) => (
              <Table.Tr key={rule.id}>
                <Table.Td fw={500}>{rule.name}</Table.Td>
                <Table.Td>
                  <Badge
                    leftSection={getScopeIcon(rule.scope)}
                    color={getScopeColor(rule.scope)}
                    variant="light"
                  >
                    {rule.scope === 'GLOBAL' ? 'Global' : rule.scope === 'SELLER' ? 'Vendedor' : 'Produto'}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">{rule.type === 'PERCENTAGE' ? 'Porcentagem' : rule.type === 'FIXED' ? 'Fixo' : 'Híbrido'}</Text>
                </Table.Td>
                <Table.Td>
                  <Group gap={5}>
                    {(rule.type !== 'FIXED') && (
                      <Badge variant="outline" color="gray">{Number(rule.percentage)}%</Badge>
                    )}
                    {(rule.type !== 'PERCENTAGE') && (
                      <Badge variant="outline" color="gray">R$ {Number(rule.fixedValue).toFixed(2)}</Badge>
                    )}
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Badge color={rule.isActive ? 'green' : 'gray'} variant="dot">
                    {rule.isActive ? 'Ativa' : 'Inativa'}
                  </Badge>
                </Table.Td>
              </Table.Tr>
            ))}
            {!isLoading && rules?.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={5} align="center">
                  <Text c="dimmed" py="xl">Nenhuma regra configurada.</Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Paper>

      {/* --- MODAL DE CRIAÇÃO --- */}
      <Modal opened={opened} onClose={close} title="Criar Nova Regra de Comissão" size="lg">
        <Stack gap="md">
          <TextInput
            label="Nome da Regra"
            placeholder="Ex: Comissão Padrão 2025"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />

          <Grid>
            <Grid.Col span={6}>
              <Select
                label="Escopo da Regra"
                data={[
                  { value: CommissionScope.GLOBAL, label: 'Global (Padrão)' },
                  { value: CommissionScope.SELLER, label: 'Vendedor Específico' },
                  { value: CommissionScope.PRODUCT, label: 'Produto Específico' },
                ]}
                value={formData.scope}
                onChange={(val) => setFormData({ ...formData, scope: val as CommissionScope })}
                allowDeselect={false}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Select
                label="Tipo de Cálculo"
                data={[
                  { value: CommissionType.PERCENTAGE, label: '% Porcentagem' },
                  { value: CommissionType.FIXED, label: 'R$ Valor Fixo' },
                  { value: CommissionType.HYBRID, label: '% + R$ (Híbrido)' },
                ]}
                value={formData.type}
                onChange={(val) => setFormData({ ...formData, type: val as CommissionType })}
                allowDeselect={false}
              />
            </Grid.Col>
          </Grid>

          {/* --- CAMPOS CONDICIONAIS DE VALOR --- */}
          <Card withBorder bg="gray.0">
            <Text size="xs" fw={700} c="dimmed" mb="xs" tt="uppercase">Definição de Valores</Text>
            <Group grow>
              {(formData.type === CommissionType.PERCENTAGE || formData.type === CommissionType.HYBRID) && (
                <NumberInput
                  label="Porcentagem (%)"
                  placeholder="0.00"
                  suffix="%"
                  decimalScale={2}
                  min={0}
                  value={formData.percentage}
                  onChange={(val) => setFormData({ ...formData, percentage: Number(val) })}
                />
              )}

              {(formData.type === CommissionType.FIXED || formData.type === CommissionType.HYBRID) && (
                <NumberInput
                  label="Valor Fixo (R$)"
                  placeholder="0.00"
                  prefix="R$ "
                  decimalScale={2}
                  min={0}
                  value={formData.fixedValue}
                  onChange={(val) => setFormData({ ...formData, fixedValue: Number(val) })}
                />
              )}
            </Group>
          </Card>

          {/* --- SELEÇÃO DE VENDEDOR --- */}
          {formData.scope === CommissionScope.SELLER && (
            <Select
              label="Selecione o Vendedor"
              placeholder={loadingSellers ? "Carregando vendedores..." : "Busque pelo nome"}
              data={sellers?.map((s: any) => ({ value: s.id, label: s.name })) || []}
              value={formData.specificUserId}
              onChange={(val) => setFormData({ ...formData, specificUserId: val || undefined })}
              searchable
              clearable
              nothingFoundMessage="Nenhum vendedor encontrado"
              disabled={loadingSellers}
              leftSection={loadingSellers ? <Loader size={16} /> : <IconUsers size={16} />}
              required
            />
          )}

          {/* --- SELEÇÃO DE PRODUTO (NOVO) --- */}
          {formData.scope === CommissionScope.PRODUCT && (
            <Select
              label="Selecione o Produto"
              placeholder={loadingProducts ? "Carregando catálogo..." : "Busque por nome ou SKU"}
              // Mapeia os produtos para o formato do Select (Value=ID, Label=Nome - SKU)
              data={products?.map((p: any) => ({
                value: p.id,
                label: `${p.name} (${p.sku})`
              })) || []}
              value={formData.specificProductId}
              onChange={(val) => setFormData({ ...formData, specificProductId: val || undefined })}
              searchable
              clearable
              nothingFoundMessage="Nenhum produto encontrado"
              disabled={loadingProducts}
              leftSection={loadingProducts ? <Loader size={16} /> : <IconPackage size={16} />}
              required
            />
          )}

          <Divider />

          <Group justify="flex-end">
            <Button variant="default" onClick={close}>Cancelar</Button>
            <Button
              onClick={handleSubmit}
              loading={createMutation.isPending}
              color="blue"
              // Validação: Desabilita se for escopo específico mas não tiver selecionado o item
              disabled={
                (formData.scope === CommissionScope.SELLER && !formData.specificUserId) ||
                (formData.scope === CommissionScope.PRODUCT && !formData.specificProductId)
              }
            >
              Salvar Regra
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}