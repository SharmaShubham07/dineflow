import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  where,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Order, Table, Cafe } from '@/types/cafe';
import { CartItem } from '@/stores/cartStore';

let localOrdersCache: Order[] = [];

const loadLocalOrders = () => {
  try {
    const saved = localStorage.getItem('dineflow_local_orders');
    if (saved) localOrdersCache = JSON.parse(saved);
  } catch (e) {
    console.warn('Orders storage load error:', e);
  }
};
loadLocalOrders();

const saveLocalOrders = () => {
  try {
    localStorage.setItem('dineflow_local_orders', JSON.stringify(localOrdersCache));
  } catch (e) {
    console.warn('Orders storage save error:', e);
  }
};

/**
 * Validate and verify a table using cafeId + qrToken
 */
export async function getTableByQRToken(
  cafeId: string,
  token: string
): Promise<{ cafe: Cafe; table: Table } | null> {
  // Check local tables first for offline/mock performance
  const localTables = JSON.parse(localStorage.getItem('dineflow_local_tables') || '{}');
  const cafeTables: Table[] = localTables[cafeId] || [];
  const foundTable = cafeTables.find((t) => t.qrToken === token);

  const localCafes: Cafe[] = JSON.parse(localStorage.getItem('dineflow_local_cafes') || '[]');
  const foundCafe = localCafes.find((c) => c.id === cafeId);

  if (foundTable && foundCafe) {
    return { cafe: foundCafe, table: foundTable };
  }

  // Fallback to Firestore
  try {
    const cafeSnap = await getDoc(doc(db, 'cafes', cafeId));
    if (!cafeSnap.exists()) return null;
    const cafe = { id: cafeSnap.id, ...cafeSnap.data() } as Cafe;

    const q = query(
      collection(db, 'cafes', cafeId, 'tables'),
      where('qrToken', '==', token)
    );
    const tableSnap = await getDocs(q);
    if (!tableSnap.empty) {
      const table = { id: tableSnap.docs[0].id, ...tableSnap.docs[0].data() } as Table;
      return { cafe, table };
    }
  } catch (e) {
    console.warn('Firestore table check error:', e);
  }

  return null;
}

/**
 * Place a new customer order from QR cart
 */
export async function placeCustomerOrder(params: {
  cafeId: string;
  table: Table;
  items: CartItem[];
  note?: string;
  taxPercent: number;
  customerName?: string;
  customerPhone?: string;
}): Promise<Order> {
  const { cafeId, table, items, note, taxPercent } = params;

  const subtotal = items.reduce((sum, i) => sum + i.itemTotal, 0);
  const tax = Math.round((subtotal * (taxPercent / 100)) * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;

  const orderId = 'ord_' + Math.random().toString(36).substring(2, 9);

  const newOrder: Order = {
    id: orderId,
    cafeId,
    tableId: table.id,
    tableNumber: table.label,
    floorName: table.floorName || 'Dining Area',
    source: 'qr',
    items: items.map((i) => ({
      id: i.cartId,
      itemId: i.itemId,
      name: i.name,
      qty: i.quantity,
      variant: i.selectedVariant,
      addons: i.selectedAddons,
      price: i.unitPrice,
      itemTotal: i.itemTotal,
      type: i.type,
    })),
    note,
    subtotal,
    tax,
    discount: 0,
    total,
    status: 'new',
    payment: {
      status: 'pending',
    },
    createdAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'cafes', cafeId, 'orders', orderId), {
      ...newOrder,
      createdAt: serverTimestamp(),
    });

    // Mark table status as ordered
    await updateDoc(doc(db, 'cafes', cafeId, 'tables', table.id), {
      status: 'ordered',
    });
  } catch (e) {
    console.warn('Firestore order write error:', e);
  }

  localOrdersCache.unshift(newOrder);
  saveLocalOrders();

  // Trigger audio or vibration if supported
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate([100, 50, 100]);
  }

  return newOrder;
}

/**
 * Fetch an order by ID
 */
export async function getOrderById(
  cafeId: string,
  orderId: string
): Promise<Order | null> {
  const local = localOrdersCache.find((o) => o.id === orderId && o.cafeId === cafeId);
  if (local) return local;

  try {
    const snap = await getDoc(doc(db, 'cafes', cafeId, 'orders', orderId));
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as Order;
    }
  } catch (e) {
    console.warn('Firestore fetch order error:', e);
  }

  return null;
}

/**
 * Listen to real-time status updates on a placed order
 */
export function subscribeToOrder(
  cafeId: string,
  orderId: string,
  callback: (order: Order | null) => void
): () => void {
  try {
    const unsub = onSnapshot(doc(db, 'cafes', cafeId, 'orders', orderId), (snap) => {
      if (snap.exists()) {
        callback({ id: snap.id, ...snap.data() } as Order);
      } else {
        const local = localOrdersCache.find((o) => o.id === orderId);
        callback(local || null);
      }
    });
    return unsub;
  } catch (e) {
    const local = localOrdersCache.find((o) => o.id === orderId);
    callback(local || null);
    return () => {};
  }
}

/**
 * Request bill / mark table for billing
 */
export async function requestTableBill(
  cafeId: string,
  tableId: string
): Promise<void> {
  try {
    await updateDoc(doc(db, 'cafes', cafeId, 'tables', tableId), {
      status: 'billRequested',
    });
  } catch (e) {
    console.warn('Bill request update error:', e);
  }
}

