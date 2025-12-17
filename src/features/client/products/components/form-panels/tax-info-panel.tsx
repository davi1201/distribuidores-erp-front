import { getTaxProfiles } from '@/features/client/tax-profiles/api/tax-profiles.api';
import { SimpleGrid, TextInput, Select, NumberInput, Loader } from '@mantine/core';
import { UseFormReturnType } from '@mantine/form';
import { useQuery } from '@tanstack/react-query';

export function TaxInfoPanel({ form }: { form: UseFormReturnType<any> }) {
  const { data: taxProfiles = [], isLoading } = useQuery({
    queryKey: ['tax-profiles'],
    queryFn: getTaxProfiles,
    staleTime: 1000 * 60 * 5, // Cache de 5 minutos
  });

  const taxProfileOptions = taxProfiles.map((tp) => ({
    value: tp.id,
    label: tp.name
  }));


  return (
    <SimpleGrid cols={2} spacing="lg">
      <TextInput
        label="NCM (Nomenclatura Comum do Mercosul)"
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
        label="Origem da Mercadoria"
        data={[
          { value: '0', label: '0 - Nacional' },
          { value: '1', label: '1 - Estrangeira (Imp. direta)' },
          { value: '2', label: '2 - Estrangeira (Adq. no mercado interno)' },
        ]}
        {...form.getInputProps('origin')}
      />

      <Select
        label="Perfil Tributário"
        placeholder="Selecione (Ex: Eletrônicos)"
        data={taxProfileOptions}
        disabled={isLoading}
        searchable
        clearable
        rightSection={isLoading ? <Loader size="xs" /> : null}
        description={
          taxProfiles.length === 0 && !isLoading
            ? "Nenhum perfil encontrado. Cadastre em Fiscal > Perfis Tributários."
            : "Define as regras automáticas de impostos (ICMS/IPI/PIS/COFINS)"
        }
        {...form.getInputProps('taxProfileId')}
      />
    </SimpleGrid>
  );
}