import React from 'react';
import { Paper, Center, Stack, Loader, Text, FileButton, Button } from '@mantine/core';
import { IconFileCode, IconUpload } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';

interface NfeUploadStepProps {
  onParsed: (data: any) => void;
}

export function NfeUploadStep({ onParsed }: NfeUploadStepProps) {
  const parseMutation = useMutation({
    mutationFn: async (fileToUpload: File) => {
      const formData = new FormData();
      formData.append('file', fileToUpload);
      const { data } = await api.post('/nfe/parse', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return data;
    },
    onSuccess: (data) => onParsed(data),
    onError: (err: any) => notifications.show({ title: 'Erro ao ler XML', message: err.response?.data?.message, color: 'red' })
  });

  return (
    <Paper withBorder p={60} style={{ borderStyle: 'dashed' }}>
      <Center>
        <Stack align="center">
          {parseMutation.isPending ? (
            <>
              <Loader type="dots" />
              <Text size="sm">Analisando estrutura do XML...</Text>
            </>
          ) : (
            <>
              <IconFileCode size={48} color="gray" />
              <Text ta="center" fw={500}>Arraste ou selecione o arquivo XML da Nota Fiscal</Text>
              <FileButton onChange={(file) => file && parseMutation.mutate(file)} accept="text/xml,application/xml">
                {(props) => <Button {...props} mt="md" leftSection={<IconUpload size={16} />}>Selecionar Arquivo</Button>}
              </FileButton>
            </>
          )}
        </Stack>
      </Center>
    </Paper>
  );
}