import { create } from 'zustand';
import { MenuItem, MenuItemVariant, MenuItemAddon, DietType } from '@/types/cafe';

export interface CartItem {
  cartId: string;
  itemId: string;
  name: string;
  basePrice: number;
  type: DietType;
  image?: string;
  selectedVariant?: MenuItemVariant;
  selectedAddons: MenuItemAddon[];
  unitPrice: number;
  quantity: number;
  itemTotal: number;
  specialInstructions?: string;
}

interface CartStore {
  cafeId: string | null;
  tableId: string | null;
  tableNumber: string | null;
  floorName: string | null;
  customerName: string;
  customerPhone: string;
  items: CartItem[];
  orderNote: string;
  couponCode: string;
  discountAmount: number;
  
  // Setters
  setTableContext: (context: {
    cafeId: string;
    tableId: string;
    tableNumber: string;
    floorName: string;
  }) => void;
  setCustomerDetails: (details: { name: string; phone: string }) => void;
  setOrderNote: (note: string) => void;
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;

  // Cart operations
  addItem: (
    item: MenuItem,
    variant?: MenuItemVariant,
    addons?: MenuItemAddon[],
    instructions?: string
  ) => void;
  updateQuantity: (cartId: string, quantity: number) => void;
  removeItem: (cartId: string) => void;
  clearCart: () => void;

  // Computations
  getItemCount: () => number;
  getSubtotal: () => number;
  getTaxAmount: (taxPercent: number) => number;
  getTotal: (taxPercent: number) => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  cafeId: null,
  tableId: null,
  tableNumber: null,
  floorName: null,
  customerName: '',
  customerPhone: '',
  items: [],
  orderNote: '',
  couponCode: '',
  discountAmount: 0,

  setTableContext: ({ cafeId, tableId, tableNumber, floorName }) => {
    // If switching tables or cafes, clear cart
    const prev = get();
    if (prev.tableId && prev.tableId !== tableId) {
      set({ cafeId, tableId, tableNumber, floorName, items: [], orderNote: '', couponCode: '', discountAmount: 0 });
    } else {
      set({ cafeId, tableId, tableNumber, floorName });
    }
  },

  setCustomerDetails: ({ name, phone }) =>
    set({ customerName: name, customerPhone: phone }),

  setOrderNote: (orderNote) => set({ orderNote }),

  applyCoupon: (code) => {
    const clean = code.trim().toUpperCase();
    const subtotal = get().getSubtotal();
    
    // Sample valid coupons: DINE10 (10% off), FLAT50 (₹50 off)
    if (clean === 'DINE10') {
      const discount = Math.round(subtotal * 0.1);
      set({ couponCode: clean, discountAmount: discount });
      return true;
    } else if (clean === 'FLAT50') {
      const discount = Math.min(subtotal, 50);
      set({ couponCode: clean, discountAmount: discount });
      return true;
    }
    return false;
  },

  removeCoupon: () => set({ couponCode: '', discountAmount: 0 }),

  addItem: (item, variant, addons = [], instructions = '') => {
    const unitPrice =
      (variant ? variant.price : item.basePrice) +
      addons.reduce((sum, a) => sum + a.price, 0);

    // Create unique identity based on selections
    const addonsKey = addons
      .map((a) => a.name)
      .sort()
      .join('|');
    const cartId = `${item.id}_${variant?.name || 'def'}_${addonsKey}`;

    const items = get().items;
    const existingIndex = items.findIndex((i) => i.cartId === cartId);

    if (existingIndex > -1) {
      const existing = items[existingIndex];
      const newQty = existing.quantity + 1;
      const updatedItem: CartItem = {
        ...existing,
        quantity: newQty,
        itemTotal: newQty * existing.unitPrice,
        specialInstructions: instructions || existing.specialInstructions,
      };
      const newItems = [...items];
      newItems[existingIndex] = updatedItem;
      set({ items: newItems });
    } else {
      const newItem: CartItem = {
        cartId,
        itemId: item.id,
        name: item.name,
        basePrice: item.basePrice,
        type: item.type,
        image: item.image,
        selectedVariant: variant,
        selectedAddons: addons,
        unitPrice,
        quantity: 1,
        itemTotal: unitPrice,
        specialInstructions: instructions,
      };
      set({ items: [...items, newItem] });
    }
  },

  updateQuantity: (cartId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(cartId);
      return;
    }
    const items = get().items.map((i) =>
      i.cartId === cartId
        ? { ...i, quantity, itemTotal: quantity * i.unitPrice }
        : i
    );
    set({ items });
  },

  removeItem: (cartId) => {
    set({ items: get().items.filter((i) => i.cartId !== cartId) });
  },

  clearCart: () => set({ items: [], orderNote: '' }),

  getItemCount: () =>
    get().items.reduce((sum, i) => sum + i.quantity, 0),

  getSubtotal: () =>
    get().items.reduce((sum, i) => sum + i.itemTotal, 0),

  getTaxAmount: (taxPercent: number) => {
    const discountedSubtotal = Math.max(0, get().getSubtotal() - get().discountAmount);
    return Math.round((discountedSubtotal * (taxPercent / 100)) * 100) / 100;
  },

  getTotal: (taxPercent: number) => {
    const discountedSubtotal = Math.max(0, get().getSubtotal() - get().discountAmount);
    const tax = get().getTaxAmount(taxPercent);
    return Math.round((discountedSubtotal + tax) * 100) / 100;
  },
}));

