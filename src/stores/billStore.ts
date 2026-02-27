import { create } from 'zustand';
import { BillItem, Restaurant } from '@/types/database';

interface LastOrder {
  orderNumber: number;
  items: BillItem[];
  total: number;
  note: string;
  dateTime: Date;
}

interface BillStore {
  items: BillItem[];
  note: string;
  lastOrderNumber: number | null;
  lastOrder: LastOrder | null;
  restaurant: Restaurant | null;
  addItem: (item: Omit<BillItem, 'quantity'>) => void;
  removeItem: (itemVariantId: number) => void;
  updateQuantity: (itemVariantId: number, quantity: number) => void;
  setNote: (note: string) => void;
  setLastOrderNumber: (num: number) => void;
  setLastOrder: (order: LastOrder) => void;
  setRestaurant: (r: Restaurant | null) => void;
  clear: () => void;
  total: () => number;
}

export const useBillStore = create<BillStore>((set, get) => ({
  items: [],
  note: '',
  lastOrderNumber: null,
  lastOrder: null,
  restaurant: null,
  addItem: (item) => {
    set((state) => {
      const existing = state.items.find(i => i.item_variant_id === item.item_variant_id);
      if (existing) {
        return {
          items: state.items.map(i =>
            i.item_variant_id === item.item_variant_id
              ? { ...i, quantity: i.quantity + 1 }
              : i
          ),
        };
      }
      return { items: [...state.items, { ...item, quantity: 1 }] };
    });
  },
  removeItem: (itemVariantId) => {
    set((state) => ({
      items: state.items.filter(i => i.item_variant_id !== itemVariantId),
    }));
  },
  updateQuantity: (itemVariantId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(itemVariantId);
      return;
    }
    set((state) => ({
      items: state.items.map(i =>
        i.item_variant_id === itemVariantId ? { ...i, quantity } : i
      ),
    }));
  },
  setNote: (note) => set({ note }),
  setLastOrderNumber: (num) => set({ lastOrderNumber: num }),
  setLastOrder: (order) => set({ lastOrder: order, lastOrderNumber: order.orderNumber }),
  setRestaurant: (restaurant) => set({ restaurant }),
  clear: () => set({ items: [], note: '' }),
  total: () => get().items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0),
}));
