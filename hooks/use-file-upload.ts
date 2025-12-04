import { useState } from 'react';
import { notifications } from '@mantine/notifications';
import { FileAttachment, uploadFilesRequest } from '@/shared/upload-service';


export function useFileUpload() {
  const [isUploading, setIsUploading] = useState(false);

  const upload = async (files: File[]): Promise<FileAttachment[] | null> => {
    setIsUploading(true);
    try {
      const data = await uploadFilesRequest(files);
      notifications.show({ message: 'Upload concluído com sucesso', color: 'green' });
      return data;
    } catch (error) {
      console.error(error);
      notifications.show({ title: 'Erro', message: 'Falha ao enviar arquivos', color: 'red' });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    upload,
    isUploading,
  };
}