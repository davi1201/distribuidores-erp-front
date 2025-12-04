import { Stack, Paper, Text, Group, TextInput, ActionIcon, Button, InputBase } from '@mantine/core';
import { IconTrash, IconPlus, IconPhone } from '@tabler/icons-react';
import { UseFormReturnType } from '@mantine/form';
import { IMaskInput } from 'react-imask';

export function ContactsPanel({ form }: { form: UseFormReturnType<any> }) {
  const addContact = () => form.insertListItem('contacts', { name: '', phone: '', role: '' });

  return (
    <Stack gap="md" mt="md">
      {form.errors.contacts && (
        <Paper withBorder p="xs" bg="red.0" c="red.8">
          <Text size="sm" fw={500} ta="center">{form.errors.contacts}</Text>
        </Paper>
      )}

      {form.values.contacts.map((_: any, index: number) => (
        <Group key={index} align="flex-end">
          <TextInput
            label="Nome"
            style={{ flex: 1 }}
            required
            {...form.getInputProps(`contacts.${index}.name`)}
          />
          <InputBase
            label="Telefone/WhatsApp"
            component={IMaskInput} mask="(00) 00000-0000"
            leftSection={<IconPhone size={16} />}
            value={form.values.contacts[index].phone}
            onAccept={(value: string) => form.setFieldValue(`contacts.${index}.phone`, value)}
            error={(form.errors.contacts as any)?.[index]?.phone}
            onBlur={form.getInputProps(`contacts.${index}.phone`).onBlur}
          />
          <TextInput label="Cargo" {...form.getInputProps(`contacts.${index}.role`)} />
          <ActionIcon color="red" variant="subtle" mb={4} onClick={() => form.removeListItem('contacts', index)}>
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      ))}

      {form.values.contacts.length === 0 && (
        <Text ta="center" c="dimmed" fs="italic" py="lg">Nenhum contato adicional</Text>
      )}

      <Button variant="light" fullWidth leftSection={<IconPlus size={16} />} onClick={addContact} style={{ borderStyle: 'dashed' }}>
        Adicionar Contato
      </Button>
    </Stack>
  );
}