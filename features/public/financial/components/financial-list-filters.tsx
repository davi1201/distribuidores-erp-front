'use client';

import { useState } from 'react';
import { Group, TextInput, Select, Button, Paper, Collapse, ActionIcon, Grid } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { IconSearch, IconFilter, IconX, IconCheck } from '@tabler/icons-react';

export interface FinancialFilterValues {
  search: string;
  status: string | null;
  startDate: Date | null;
  endDate: Date | null;
}

interface FinancialListFiltersProps {
  onApply: (filters: FinancialFilterValues) => void;
  isLoading?: boolean;
}

export function FinancialListFilters({ onApply, isLoading }: FinancialListFiltersProps) {
  // Estado local dos filtros (Rascunho)
  const [filters, setFilters] = useState<FinancialFilterValues>({
    search: '',
    status: null,
    startDate: null,
    endDate: null,
  });

  const [isOpen, setIsOpen] = useState(true);

  const handleChange = (field: keyof FinancialFilterValues, value: any) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleApply = () => {
    onApply(filters);
  };

  const handleClear = () => {
    const emptyFilters = {
      search: '',
      status: null,
      startDate: null,
      endDate: null,
    };
    setFilters(emptyFilters);
    onApply(emptyFilters);
  };

  return (
    <Paper p="md" withBorder bg="var(--mantine-color-default)" mb="md">
      <Group justify="space-between" mb={isOpen ? 'sm' : 0}>
        <Group gap="xs">
          <IconFilter size={20} color="gray" />
          <span style={{ fontWeight: 600, fontSize: 14 }}>Filtros Avançados</span>
        </Group>
        <ActionIcon variant="subtle" color="gray" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <IconX size={16} /> : <IconSearch size={16} />}
        </ActionIcon>
      </Group>

      <Collapse in={isOpen}>
        <Grid align="flex-end">
          <Grid.Col span={{ base: 12, md: 4 }}>
            <TextInput
              label="Buscar"
              placeholder="Nº Título ou Cliente..."
              leftSection={<IconSearch size={16} />}
              value={filters.search}
              onChange={(e) => handleChange('search', e.currentTarget.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleApply()}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
            <Select
              label="Status"
              placeholder="Todos"
              data={[
                { value: 'OPEN', label: 'Em Aberto' },
                { value: 'PARTIAL', label: 'Parcial' },
                { value: 'PAID', label: 'Pago' },
                { value: 'OVERDUE', label: 'Vencido' }, // O backend precisa suportar isso ou filtramos no front
                { value: 'CANCELED', label: 'Cancelado' },
              ]}
              value={filters.status}
              onChange={(val) => handleChange('status', val)}
              clearable
            />
          </Grid.Col>

          <Grid.Col span={{ base: 6, sm: 3, md: 2 }}>
            <DateInput
              label="Data Inicial"
              placeholder="DD/MM/AAAA"
              value={filters.startDate}
              onChange={(date) => handleChange('startDate', date)}
              clearable
              valueFormat="DD/MM/YYYY"
            />
          </Grid.Col>

          <Grid.Col span={{ base: 6, sm: 3, md: 2 }}>
            <DateInput
              label="Data Final"
              placeholder="DD/MM/AAAA"
              value={filters.endDate}
              onChange={(date) => handleChange('endDate', date)}
              clearable
              minDate={filters.startDate || undefined}
              valueFormat="DD/MM/YYYY"
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 2 }}>
            <Group gap="xs" grow>
              <Button
                variant="light"
                color="gray"
                onClick={handleClear}
                disabled={isLoading}
              >
                Limpar
              </Button>
              <Button
                onClick={handleApply}
                loading={isLoading}
                leftSection={<IconCheck size={16} />}
              >
                Filtrar
              </Button>
            </Group>
          </Grid.Col>
        </Grid>
      </Collapse>
    </Paper>
  );
}