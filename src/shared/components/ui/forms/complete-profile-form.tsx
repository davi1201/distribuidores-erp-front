'use client';

import { Stack, Button, SimpleGrid, Select, LoadingOverlay, Title, Text, InputBase } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IMaskInput } from 'react-imask';
import { notifications } from '@mantine/notifications';
import { useMutation } from '@tanstack/react-query';

;
import { AddressFormFields } from './address-form-fields';
import { UpdateBillingProfileType, updateTenant } from '@/shared/services/tentant-service';

interface CompleteProfileFormProps {
  onSuccess: () => void;
}

export function CompleteProfileForm({ onSuccess }: CompleteProfileFormProps) {

  const form = useForm({
    initialValues: {
      personType: 'PJ',
      document: '',
      phone: '',
      billingAddress: {
        zipCode: '',
        street: '',
        number: '',
        neighborhood: '',
        city: '',
        state: '',
        complement: '',
        ibgeCode: '',
        categoryId: ''
      }
    },
    validate: {
      document: (val) => val.length < 11 ? 'Documento inválido' : null,
      phone: (val) => val.length < 10 ? 'Telefone inválido' : null,
      billingAddress: {
        street: (val) => val.length < 3 ? 'Endereço obrigatório' : null,
        number: (val) => val.length < 1 ? 'Obrigatório' : null,
        zipCode: (val) => val.length < 8 ? 'CEP inválido' : null,
        city: (val) => !val ? 'Cidade obrigatória' : null,
        state: (val) => !val ? 'Estado obrigatório' : null,
      },
    }
  });

  const mutation = useMutation({
    mutationFn: async (values: typeof form.values) => {
      const payload = {
        personType: values.personType,
        document: values.document,
        phone: values.phone,
        ...values.billingAddress
      };

      await updateTenant(payload as unknown as UpdateBillingProfileType);
    },
    onSuccess: () => {
      notifications.show({ message: 'Dados salvos com sucesso!', color: 'green' });
      onSuccess();
    },
    onError: () => {
      notifications.show({ message: 'Erro ao salvar dados.', color: 'red' });
    }
  });

  return (
    <Stack gap="md">
      <div>
        <Title order={4}>Complete seu cadastro</Title>
        <Text size="sm" c="dimmed">
          Para emitir sua nota fiscal e processar o pagamento, precisamos de alguns dados adicionais.
        </Text>
      </div>

      <form onSubmit={form.onSubmit((values) => mutation.mutate(values))} style={{ position: 'relative' }}>
        <LoadingOverlay visible={mutation.isPending} overlayProps={{ radius: "sm", blur: 2 }} />

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
            key={form.values.personType}
            label={form.values.personType === 'PJ' ? 'CNPJ' : 'CPF'}
            component={IMaskInput}
            mask={form.values.personType === 'PJ' ? '00.000.000/0000-00' : '000.000.000-00'}
            required
            {...form.getInputProps('document')}
            onAccept={(val: any) => form.setFieldValue('document', val)}
          />
        </SimpleGrid>

        <InputBase
          label="Telefone / Celular"
          component={IMaskInput}
          mask="(00) 00000-0000"
          mt="sm"
          required
          {...form.getInputProps('phone')}
          onAccept={(val: any) => form.setFieldValue('phone', val)}
        />

        <div style={{ marginTop: '1rem' }}>
          <AddressFormFields
            form={form}
            path="billingAddress"
            withCategory={false}
          />
        </div>

        <Button type="submit" fullWidth mt="xl" size="md" loading={mutation.isPending}>
          Salvar e Continuar
        </Button>
      </form>
    </Stack>
  );
}