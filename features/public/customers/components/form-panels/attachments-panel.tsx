import { FilesManager } from '@/components/ui/files-manager/files-manager';
import { UseFormReturnType } from '@mantine/form';


export function AttachmentsPanel({ form }: { form: UseFormReturnType<any> }) {
  return (
    <div style={{ marginTop: '1rem' }}>
      <FilesManager
        value={form.values.attachments}
        onChange={(files) => form.setFieldValue('attachments', files)}
        description="Contratos, documentos pessoais ou fotos do local"
      />
    </div>
  );
}