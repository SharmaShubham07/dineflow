import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Cafe, Floor, Table } from '@/types/cafe';
import { UserProfile } from '@/types/auth';
import { generateUnguessableToken } from '@/lib/qr';

// In-memory fallback cache when running offline or before Firebase is connected
let localCafesCache: Cafe[] = [];
let localFloorsCache: Record<string, Floor[]> = {};
let localTablesCache: Record<string, Table[]> = {};
let localAdminsCache: UserProfile[] = [];

// Initialize local storage fallback
const loadLocalState = () => {
  try {
    const cafes = localStorage.getItem('dineflow_local_cafes');
    if (cafes) localCafesCache = JSON.parse(cafes);
    const floors = localStorage.getItem('dineflow_local_floors');
    if (floors) localFloorsCache = JSON.parse(floors);
    const tables = localStorage.getItem('dineflow_local_tables');
    if (tables) localTablesCache = JSON.parse(tables);
    const admins = localStorage.getItem('dineflow_local_admins');
    if (admins) localAdminsCache = JSON.parse(admins);
  } catch (e) {
    console.warn('Local storage load error:', e);
  }
};
loadLocalState();

const saveLocalState = () => {
  try {
    localStorage.setItem('dineflow_local_cafes', JSON.stringify(localCafesCache));
    localStorage.setItem('dineflow_local_floors', JSON.stringify(localFloorsCache));
    localStorage.setItem('dineflow_local_tables', JSON.stringify(localTablesCache));
    localStorage.setItem('dineflow_local_admins', JSON.stringify(localAdminsCache));
  } catch (e) {
    console.warn('Local storage save error:', e);
  }
};

/**
 * Fetch all cafes (Super Admin)
 */
export async function getCafes(): Promise<Cafe[]> {
  try {
    const snap = await getDocs(collection(db, 'cafes'));
    if (!snap.empty) {
      const cafes = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Cafe));
      localCafesCache = cafes;
      saveLocalState();
      return cafes;
    }
  } catch (e) {
    console.warn('Firebase error, using local/cached cafes:', e);
  }
  return localCafesCache;
}

/**
 * Fetch a single cafe by ID
 */
export async function getCafeById(cafeId: string): Promise<Cafe | null> {
  try {
    const snap = await getDoc(doc(db, 'cafes', cafeId));
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as Cafe;
    }
  } catch (e) {
    console.warn('Firebase error fetching cafe:', e);
  }
  return localCafesCache.find((c) => c.id === cafeId) || null;
}

/**
 * Create a new cafe with initial floors and auto-generated tables.
 */
export async function createCafeWithFloors(
  cafeData: Omit<Cafe, 'id' | 'createdAt'>,
  floorsConfig: { name: string; tableCount: number; prefix?: string }[]
): Promise<Cafe> {
  const cafeId = 'cafe_' + Math.random().toString(36).substring(2, 9);
  const newCafe: Cafe = {
    ...cafeData,
    id: cafeId,
    createdAt: new Date().toISOString(),
  };

  const createdFloors: Floor[] = [];
  const createdTables: Table[] = [];

  floorsConfig.forEach((fc, floorIdx) => {
    const floorId = 'floor_' + Math.random().toString(36).substring(2, 9);
    const floor: Floor = {
      id: floorId,
      cafeId,
      name: fc.name,
      order: floorIdx + 1,
      tableCount: fc.tableCount,
    };
    createdFloors.push(floor);

    const prefix = fc.prefix || `F${floorIdx + 1}-T`;
    for (let i = 1; i <= fc.tableCount; i++) {
      const tableId = 'table_' + Math.random().toString(36).substring(2, 9);
      const table: Table = {
        id: tableId,
        cafeId,
        floorId,
        floorName: fc.name,
        number: i,
        label: `${prefix}${i}`,
        capacity: 4,
        qrToken: generateUnguessableToken(16),
        status: 'free',
      };
      createdTables.push(table);
    }
  });

  // Try saving to Firestore
  try {
    const batch = writeBatch(db);
    batch.set(doc(db, 'cafes', cafeId), {
      ...newCafe,
      createdAt: serverTimestamp(),
    });

    for (const f of createdFloors) {
      batch.set(doc(db, 'cafes', cafeId, 'floors', f.id), f);
    }

    for (const t of createdTables) {
      batch.set(doc(db, 'cafes', cafeId, 'tables', t.id), t);
    }

    await batch.commit();
  } catch (e) {
    console.warn('Firebase write failed, saved to local cache:', e);
  }

  // Update local cache
  localCafesCache.unshift(newCafe);
  localFloorsCache[cafeId] = createdFloors;
  localTablesCache[cafeId] = createdTables;
  saveLocalState();

  return newCafe;
}

