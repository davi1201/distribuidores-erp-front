import { useEffect, useMemo, useState } from 'react';
import {
  SimpleGrid, InputBase, Loader, Group, Select,
  TextInput, Divider, Textarea,
  Button
} from '@mantine/core';
import { IconPlus, } from '@tabler/icons-react';
import { UseFormReturnType } from '@mantine/form';
import { IMaskInput } from 'react-imask';
import { useQuery } from '@tanstack/react-query';

import { cleanZipCode } from '../../../utils/formatter';
import { getCities, getStates } from '@/shared/services/locations';
import { searchZipCode } from '@/shared/services/via-cep-service';


interface CategoryOption {
  id: string;
  description: string;
  isActive: boolean;
}

interface AddressFormFieldsProps {
  form: UseFormReturnType<any>;
  path: string;
  withCategory?: boolean;
  categories?: CategoryOption[];
  onAddCategory?: () => void;
  disabled?: boolean;
}

export function AddressFormFields({
  form,
  path,
  withCategory = false,
  categories = [],
  onAddCategory,
  disabled = false
}: AddressFormFieldsProps) {
  const [loadingCep, setLoadingCep] = useState(false);

  const { data: states = [] } = useQuery({
    queryKey: ['states'],
    queryFn: getStates,
    staleTime: Infinity,
  });

  const getNestedValue = (p: string, key: string) => {
    const parts = p.split('.');
    if (parts.length === 2) return form.values[parts[0]]?.[parts[1]]?.[key];
    return form.values[p]?.[key];
  };

  const selectedStateId = getNestedValue(path, 'state');
  // Monitoramos o valor do CEP no formulário
  const currentZipCode = getNestedValue(path, 'zipCode');

  const { data: cities = [], isLoading: isLoadingCities } = useQuery({
    queryKey: ['cities', selectedStateId],
    queryFn: () => getCities(selectedStateId),
    enabled: !!selectedStateId,
    staleTime: 1000 * 60 * 5,
  });

  const handleCepSearch = async (cep: string) => {
    if (cleanZipCode(cep).length !== 8) return;

    setLoadingCep(true);
    try {
      const data = await searchZipCode(cep)

      if (!data.erro) {
        form.setFieldValue(`${path}.street`, data.logradouro);
        form.setFieldValue(`${path}.neighborhood`, data.bairro);
        form.setFieldError(`${path}.zipCode`, null);
        form.setFieldValue(`${path}.ibgeCode`, data.ibge);

        const foundState = states.find((s: any) => s.uf === data.uf);

        if (foundState) {
          const stateIdStr = foundState.id.toString();

          if (selectedStateId !== stateIdStr) {
            form.setFieldValue(`${path}.state`, stateIdStr);
            form.setFieldValue(`${path}.city`, '');
          }

          try {
            const citiesFromApi = await getCities(foundState.id);
            let foundCity = citiesFromApi.find((c: any) => c.ibgeCode === data.ibge);
            if (!foundCity) {
              foundCity = citiesFromApi.find((c: any) => c.name.toUpperCase() === data.localidade.toUpperCase());
            }

            if (foundCity) {
              form.setFieldValue(`${path}.city`, foundCity.id.toString());
            }
          } catch { }
        }

        const numberInput = document.getElementById(`${path}-number`);
        if (numberInput) numberInput.focus();
      } else {
        form.setFieldError(`${path}.zipCode`, 'CEP não encontrado');
      }
    } catch {
      form.setFieldError(`${path}.zipCode`, 'Erro ao buscar CEP');
    } finally {
      setLoadingCep(false);
    }
  };

  // Dispara a busca automaticamente quando o CEP estiver completo
  useEffect(() => {
    if (currentZipCode && cleanZipCode(currentZipCode).length === 8) {
      handleCepSearch(currentZipCode);
    }
  }, [currentZipCode]);

  useMemo(() => {
    if (withCategory === false) {
      delete form.values[`${path}`]['categoryId'];
    }
  }, [withCategory]);

  return (
    <>
      <SimpleGrid>
        {withCategory ? (
          <Group gap="xs" align="flex-start" wrap="nowrap">
            <Select
              label="Tipo"
              data={categories
                .filter((c) => c.isActive)
                .map((c) => ({ value: c.id, label: c.description }))}
              placeholder="Selecione"
              required
              disabled={disabled}
              style={{ flex: 1 }}
              onClick={() => {
                if (categories.length === 0) {
                  onAddCategory && onAddCategory()
                }
              }}
              {...form.getInputProps(`${path}.categoryId`)}
            />

            {onAddCategory && (
              <Button
                variant="default"
                size="sm"
                onClick={onAddCategory}
                disabled={disabled}
                leftSection={<IconPlus size={16} />}
                mt={24}
              >
                Adicionar categoria
              </Button>
            )}
          </Group>
        ) : (
          <div />
        )}
      </SimpleGrid>


      <SimpleGrid cols={5} spacing="xs">
        <InputBase
          label="CEP"
          component={IMaskInput} mask="00000-000"
          style={{ gridColumn: 'span 1' }}
          required
          disabled={disabled}
          {...form.getInputProps(`${path}.zipCode`)}
          rightSection={loadingCep ? <Loader size="xs" /> : null}
        />

        <Select
          label="UF"
          data={states.map((s: any) => ({ value: s.id.toString(), label: s.uf }))}
          required
          placeholder="UF"
          style={{ gridColumn: 'span 1' }}
          searchable
          disabled={disabled}
          {...form.getInputProps(`${path}.state`)}
          onChange={(val) => {
            form.setFieldValue(`${path}.state`, val);
            form.setFieldValue(`${path}.city`, '');
          }}
        />

        <Select
          label="Cidade"
          data={cities.map((c: any) => ({ value: c.id.toString(), label: c.name }))}
          style={{ gridColumn: 'span 3' }}
          required
          placeholder="Selecione"
          searchable
          disabled={!selectedStateId || disabled}
          rightSection={isLoadingCities ? <Loader size="xs" /> : null}
          {...form.getInputProps(`${path}.city`)}
        />
      </SimpleGrid>

      <SimpleGrid cols={5} mt="xs" spacing="xs">
        <TextInput
          label="Rua"
          style={{ gridColumn: 'span 2' }}
          required
          disabled={disabled}
          {...form.getInputProps(`${path}.street`)}
        />

        <TextInput
          label="Bairro"
          style={{ gridColumn: 'span 2' }}
          required
          disabled={disabled}
          {...form.getInputProps(`${path}.neighborhood`)}
        />

        <TextInput
          label="Número"
          style={{ gridColumn: 'span 1' }}
          required
          id={`${path}-number`}
          disabled={disabled}
          {...form.getInputProps(`${path}.number`)}
        />
      </SimpleGrid>



      <Divider label="Complemento / Ponto de referência" labelPosition="center" my="sm" />
      <Textarea
        rows={4}
        placeholder="Ex: Apartamento 102, Bloco C..."
        disabled={disabled}
        {...form.getInputProps(`${path}.complement`)}
      />
    </>
  );
}