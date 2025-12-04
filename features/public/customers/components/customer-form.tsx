'use client';

import { useState } from 'react';
import {
  Button, Group, Tabs, ThemeIcon, LoadingOverlay
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import {
  IconUser, IconMapPin, IconPhone,
  IconSettings, IconPaperclip, IconExclamationCircle
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  createCustomer,
  createCustomerCategory,
  createAddressCategory,
  updateCustomerCategory,
  updateAddressCategory,
  deleteAddressCategory,
  getAddressCategories,
  getCustomerCategories,
  updateCustomer,
  deleteCustomerCategory,
} from '../customers-service';
import { Customer, PersonType } from '../types';
import { validateCNPJ, validateCPF } from '@/utils/validators';

import { BasicInfoPanel } from './form-panels/basic-info-panel';
import { AddressesPanel } from './form-panels/addresses-panel';
import { ContactsPanel } from './form-panels/contacts-panel';
import { SettingsPanel } from './form-panels/settings-panel';
import { AttachmentsPanel } from './form-panels/attachments-panel';
import { CategoryManagerModal } from './modals/category-manager-modal';
import { getPriceLists } from '../../price-lists/price-lists-service';

interface CustomerFormProps {
  initialData?: Customer | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CustomerForm({ initialData, onSuccess, onCancel }: CustomerFormProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string | null>('basic');

  const [openedCategoryModal, { open: openCategoryModal, close: closeCategoryModal }] = useDisclosure(false);
  const [categoryModalType, setCategoryModalType] = useState<'customer' | 'address' | null>(null);

  const { data: customerCategories = [] } = useQuery({
    queryKey: ['customer-categories'],
    queryFn: async () => {
      const data = await getCustomerCategories();
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: addressCategories = [] } = useQuery({
    queryKey: ['address-categories'],
    queryFn: async () => {
      const data = await getAddressCategories();
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: priceLists = [] } = useQuery({
    queryKey: ['price-lists'],
    queryFn: async () => {
      const data = await getPriceLists();
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const form = useForm({
    initialValues: {
      name: initialData?.name || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      personType: initialData?.personType || PersonType.PF,
      document: initialData?.document || '',
      isActive: initialData?.isActive ?? true,
      categoryId: (initialData as any)?.categoryId || '',
      corporateName: initialData?.corporateName || '',
      tradeName: initialData?.tradeName || '',
      stateRegistration: initialData?.stateRegistration || '',
      isExempt: initialData?.isExempt || false,
      addresses: initialData?.addresses || [],
      contacts: initialData?.contacts || [],
      isFinalConsumer: initialData?.isFinalConsumer || false,
      isICMSContributor: initialData?.isICMSContributor || false,
      creditLimit: initialData?.creditLimit || 0,
      allowExceedLimit: initialData?.allowExceedLimit || false,
      priceListId: initialData?.priceListId || '',
      paymentConditionId: initialData?.paymentConditionId || '',
      sellerId: initialData?.sellerId || '',
      attachments: [] as { name: string; url: string }[],
    },

    // AQUI ESTÁ A MUDANÇA NA VALIDAÇÃO
    validate: {
      name: (val) => (val.length < 3 ? 'Nome obrigatório' : null),
      email: (val) => (/^\S+@\S+$/.test(val) ? null : 'Email inválido'),
      document: (val, values) => {
        if (!val) return 'Documento obrigatório';
        const cleanDoc = val.replace(/\D/g, '');
        if (values.personType === PersonType.PF) {
          return validateCPF(cleanDoc) ? null : 'CPF inválido';
        } else {
          return validateCNPJ(cleanDoc) ? null : 'CNPJ inválido';
        }
      },
      tradeName: (val, values) => {
        if (values.personType === PersonType.PJ && (!val || val.length < 2)) return 'Nome Fantasia é obrigatório';
        return null;
      },
      // Validação Aninhada para Endereços (Valida cada item do array)
      addresses: {
        street: (val) => (val.length < 3 ? 'Rua obrigatória' : null),
        number: (val) => (val.length < 1 ? 'Número obrigatório' : null),
        neighborhood: (val) => (val.length < 2 ? 'Bairro obrigatório' : null),
        zipCode: (val) => (val.length < 8 ? 'CEP inválido' : null),
        city: (val) => (!val ? 'Cidade obrigatória' : null),
        state: (val) => (!val ? 'Estado obrigatório' : null),
        // ISSO GARANTE QUE O USUÁRIO VEJA O ERRO SE A CATEGORIA ESTIVER VAZIA
        categoryId: (val) => (!val ? 'Selecione o tipo do endereço' : null),
      },
      // Validação Aninhada para Contatos
      contacts: {
        name: (val) => (val.length < 2 ? 'Nome do contato obrigatório' : null),
        phone: (val) => (val.length < 10 ? 'Telefone obrigatório' : null),
      },
    },
  });

  const saveCustomerMutation = useMutation({
    mutationFn: async (values: typeof form.values) => {
      const payload = {
        ...values,
        corporateName: values.personType === PersonType.PJ ? values.name : undefined,
        document: values.document.replace(/\D/g, ''),
        phone: values.phone.replace(/\D/g, ''),
        addresses: values.addresses.map((addr: any) => ({ ...addr, zipCode: addr.zipCode.replace(/\D/g, '') })),
        attachments: values.attachments?.map((att: any) => ({
          name: att.name,
          url: att.url
        })) || [],
      };

      if (initialData?.id) {
        return updateCustomer(initialData.id, payload as any);
      } else {
        return createCustomer(payload as any);
      }
    },
    onSuccess: () => {
      notifications.show({ message: initialData?.id ? 'Cliente atualizado!' : 'Cliente cadastrado!', color: 'green' });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      onSuccess();
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'Falha ao salvar';
      notifications.show({ title: 'Erro', message: Array.isArray(msg) ? msg[0] : msg, color: 'red' });
    }
  });

  // ... (Mantenha as mutations de categoria create/update/delete inalteradas) ...
  const createCategoryMutation = useMutation({
    mutationFn: async ({ name, active }: { name: string; active: boolean }) => {
      const payload = { description: name, isActive: active };
      if (categoryModalType === 'customer') {
        return createCustomerCategory(payload);
      }
      return createAddressCategory(payload);
    },
    onSuccess: (_, variables) => {
      const queryKey = categoryModalType === 'customer' ? ['customer-categories'] : ['address-categories'];
      queryClient.invalidateQueries({ queryKey });
      notifications.show({ message: 'Categoria criada', color: 'green' });

      if (categoryModalType === 'customer') {
        const newValue = variables.name.toLowerCase().replace(/\s/g, '-');
        form.setFieldValue('categoryId', newValue);
      }
    }
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, name, active }: { id: string; name: string; active: boolean }) => {
      const payload = { description: name, isActive: active };
      if (categoryModalType === 'customer') {
        return updateCustomerCategory(id, payload);
      } else {
        return updateAddressCategory(id, payload);
      }
    },
    onSuccess: () => {
      const key = categoryModalType === 'customer' ? ['customer-categories'] : ['address-categories'];
      queryClient.invalidateQueries({ queryKey: key });
      notifications.show({ message: 'Categoria atualizada', color: 'green' });
    }
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      if (categoryModalType === 'customer') {
        return deleteCustomerCategory(id);
      } else {
        return deleteAddressCategory(id);
      }
    },
    onSuccess: () => {
      const queryKey = categoryModalType === 'customer' ? ['customer-categories'] : ['address-categories'];
      queryClient.invalidateQueries({ queryKey });
      notifications.show({ message: 'Categoria removida', color: 'green' });
    },
    onError: (err: any) => {
      notifications.show({ message: err.message || 'Erro ao excluir', color: 'red' });
    }
  });

  const handleOpenCategoryManager = (type: 'customer' | 'address') => {
    setCategoryModalType(type);
    openCategoryModal();
  };

  const handleSaveCategory = (name: string, active: boolean, id?: string) => {
    if (id) {
      updateCategoryMutation.mutate({ id, name, active });
    } else {
      createCategoryMutation.mutate({ name, active });
    }
  };

  const handleDeleteCategory = (id: string) => {
    deleteCategoryMutation.mutate(id);
  };

  const handleSubmit = (values: typeof form.values) => {
    // 1. Validação Manual de Quantidade (Porque o schema agora valida o CONTEÚDO)
    if (values.addresses.length === 0) {
      notifications.show({ title: 'Atenção', message: 'Adicione pelo menos um endereço.', color: 'red' });
      setActiveTab('addresses'); // Leva o usuário para a aba com erro
      return;
    }
    if (values.contacts.length === 0) {
      notifications.show({ title: 'Atenção', message: 'Adicione pelo menos um contato.', color: 'red' });
      setActiveTab('contacts');
      return;
    }

    // 2. Validação do Schema (Campos vazios)
    const validation = form.validate();
    if (validation.hasErrors) {
      // Verifica onde estão os erros para trocar de aba
      if (validation.errors.name || validation.errors.document) setActiveTab('basic');
      // O Mantine Form gera erros com chaves tipo 'addresses.0.street'
      else if (Object.keys(validation.errors).some(k => k.startsWith('addresses'))) setActiveTab('addresses');
      else if (Object.keys(validation.errors).some(k => k.startsWith('contacts'))) setActiveTab('contacts');

      notifications.show({ message: 'Verifique os campos obrigatórios em vermelho.', color: 'red' });
      return;
    }

    saveCustomerMutation.mutate(values);
  };

  return (
    <>
      <form onSubmit={form.onSubmit(handleSubmit)} noValidate style={{ position: 'relative' }}>
        <LoadingOverlay visible={saveCustomerMutation.isPending} overlayProps={{ radius: "sm", blur: 2 }} />

        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List mb="md" grow>
            <Tabs.Tab value="basic" leftSection={<IconUser size={16} />}>
              Dados Básicos
              {(form.errors.name || form.errors.email || form.errors.document) && (
                <ThemeIcon color="red" variant="transparent" size="xs" ml={5}><IconExclamationCircle /></ThemeIcon>
              )}
            </Tabs.Tab>

            <Tabs.Tab value="addresses" leftSection={<IconMapPin size={16} />}>
              Endereços ({form.values.addresses.length})
              {/* Verifica se existe algum erro que comece com 'addresses.' */}
              {Object.keys(form.errors).some(k => k.startsWith('addresses')) && (
                <ThemeIcon color="red" variant="transparent" size="xs" ml={5}><IconExclamationCircle /></ThemeIcon>
              )}
            </Tabs.Tab>

            <Tabs.Tab value="contacts" leftSection={<IconPhone size={16} />}>
              Contatos ({form.values.contacts.length})
              {Object.keys(form.errors).some(k => k.startsWith('contacts')) && (
                <ThemeIcon color="red" variant="transparent" size="xs" ml={5}><IconExclamationCircle /></ThemeIcon>
              )}
            </Tabs.Tab>

            <Tabs.Tab value="settings" leftSection={<IconSettings size={16} />}>Configurações</Tabs.Tab>
            <Tabs.Tab value="attachments" leftSection={<IconPaperclip size={16} />}>Anexos</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="basic">
            <BasicInfoPanel
              form={form}
              categories={customerCategories}
              onAddCategory={() => handleOpenCategoryManager('customer')}
              addressCategories={addressCategories}
            />
          </Tabs.Panel>

          <Tabs.Panel value="addresses">
            <AddressesPanel
              form={form}
              categories={addressCategories}
              onAddCategory={() => handleOpenCategoryManager('address')}
            />
          </Tabs.Panel>

          <Tabs.Panel value="contacts">
            <ContactsPanel form={form} />
          </Tabs.Panel>

          <Tabs.Panel value="settings">
            <SettingsPanel form={form} priceLists={priceLists} />
          </Tabs.Panel>

          <Tabs.Panel value="attachments">
            <AttachmentsPanel form={form} />
          </Tabs.Panel>
        </Tabs>

        <Group justify="flex-end" mt="xl" pt="md" style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}>
          <Button variant="default" onClick={onCancel} disabled={saveCustomerMutation.isPending}>Cancelar</Button>
          <Button type="submit" loading={saveCustomerMutation.isPending}>Salvar Cliente</Button>
        </Group>
      </form>

      <CategoryManagerModal
        opened={openedCategoryModal}
        onClose={closeCategoryModal}
        type={categoryModalType}
        categories={categoryModalType === 'customer' ? customerCategories : addressCategories}
        onSave={handleSaveCategory}
        onDelete={handleDeleteCategory}
      />
    </>
  );
}