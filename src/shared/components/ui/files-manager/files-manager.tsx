import { Group, Text, Paper, Flex, ThemeIcon, ActionIcon, Stack } from '@mantine/core';
import { Dropzone, DropzoneProps, MIME_TYPES } from '@mantine/dropzone';
import { IconPaperclip, IconFileText, IconX, IconEye, IconCloudUpload, IconDownload } from '@tabler/icons-react';
import { useFileUpload } from '@/hooks/use-file-upload';
import { useState } from 'react';
import { FileAttachment, getSignedUrl } from '@/shared/services/upload-service';


interface FilesManagerProps extends Partial<Omit<DropzoneProps, 'onChange'>> {
  value?: FileAttachment[];
  onChange: (files: FileAttachment[]) => void;
  description?: string;
}

export function FilesManager({ value = [], onChange, description, ...dropzoneProps }: FilesManagerProps) {
  const { upload, isUploading } = useFileUpload();
  const [openingId, setOpeningId] = useState<string | null>(null); // Estado para loading do click

  const handleDrop = async (files: File[]) => {
    const uploadedFiles = await upload(files);
    if (uploadedFiles) {
      onChange([...value, ...uploadedFiles]);
    }
  };

  const handleRemove = (indexToRemove: number) => {
    const newList = value.filter((_, index) => index !== indexToRemove);
    onChange(newList);
  };

  const handlePreview = async (file: FileAttachment) => {
    // Identificador único para o loading (id ou url)
    const fileId = file.id || file.url;
    setOpeningId(fileId);

    try {
      // 1. Pede ao backend a URL segura
      const secureUrl = await getSignedUrl(file.url);

      // 2. Abre a URL segura em nova aba
      window.open(secureUrl, '_blank');
    } catch (error) {
      console.error(error);
      alert('Erro ao abrir arquivo. Tente novamente.');
    } finally {
      setOpeningId(null);
    }
  };

  return (
    <Stack>
      <Dropzone
        onDrop={handleDrop}
        loading={isUploading}
        maxSize={5 * 1024 * 1024}
        accept={[MIME_TYPES.pdf, MIME_TYPES.png, MIME_TYPES.jpeg]}
        {...dropzoneProps}
      >
        <Group justify="center" gap="xl" style={{ minHeight: 120, pointerEvents: 'none' }}>
          <Dropzone.Idle>
            <IconPaperclip size={50} color="var(--mantine-color-dimmed)" stroke={1.5} />
          </Dropzone.Idle>
          <Dropzone.Accept>
            <IconCloudUpload size={50} color="var(--mantine-color-blue-6)" stroke={1.5} />
          </Dropzone.Accept>

          <div>
            <Text size="xl" inline>
              {isUploading ? 'Enviando...' : 'Arraste arquivos aqui'}
            </Text>
            <Text size="sm" c="dimmed" inline mt={7}>
              {description || 'PDF ou Imagens (max 5mb)'}
            </Text>
          </div>
        </Group>
      </Dropzone>

      {value && value.length > 0 && (
        <Paper withBorder p="sm">
          <Stack gap="xs">
            {value.map((file, index) => (
              <Flex
                key={file.id || index} // Usa ID do banco ou index se for novo
                align="center"
                justify="space-between"
                bg="var(--mantine-color-default)"
                style={{ borderRadius: 4, padding: '8px' }}
              >
                <Group gap="sm">
                  <ThemeIcon color="blue" variant="light"><IconFileText size={16} /></ThemeIcon>
                  <div style={{ overflow: 'hidden' }}>
                    <Text size="sm" fw={500} lineClamp={1} title={file.name}>
                      {file.name}
                    </Text>
                    {file.createdAt && (
                      <Text size="xs" c="dimmed">
                        {new Date(file.createdAt).toLocaleDateString()}
                      </Text>
                    )}
                  </div>
                </Group>

                <Group gap={4}>
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    onClick={() => handlePreview(file)}
                    title="Visualizar / Baixar"
                  >
                    <IconEye size={18} />
                  </ActionIcon>

                  <ActionIcon
                    color="red"
                    variant="subtle"
                    onClick={() => handleRemove(index)}
                    title="Remover"
                  >
                    <IconX size={18} />
                  </ActionIcon>
                </Group>
              </Flex>
            ))}
          </Stack>
        </Paper>
      )}
    </Stack>
  );
}