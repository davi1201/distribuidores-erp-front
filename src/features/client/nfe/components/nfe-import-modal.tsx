'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';

import { generateInitialMappings } from '../utils';
import { NfeReviewStep } from './import-steps/nfe-review-step';
import { NfeUploadStep } from './import-steps/nfe-upload-step';
import { FinancialConfig, Mapping, NfeImportModalProps } from '../types';




export function NfeImportModal({ opened, onClose, initialData, onImportSuccess }: NfeImportModalProps) {
  const [parsedData, setParsedData] = useState<any | null>(null);
  const [mappings, setMappings] = useState<Record<number, Mapping>>({});

  const [financialConfig, setFinancialConfig] = useState<FinancialConfig>({
    generate: false,
    entryAmount: 0,
    installmentsCount: 1,
    daysInterval: 30,
    firstDueDate: new Date(),
    paymentMethod: 'BOLETO',
    paymentTermId: null,
  });

  useEffect(() => {
    if (initialData && opened) {
      setParsedData(initialData);
      setMappings(generateInitialMappings(initialData.products));

      const issueDate = initialData.nfe?.issueDate ? new Date(initialData.nfe.issueDate) : new Date();
      const suggestDueDate = new Date(issueDate);
      suggestDueDate.setDate(suggestDueDate.getDate() + 30);

      setFinancialConfig(prev => ({ ...prev, firstDueDate: suggestDueDate }));
    }
  }, [initialData, opened]);

  const handleClose = () => {
    setParsedData(null);
    setMappings({});
    setFinancialConfig({
      generate: false, entryAmount: 0, installmentsCount: 1,
      daysInterval: 30, firstDueDate: new Date(), paymentMethod: 'BOLETO', paymentTermId: null
    });
    onClose();
  };

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!parsedData) return;
      await api.post('/nfe/import', {
        ...parsedData,
        mappings,
        financial: {
          generate: financialConfig.generate,
          entryAmount: financialConfig.entryAmount,
          installmentsCount: financialConfig.installmentsCount,
          daysInterval: financialConfig.daysInterval,
          firstDueDate: financialConfig.firstDueDate,
          paymentMethod: financialConfig.paymentMethod,
          paymentTermId: financialConfig.paymentTermId || undefined
        }
      });
    },
    onSuccess: () => {
      notifications.show({ message: 'Importação finalizada com sucesso!', color: 'green' });
      onImportSuccess?.()
      handleClose();
    },
    onError: (err: any) => notifications.show({ title: 'Erro', message: err.response?.data?.message, color: 'red' })
  });

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={<Text fw={700}>Importação de NFe (XML)</Text>}
      size="90%"
      padding="lg"
      closeOnClickOutside={false}
    >
      {!parsedData ? (
        <NfeUploadStep onParsed={(data) => {
          setParsedData(data);
          setMappings(generateInitialMappings(data.products));
          const suggestDueDate = new Date();
          suggestDueDate.setDate(suggestDueDate.getDate() + 30);
          setFinancialConfig(prev => ({ ...prev, firstDueDate: suggestDueDate }));
        }} />
      ) : (
        <NfeReviewStep
          data={parsedData}
          mappings={mappings}
          setMappings={setMappings}
          financialConfig={financialConfig}
          setFinancialConfig={setFinancialConfig}
          onCancel={handleClose}
          onConfirm={() => importMutation.mutate()}
          loading={importMutation.isPending}
        />
      )}
    </Modal>
  );
}