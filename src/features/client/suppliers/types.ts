interface Supplier {
  id: string;
  name: string;
  corporateName?: string;
  document: string;
  email?: string;
  phone?: string;
  isActive: boolean;

  // Endereço
  zipCode?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  ibgeCode?: string;
}
