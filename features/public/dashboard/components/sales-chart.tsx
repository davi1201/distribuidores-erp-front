import { Paper, Text } from '@mantine/core';
import { AreaChart } from '@mantine/charts';
import { formatCurrency } from '@/utils/formatter';

interface SalesChartProps {
  data: Array<{ date: string; value: number }>;
}

export function SalesChart({ data }: SalesChartProps) {
  return (
    <Paper withBorder p="md" radius="md" shadow="sm">
      <Text fw={600} mb="md">Performance de Vendas</Text>

      <AreaChart
        h={300}
        data={data}
        dataKey="date"
        series={[
          { name: 'value', color: 'blue.6', label: 'Vendas' },
        ]}
        curveType="natural"
        tickLine="y"
        gridAxis="xy"
        valueFormatter={(v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(v)}
        tooltipAnimationDuration={200}
      />
    </Paper>
  );
}