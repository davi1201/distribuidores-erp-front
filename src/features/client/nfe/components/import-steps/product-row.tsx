import React, { memo } from 'react';
import { Table, Checkbox, Group, Badge, Text, NumberInput, Select } from '@mantine/core';
import { IconGripVertical, IconPercentage } from '@tabler/icons-react';
import { NfeItem, Mapping, ACTION_TYPE } from '../../types';
import { formatCurrency } from '@/shared/utils/formatter';

interface ProductRowProps {
  item: NfeItem;
  isChild?: boolean;
  isLastChild?: boolean;
  mapping: Mapping;
  selected: boolean;
  onToggle: (index: number) => void;
  onDrop: (source: number, target: number) => void;
  onChangeMapping: (index: number, field: keyof Mapping, value: any) => void;
}

export const ProductRow = memo(({
  item,
  isChild,
  isLastChild,
  mapping,
  selected,
  onToggle,
  onDrop,
  onChangeMapping
}: ProductRowProps) => {

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
      bg={selected ? 'var(--mantine-color-default-hover)' : isChild ? 'var(--mantine-color-default)' : undefined}
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
      <Table.Td> {formatCurrency(item.unitPrice.toFixed(2))}</Table.Td>
      <Table.Td> {formatCurrency((item.unitPrice * (1 + mapping.markup / 100)).toFixed(2))}</Table.Td>

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
          <Text size="xs" c="dimmed" fs="italic">Vinculado ao produto base</Text>
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