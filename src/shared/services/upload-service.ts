import api from '@/lib/api';

export interface FileAttachment {
  id?: string; // Opcional (arquivos novos não tem ID ainda)
  name: string;
  url: string;
  [key: string]: any; // Aceita outros campos do backend (createdAt, tenantId, etc)
}

export const uploadFilesRequest = async (files: File[]): Promise<FileAttachment[]> => {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));

  const { data } = await api.post<FileAttachment[]>('/upload/multiple', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return data;
};

export const getSignedUrl = async (fileUrl: string): Promise<string> => {  
  if (!fileUrl.includes('storage.googleapis.com')) return fileUrl;

  const { data } = await api.post<{ url: string }>('/upload/signed-url', { url: fileUrl });
  return data.url;
};