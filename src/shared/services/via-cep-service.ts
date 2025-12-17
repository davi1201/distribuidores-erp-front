import { cleanZipCode } from '../utils/formatter';

export const searchZipCode = async (zipCode: string) => {
  const response = await fetch(`https://viacep.com.br/ws/${cleanZipCode(zipCode)}/json/`);
  return response.json();
};
