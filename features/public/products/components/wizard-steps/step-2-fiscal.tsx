import { getTaxProfiles } from '@/features/public/tax-profiles/tax-profiles-service';
import { Paper, SimpleGrid, TextInput, Select, Text } from '@mantine/core';
import { UseFormReturnType } from '@mantine/form';
import { useQuery } from '@tanstack/react-query';


export function StepFiscal({ form }: { form: UseFormReturnType<any> }) {
  const { data: taxProfiles = [] } = useQuery({
    queryKey: ['tax-profiles'],
    queryFn: getTaxProfiles,
  });

  return (
    <Paper withBorder p="md" radius="md">
      <Text size="sm" c="dimmed" mb="md">
        Estas configurações fiscais serão aplicadas a todas as variações do produto.
      </Text>

      <SimpleGrid cols={2}>
        <TextInput
          label="NCM"
          placeholder="0000.00.00"
          required
          {...form.getInputProps('ncm')}
        />
        <TextInput
          label="CEST"
          placeholder="00.000.00"
          {...form.getInputProps('cest')}
        />
        <TextInput
          label="CFOP Padrão"
          placeholder="5102"
          {...form.getInputProps('cfop')}
        />
        <Select
          label="Origem"
          data={[
            { value: '0', label: '0 - Nacional' },
            { value: '1', label: '1 - Estrangeira' },
          ]}
          {...form.getInputProps('origin')}
        />
        <Select
          label="Perfil Tributário"
          placeholder="Selecione..."
          data={taxProfiles.map(t => ({ value: t.id, label: t.name }))}
          searchable
          clearable
          {...form.getInputProps('taxProfileId')}
        />
      </SimpleGrid>
    </Paper>
  );
}