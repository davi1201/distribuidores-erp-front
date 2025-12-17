interface ProductImage {
  id?: string;
  url: string;
  order: number;
}

interface ProductPrice {
  priceListId: string;
  price: number;
}

interface StockItem {
  quantity: number;
  minStock: number;
  maxStock?: number;
  warehouseId: string;
}

interface Product {
  inventory: any;
  matrixStock: any;
  imagesUrl: any;
  supplier: never[];
  parentId: boolean;
  totalStock: number;
  variants: any[];
  id: string;
  name: string;
  sku: string;
  ean?: string;
  brand?: string;
  unit: string;
  description?: string;

  // Fiscal
  ncm: string;
  cest?: string;
  cfop?: string;
  origin: number;
  taxProfileId?: string;

  // Custos
  costPrice: number;
  expenses: number;
  markup: number;

  // Relacionamentos
  images: ProductImage[];
  prices: ProductPrice[];
  stock?: StockItem; // Pode vir como array ou objeto dependendo do back, ajustamos para objeto único por enquanto
  isActive: boolean;
  suppliers?: any[];
}

interface SupplierData {
  id: string;
  name: string;
  corporateName?: string;
  document?: string;
  email?: string;
  phone?: string;
}

interface PriceSale {
  priceCost: string | number;
  listId: string;
  listName: string;
  price: number;
  adjustment: number;
}

interface Variant {
  id: string;
  name: string;
  variantName: string | null;
  sku: string;
  stock: number;
  imageUrl: string | null;
  supplier?: SupplierData;
  priceSales: PriceSale[];
}

interface ProductExtended {
  id: string;
  name: string;
  sku: string;
  ean?: string | null;
  unit: string;
  costPrice?: number | string;
  supplier?: SupplierData;
  suppliers?: any[];
  variants?: Variant[];
  financial?: {
    baseCost: number;
    markup: number;
  };
}

interface ProductDetailsModalProps {
  opened: boolean;
  onClose: () => void;
  product: ProductExtended | null;
}
