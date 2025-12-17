
import { FilesManager } from '@/components/ui/files-manager/files-manager';
import { UseFormReturnType } from '@mantine/form';

export function ImagesPanel({ form }: { form: UseFormReturnType<any> }) {

  // Adaptador: O FilesManager espera FileAttachment[], mas o form tem ProductImage[]
  // Como ambos tem 'url', funciona visualmente.
  // O backend espera { url, order }.

  const handleFilesChange = (files: any[]) => {
    // Ao receber novos arquivos do FilesManager, formatamos para o padrão do produto
    const formattedImages = files.map((f, index) => ({
      url: f.url,
      order: index, // Define a ordem baseada na posição
      id: f.id // Mantém ID se já existir
    }));

    form.setFieldValue('images', formattedImages);
  };

  return (
    <div style={{ maxWidth: 800 }}>
      <FilesManager
        value={form.values.images}
        onChange={handleFilesChange}
        description="Fotos do produto (JPG, PNG). A primeira será a capa."
        accept={['image/png', 'image/jpeg', 'image/webp']}
      />
    </div>
  );
}