import { create } from 'zustand';
import { MenuItem } from '@/types/cafe';
import { toast } from '@/components/ui/ToastStore';

export interface InventoryItem {
  itemId: string;
  name: string;
  categoryName?: string;
  currentStock: number;
  lowStockThreshold: number;
  unit: string; // 'portions', 'cups', 'pcs', 'kg'
  trackStock: boolean;
}

interface InventoryStore {
  inventory: Record<string, InventoryItem>;
  initInventoryFromMenu: (menuItems: MenuItem[]) => void;
  addItem: (item: Omit<InventoryItem, 'itemId'>) => void;
  deleteItem: (itemId: string) => void;
  updateStock: (itemId: string, newStock: number) => void;
  deductStockForOrder: (orderItems: { itemId: string; qty: number; name: string }[]) => void;
  getLowStockItems: () => InventoryItem[];
}

export const useInventoryStore = create<InventoryStore>((set, get) => ({
  inventory: JSON.parse(localStorage.getItem('dineflow_inventory') || '{}'),

  initInventoryFromMenu: (menuItems: MenuItem[]) => {
    const current = { ...get().inventory };
    let hasNew = false;

    menuItems.forEach((item) => {
      if (!current[item.id]) {
        current[item.id] = {
          itemId: item.id,
          name: item.name,
          currentStock: 25, // Default stock count
          lowStockThreshold: 5,
          unit: 'portions',
          trackStock: true,
        };
        hasNew = true;
      }
    });

    if (hasNew) {
      set({ inventory: current });
      localStorage.setItem('dineflow_inventory', JSON.stringify(current));
    }
  },

  addItem: (itemData) => {
    const current = { ...get().inventory };
    const itemId = 'inv_' + Math.random().toString(36).substring(2, 9);
    current[itemId] = {
      ...itemData,
      itemId,
    };
    set({ inventory: current });
    localStorage.setItem('dineflow_inventory', JSON.stringify(current));
    toast.success(`"${itemData.name}" added to inventory!`);
  },

  deleteItem: (itemId) => {
    const current = { ...get().inventory };
    delete current[itemId];
    set({ inventory: current });
    localStorage.setItem('dineflow_inventory', JSON.stringify(current));
    toast.success('Item removed from inventory');
  },

  updateStock: (itemId, newStock) => {
    const current = { ...get().inventory };
    if (current[itemId]) {
      current[itemId].currentStock = Math.max(0, newStock);
      set({ inventory: current });
      localStorage.setItem('dineflow_inventory', JSON.stringify(current));
    }
  },

  deductStockForOrder: (orderItems) => {
    const current = { ...get().inventory };
    const lowStockAlerts: string[] = [];

    orderItems.forEach((oi) => {
      if (current[oi.itemId] && current[oi.itemId].trackStock) {
        current[oi.itemId].currentStock = Math.max(0, current[oi.itemId].currentStock - oi.qty);
        if (current[oi.itemId].currentStock <= current[oi.itemId].lowStockThreshold) {
          lowStockAlerts.push(`${oi.name} (Only ${current[oi.itemId].currentStock} left!)`);
        }
      }
    });

    set({ inventory: current });
    localStorage.setItem('dineflow_inventory', JSON.stringify(current));

    if (lowStockAlerts.length > 0) {
      toast.warning(`Low Stock Alert: ${lowStockAlerts.join(', ')}`);
    }
  },

  getLowStockItems: () => {
    return Object.values(get().inventory).filter(
      (item) => item.trackStock && item.currentStock <= item.lowStockThreshold
    );
  },
}));

