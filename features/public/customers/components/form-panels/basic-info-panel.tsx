import {
  Paper, Group, Select, ActionIcon, Switch, SimpleGrid,
  TextInput, Checkbox, Stack, InputBase,
  Loader
} from '@mantine/core';
import { IconSettings, IconMail, IconPhone, IconPlus } from '@tabler/icons-react';
import { UseFormReturnType } from '@mantine/form';
import { IMaskInput } from 'react-imask';
import { useState } from 'react';
import { notifications } from '@mantine/notifications';
import { searchCnpj } from '@/shared/cnpj-service';
import { onlyText, toTitleCase } from '@/utils/formatter';
import { searchZipCode } from '@/shared/via-cep-service';

interface CategoryOption {
  id: string;
  description: string;
  isActive: boolean;
}

interface BasicInfoPanelProps {
  form: UseFormReturnType<any>;
  categories: CategoryOption[];
  onAddCategory: () => void;
  addressCategories?: any[];
  contacts?: any[];
}

export function BasicInfoPanel({ form, categories, onAddCategory, addressCategories, contacts }: BasicInfoPanelProps) {
  const [loadingCnpj, setLoadingCnpj] = useState(false);

  const handleCnpjSearch = async (value?: string) => {
    // Usa o valor passado ou o do formulário
    const docInput = value || form.values.document;
    const doc = docInput.replace(/\D/g, '');

    if (form.values.personType !== 'PJ' || doc.length !== 14) return;

    setLoadingCnpj(true);
    try {
      const data = await searchCnpj(doc);

      let ibgeCode = '';
      if (data.cep) {
        try {
          const address = await searchZipCode(data.cep.replace(/\D/g, ''));
          ibgeCode = address.ibge;
        } catch (err) {
          console.warn('Erro ao buscar metadados do CEP', err);
        }
      }

      form.setValues({
        // ...form.values,
        name: data.razao_social,
        corporateName: data.razao_social,
        tradeName: onlyText(data.nome_fantasia) || onlyText(data.razao_social),
        email: data.email?.toLowerCase() || form.values.email,
        // Adiciona lógica de formatação básica para o telefone vindo da API
        phone: data.telefones?.[0] ? `${data.telefones[0].ddd}9${data.telefones[0].numero}` : form.values.phone,
        addresses: [
          ...form.values.addresses,
          {
            zipCode: data.cep.replace(/\D/g, ''),
            number: data.numero,
            complement: data.complemento,
          }
        ],
        contacts: [
          ...form.values.contacts,
          {
            name: onlyText(data.nome_fantasia) || onlyText(data.razao_social),
            phone: data.telefones?.[0] ? `${data.telefones[0].ddd}9${data.telefones[0].numero}` : '',
            role: 'Principal'
          }
        ]
      });

      notifications.show({ message: 'Dados da empresa carregados!', color: 'green' });
    } catch (error) {
      notifications.show({ message: 'Erro ao buscar CNPJ', color: 'red' });
    } finally {
      setLoadingCnpj(false);
    }
  };

  return (
    <Stack gap="lg" mt="md">
      <Paper withBorder p="md" bg="var(--mantine-color-default)">
        <Group justify="space-between" align="center">
          <Select
            label="Tipo de Pessoa"
            data={[{ value: 'PF', label: 'Pessoa Física' }, { value: 'PJ', label: 'Pessoa Jurídica' }]}
            allowDeselect={false}
            {...form.getInputProps('personType')}
            onChange={(val) => {
              form.setFieldValue('personType', val);
              form.setFieldValue('document', '');
              form.clearErrors();
            }}
          />
          <Group align="flex-end" gap="xs">
            <Select
              label="Categoria do Cliente"
              placeholder="Selecione"
              data={categories.filter(c => c.isActive).map(c => ({ value: c.id, label: c.description }))}
              style={{ flex: 1 }}
              {...form.getInputProps('categoryId')}
            />
            <ActionIcon variant="default" size="lg" mb={2} onClick={onAddCategory} title="Gerenciar Categorias">
              <IconPlus size={16} />
            </ActionIcon>
          </Group>
        </Group>

        <Group justify="flex-end" mt="md">
          <Switch
            label="Cadastro Ativo"
            labelPosition="left"
            fw={500}
            {...form.getInputProps('isActive', { type: 'checkbox' })}
          />
        </Group>
      </Paper>

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        <InputBase
          key={form.values.personType}
          label={form.values.personType === 'PJ' ? 'CNPJ' : 'CPF'}
          component={IMaskInput}
          mask={form.values.personType === 'PJ' ? '00.000.000/0000-00' : '000.000.000-00'}
          required
          {...form.getInputProps('document')}
          onAccept={(value: string) => {
            form.setFieldValue('document', value);
            if (form.values.personType === 'PJ') {
              const clean = value.replace(/\D/g, '');
              if (clean.length === 14) {
                handleCnpjSearch(value);
              }
            }
          }}
          rightSection={loadingCnpj ? <Loader size="xs" /> : null}
        />
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1 }} spacing="md">
        <TextInput
          label={form.values.personType === 'PJ' ? 'Razão Social' : 'Nome Completo'}
          placeholder={form.values.personType === 'PJ' ? 'Razão Social' : 'Nome completo'}
          required
          {...form.getInputProps('name')}
        />
      </SimpleGrid>

      {form.values.personType === 'PJ' && (
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          <TextInput
            label="Nome Fantasia"
            {...form.getInputProps('tradeName')}
          />
          <Group align="flex-end">
            <TextInput
              label="Inscrição Estadual"
              style={{ flex: 1 }}
              disabled={form.values.isExempt}
              {...form.getInputProps('stateRegistration')}
            />
            <Checkbox
              label="Isento"
              mb={8}
              {...form.getInputProps('isExempt', { type: 'checkbox' })}
            />
          </Group>
        </SimpleGrid>
      )}

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        <TextInput
          label="Email Principal"
          required
          leftSection={<IconMail size={16} />}
          {...form.getInputProps('email')}
        />
        <InputBase
          label="Telefone/WhatsApp"
          component={IMaskInput} mask="(00) 00000-0000"
          leftSection={<IconPhone size={16} />}
          {...form.getInputProps('phone')}
        />
      </SimpleGrid>
    </Stack>
  );
}