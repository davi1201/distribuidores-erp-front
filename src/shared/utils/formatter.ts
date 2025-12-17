export const formatDocumentNumber = (docNumber: string): string => {
  if (docNumber === null || docNumber === undefined) return ''
  const cleaned = docNumber.replace(/\D/g, '');

  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  } else if (cleaned.length === 14) {
    return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }

  return docNumber;
};

export const formatPhoneNumber = (phone: string): string => {
  if (phone === null || phone === undefined) return ''
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  } else if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }

  return phone;
};

export const toTitleCase = (str: string) => {
  if (!str) return '';
  return str.toLowerCase().split(' ').map(word => {
    if (['de', 'da', 'do', 'dos', 'das'].includes(word)) return word;
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');
};

export const onlyNumbers = (str: string): string => {
  return str.replace(/\D/g, '');
};

export function onlyText(str: string): string {
  return str.replace(/[^a-zA-ZÀ-ÿ\s]/g, '');
}

export function formatDateOnlyBR(dateString: string) {
  return new Date(dateString).toLocaleDateString('pt-BR');
}

export const cleanZipCode = (zipCode: string) => {
  return zipCode.replace(/\D/g, '');
}

export function formatCurrency(value: number | string): string {
  const numberValue = typeof value === "string" ? Number(value) : value;

  if (isNaN(numberValue)) return "R$ 0,00";

  return numberValue.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}