export interface Cafe {
  id: string;
  name: string;
  logo?: string;
  address: string;
  phone: string;
  gstNumber?: string;
  taxPercent: number;
  currency: string;
  upiId?: string;
  upiQrImage?: string;
  status: 'active' | 'suspended';
  createdAt?: any;
}

export interface Floor {
  id: string;
  cafeId: string;
  name: string;
  order: number;
  tableCount: number;
}

export type TableStatus = 'free' | 'occupied' | 'ordered' | 'billRequested';

export interface Table {
  id: string;
  cafeId: string;
  floorId: string;
  floorName?: string;
  number: number;
  label: string;
  capacity: number;
  qrToken: string;
  status: TableStatus;
  currentSessionId?: string;
}

export interface MenuItemVariant {
  name: string;
  price: number;
}

export interface MenuItemAddon {
  name: string;
  price: number;
}

export type DietType = 'veg' | 'nonveg' | 'egg';

export interface MenuItem {
  id: string;
  cafeId: string;
  categoryId: string;
  name: string;
  description: string;
  image?: string;
  type: DietType;
  basePrice: number;
  variants: MenuItemVariant[];
  addons: MenuItemAddon[];
  prepMinutes: number;
  available: boolean;
  tags: string[];
}

export interface MenuCategory {
  id: string;
  cafeId: string;
  name: string;
  order: number;
  active: boolean;
}

export interface OrderItem {
  id: string;
  itemId: string;
  name: string;
  qty: number;
  variant?: MenuItemVariant;
  addons?: MenuItemAddon[];
  price: number;
  itemTotal: number;
  type: DietType;
}

export type OrderStatus = 'new' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';

export interface OrderPayment {
  method?: 'cash' | 'upi' | 'card';
  status: 'pending' | 'paid' | 'partial';
  paidAmount?: number;
  reference?: string;
}

export interface Order {
  id: string;
  cafeId: string;
  sessionId?: string;
  tableId: string;
  tableNumber: string;
  floorName: string;
  source: 'qr' | 'staff';
  items: OrderItem[];
  note?: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: OrderStatus;
  payment: OrderPayment;
  createdAt: any;
  updatedAt?: any;
}

export interface TableSession {
  id: string;
  cafeId: string;
  tableId: string;
  startedAt: any;
  status: 'active' | 'closed';
  customerName?: string;
  customerPhone?: string;
}

