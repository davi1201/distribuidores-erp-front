import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface CartItem {
  totalStock: number;
  productId: string;
  sku: string;
  name: string;
  imageUrl?: string;
  quantity: number;
  unitPrice: number; // Preço congelado no momento da adição
  discount: number; // Desconto em R$ no item
}

interface CartState {
  // Estado
  customerId: string | null;
  priceListId: string | null;
  items: CartItem[];

  // Actions
  setCustomer: (id: string | null) => void;
  setPriceList: (id: string | null) => void;
  addItem: (product: any, price: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateItemDiscount: (productId: string, discount: number) => void;
  clearCart: () => void;

  // Getters (Computed)
  getSubtotal: () => number;
  getTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      customerId: null,
      priceListId: null,
      items: [],

      setCustomer: (id) => set({ customerId: id }),
      setPriceList: (id) => set({ priceListId: id }),

      addItem: (product, price) => {
        const items = get().items;
        const existingItem = items.find((i) => i.productId === product.id);

        if (existingItem) {
          // Se já existe, incrementa +1
          set({
            items: items.map((i) =>
              i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
            ),
          });
        } else {
          // Se não, adiciona novo
          set({
            items: [
              ...items,
              {
                totalStock: product.totalStock,
                productId: product.id,
                sku: product.sku,
                name: product.name,
                imageUrl: product.images?.[0]?.url,
                quantity: 1,
                unitPrice: price, // Preço vindo da tabela selecionada
                discount: 0,
              },
            ],
          });
        }
      },

      removeItem: (productId) => {
        set({ items: get().items.filter((i) => i.productId !== productId) });
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          // Opcional: remover se chegar a 0
          get().removeItem(productId);
          return;
        }
        set({
          items: get().items.map((i) => (i.productId === productId ? { ...i, quantity } : i)),
        });
      },

      updateItemDiscount: (productId, discount) => {
        set({
          items: get().items.map((i) => (i.productId === productId ? { ...i, discount } : i)),
        });
      },

      clearCart: () => set({ items: [], customerId: null, priceListId: null }),

      getSubtotal: () => {
        return get().items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
      },

      getTotal: () => {
        return get().items.reduce(
          (acc, item) => acc + (item.unitPrice * item.quantity - item.discount),
          0
        );
      },
    }),
    {
      name: 'erp-sales-cart', // Nome da chave no LocalStorage
      storage: createJSONStorage(() => localStorage),
    }
  )
);
