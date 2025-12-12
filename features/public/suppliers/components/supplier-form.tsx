'use client';

import { useState } from 'react';
import {
  Button, Group, Stack, LoadingOverlay, TextInput, SimpleGrid,
  Select, InputBase, ActionIcon, Loader, Switch
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { IconCheck, IconSearch, IconMail, IconPhone } from '@tabler/icons-react';
import { IMaskInput } from 'react-imask';

import { createSupplier, updateSupplier, Supplier } from '../suppliers-service';
import { AddressFormFields } from '@/components/ui/forms/address-form-fields';
import { searchCnpj } from '@/shared/cnpj-service';
import { searchZipCode } from '@/shared/via-cep-service';
import { onlyText, toTitleCase } from '@/utils/formatter';

interface SupplierFormProps {
  initialData?: Supplier | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function SupplierForm({ initialData, onSuccess, onCancel }: SupplierFormProps) {
  const queryClient = useQueryClient();
  const [loadingCnpj, setLoadingCnpj] = useState(false);

  // Define initial values, mapeando endereço flat para objeto aninhado (para o componente funcionar)
  const form = useForm({
    initialValues: {
      name: initialData?.name || '',
      corporateName: initialData?.corporateName || '',
      document: initialData?.document || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      isActive: initialData?.isActive ?? true,
      personType: initialData?.document && initialData.document.length > 11 ? 'PJ' : 'PF', // Inferência simples

      // Objeto auxiliar para o componente de endereço
      address: {
        zipCode: initialData?.zipCode || '',
        street: initialData?.street || '',
        number: initialData?.number || '',
        complement: initialData?.complement || '',
        neighborhood: initialData?.neighborhood || '',
        city: initialData?.city || '',   // Pode precisar ser ID se seu back mandar ID
        state: initialData?.state || '', // Pode precisar ser ID se seu back mandar ID
        ibgeCode: initialData?.ibgeCode || '',
      }
    },

    validate: (values) => {
      const errors: Record<string, string | null> = {};

      if (values.name.length < 3) {
        errors.name = 'Nome obrigatório';
      }
      if (values.document.length < 11) {
        errors.document = 'Documento inválido';
      }
      // Validação aninhada do endereço
      if (values.address.street.length < 3) {
        errors['address.street'] = 'Endereço obrigatório';
      }
      if (values.address.number.length < 1) {
        errors['address.number'] = 'Obrigatório';
      }

      return errors;
    },
  });

  // --- BUSCA CNPJ ---
  const handleCnpjSearch = async (value?: string) => {
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
        } catch (err) { }
      }

      form.setValues({
        name: onlyText(data.nome_fantasia) || onlyText(data.razao_social),
        corporateName: data.razao_social,
        email: data.email?.toLowerCase() || form.values.email,
        phone: data.telefones?.[0] ? `${data.telefones[0].ddd}${data.telefones[0].numero}` : form.values.phone,
        address: {
          zipCode: data.cep.replace(/\D/g, ''),
          street: data.logradouro,
          number: data.numero,
          complement: data.complemento,
          neighborhood: data.bairro,
          city: toTitleCase(data.municipio), // Ajustar se seu AddressField usar ID
          state: data.uf,                    // Ajustar se seu AddressField usar ID
          ibgeCode: ibgeCode,
        }
      });

      notifications.show({ message: 'Dados do fornecedor carregados!', color: 'green' });
    } catch (error) {
      notifications.show({ message: 'CNPJ não encontrado.', color: 'red' });
    } finally {
      setLoadingCnpj(false);
    }
  };

  // --- MUTATION ---
  const mutation = useMutation({
    mutationFn: async (values: typeof form.values) => {
      // "Achata" o endereço de volta para o payload do backend
      const payload = {
        name: values.name,
        corporateName: values.corporateName,
        document: values.document.replace(/\D/g, ''),
        email: values.email,
        phone: values.phone.replace(/\D/g, ''),
        isActive: values.isActive,

        // Espalha campos de endereço
        ...values.address
      };

      if (initialData?.id) {
        return updateSupplier(initialData.id, payload);
      }
      return createSupplier(payload);
    },
    onSuccess: () => {
      notifications.show({ message: 'Fornecedor salvo com sucesso!', color: 'green' });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      onSuccess();
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'Erro ao salvar';
      notifications.show({ title: 'Erro', message: msg, color: 'red' });
    }
  });

  return (
    <form onSubmit={form.onSubmit((v) => mutation.mutate(v))} style={{ position: 'relative' }}>
      <LoadingOverlay visible={mutation.isPending} overlayProps={{ radius: "sm", blur: 2 }} />

      <Stack gap="md">

        <Group justify="flex-end">
          <Switch
            label="Ativo"
            {...form.getInputProps('isActive', { type: 'checkbox' })}
          />
        </Group>

        <SimpleGrid cols={2}>
          <Select
            label="Tipo"
            data={['PF', 'PJ']}
            allowDeselect={false}
            {...form.getInputProps('personType')}
            onChange={(val) => {
              form.setFieldValue('personType', val || 'PJ');
              form.setFieldValue('document', '');
            }}
          />
          <InputBase
            key={form.values.personType} // Recria ao mudar tipo
            label={form.values.personType === 'PJ' ? 'CNPJ' : 'CPF'}
            component={IMaskInput}
            mask={form.values.personType === 'PJ' ? '00.000.000/0000-00' : '000.000.000-00'}
            required
            {...form.getInputProps('document')}
            onAccept={(val: any) => {
              form.setFieldValue('document', val);
              // Busca automática se for PJ e tiver tamanho completo
              if (form.values.personType === 'PJ' && val.replace(/\D/g, '').length === 14) {
                handleCnpjSearch(val);
              }
            }}
            rightSection={loadingCnpj ? <Loader size="xs" /> : <IconSearch size={16} color="gray" />}
          />
        </SimpleGrid>

        <TextInput
          label="Nome Fantasia / Apelido"
          placeholder="Ex: Distribuidora XYZ"
          required
          {...form.getInputProps('name')}
        />

        {form.values.personType === 'PJ' && (
          <TextInput
            label="Razão Social"
            {...form.getInputProps('corporateName')}
          />
        )}

        <SimpleGrid cols={2}>
          <TextInput
            label="Email"
            leftSection={<IconMail size={16} />}
            {...form.getInputProps('email')}
          />
          <InputBase
            label="Telefone / WhatsApp"
            component={IMaskInput} mask="(00) 00000-0000"
            leftSection={<IconPhone size={16} />}
            {...form.getInputProps('phone')}
          />
        </SimpleGrid>

        {/* Componente Reutilizável de Endereço */}
        <AddressFormFields
          form={form}
          path="address"
          withCategory={false}
        />

        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={onCancel}>Cancelar</Button>
          <Button type="submit" leftSection={<IconCheck size={18} />}>Salvar Fornecedor</Button>
        </Group>

      </Stack>
    </form>
  );
}