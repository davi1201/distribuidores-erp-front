export interface CnpjResponse {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  email: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cep: string;
  uf: string;
  municipio: string;
  telefones: { ddd: string; numero: string }[];
  natureza_juridica: string;
}

export const searchCnpj = async (cnpj: string): Promise<CnpjResponse> => {
  const cleanCnpj = cnpj.replace(/\D/g, '');
  const data = await fetch(`https://api.opencnpj.org/${cleanCnpj}`).then((res) => res.json());
  return data;
};