/**
 * Update Cafe details
 */
export async function updateCafe(cafeId: string, updates: Partial<Cafe>): Promise<void> {
  try {
    await updateDoc(doc(db, 'cafes', cafeId), updates);
  } catch (e) {
    console.warn('Firebase error updating cafe:', e);
  }

  const idx = localCafesCache.findIndex((c) => c.id === cafeId);
  if (idx !== -1) {
    localCafesCache[idx] = { ...localCafesCache[idx], ...updates };
    saveLocalState();
  }
}

/**
 * Delete a cafe
 */
export async function deleteCafe(cafeId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'cafes', cafeId));
  } catch (e) {
    console.warn('Firebase error deleting cafe:', e);
  }

  localCafesCache = localCafesCache.filter((c) => c.id !== cafeId);
  delete localFloorsCache[cafeId];
  delete localTablesCache[cafeId];
  saveLocalState();
}

/**
 * Fetch floors for a cafe
 */
export async function getFloors(cafeId: string): Promise<Floor[]> {
  try {
    const snap = await getDocs(
      query(collection(db, 'cafes', cafeId, 'floors'), orderBy('order', 'asc'))
    );
    if (!snap.empty) {
      const floors = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Floor));
      localFloorsCache[cafeId] = floors;
      saveLocalState();
      return floors;
    }
  } catch (e) {
    console.warn('Firebase error fetching floors:', e);
  }
  return localFloorsCache[cafeId] || [];
}

/**
 * Fetch tables for a cafe
 */
export async function getTables(cafeId: string): Promise<Table[]> {
  try {
    const snap = await getDocs(collection(db, 'cafes', cafeId, 'tables'));
    if (!snap.empty) {
      const tables = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Table));
      localTablesCache[cafeId] = tables;
      saveLocalState();
      return tables;
    }
  } catch (e) {
    console.warn('Firebase error fetching tables:', e);
  }
  return localTablesCache[cafeId] || [];
}

/**
 * Add a table to a floor
 */
export async function addTable(
  cafeId: string,
  floorId: string,
  floorName: string,
  label: string,
  capacity: number = 4
): Promise<Table> {
  const tableId = 'table_' + Math.random().toString(36).substring(2, 9);
  const currentTables = localTablesCache[cafeId] || [];
  const nextNum = currentTables.filter((t) => t.floorId === floorId).length + 1;

  const newTable: Table = {
    id: tableId,
    cafeId,
    floorId,
    floorName,
    number: nextNum,
    label: label || `T${nextNum}`,
    capacity,
    qrToken: generateUnguessableToken(16),
    status: 'free',
  };

  try {
    await setDoc(doc(db, 'cafes', cafeId, 'tables', tableId), newTable);
  } catch (e) {
    console.warn('Firebase error adding table:', e);
  }

  if (!localTablesCache[cafeId]) localTablesCache[cafeId] = [];
  localTablesCache[cafeId].push(newTable);
  saveLocalState();

  return newTable;
}

/**
 * Regenerate QR token for a table (invalidating old QR)
 */
export async function regenerateTableQRToken(cafeId: string, tableId: string): Promise<string> {
  const newToken = generateUnguessableToken(16);
  try {
    await updateDoc(doc(db, 'cafes', cafeId, 'tables', tableId), {
      qrToken: newToken,
    });
  } catch (e) {
    console.warn('Firebase error rotating QR token:', e);
  }

  const tables = localTablesCache[cafeId] || [];
  const target = tables.find((t) => t.id === tableId);
  if (target) {
    target.qrToken = newToken;
    saveLocalState();
  }
  return newToken;
}

/**
 * Fetch Admin users
 */
export async function getAdminUsers(): Promise<UserProfile[]> {
  try {
    const snap = await getDocs(query(collection(db, 'users'), where('role', '==', 'admin')));
    if (!snap.empty) {
      const admins = snap.docs.map((d) => ({ uid: d.id, ...d.data() } as UserProfile));
      localAdminsCache = admins;
      saveLocalState();
      return admins;
    }
  } catch (e) {
    console.warn('Firebase error fetching admins:', e);
  }
  return localAdminsCache;
}

/**
 * Create Admin user profile
 */
export async function createAdminUser(
  adminData: Omit<UserProfile, 'uid' | 'createdAt'>
): Promise<UserProfile> {
  const uid = 'admin_' + Math.random().toString(36).substring(2, 9);
  const newAdmin: UserProfile = {
    ...adminData,
    uid,
    createdAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'users', uid), {
      ...newAdmin,
      createdAt: serverTimestamp(),
    });
  } catch (e) {
    console.warn('Firebase error creating admin user doc:', e);
  }

  localAdminsCache.unshift(newAdmin);
  saveLocalState();
  return newAdmin;
}

