import { Stack, Paper, Text, Group, ActionIcon, Button } from '@mantine/core';
import { IconTrash, IconPlus } from '@tabler/icons-react';
import { UseFormReturnType } from '@mantine/form';
import { AddressCategory } from '../../types';
import { AddressFormFields } from '@/components/ui/forms/address-form-fields';

interface AddressesPanelProps {
  form: UseFormReturnType<any>;
  categories: AddressCategory[];
  onAddCategory: () => void;
}

export function AddressesPanel({ form, categories, onAddCategory }: AddressesPanelProps) {

  // Helper para dados iniciais limpos
  const getEmptyAddress = () => ({
    zipCode: '',
    street: '',
    number: '',
    neighborhood: '',
    city: '',
    state: '',
    complement: '',
    categoryId: categories.find(c => c.isActive)?.id || ''
  });

  const addAddress = () => form.insertListItem('addresses', getEmptyAddress());

  return (
    <Stack gap="md" mt="md">
      {form.errors.addresses && (
        <Paper withBorder p="xs" bg="red.0" c="red.8">
          <Text size="sm" fw={500} ta="center">{form.errors.addresses}</Text>
        </Paper>
      )}

      {form.values.addresses.map((_: any, index: number) => (
        <Paper key={index} withBorder p="sm" bg="var(--mantine-color-default)">
          <Group justify="space-between" mb="xs">
            <Text fw={500} size="sm">Endereço {index + 1}</Text>
            <ActionIcon color="red" variant="subtle" onClick={() => form.removeListItem('addresses', index)}>
              <IconTrash size={16} />
            </ActionIcon>
          </Group>


          <AddressFormFields
            form={form}
            path={`addresses.${index}`}
            withCategory={true}
            categories={categories}
            onAddCategory={onAddCategory}
          />

        </Paper>
      ))}

      {form.values.addresses.length === 0 && (
        <Text ta="center" c="dimmed" fs="italic" py="lg">Nenhum endereço cadastrado</Text>
      )}

      <Button variant="light" fullWidth leftSection={<IconPlus size={16} />} onClick={addAddress} style={{ borderStyle: 'dashed' }}>
        Adicionar Endereço
      </Button>
    </Stack>
  );
}