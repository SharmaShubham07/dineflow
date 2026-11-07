import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { MenuCategory, MenuItem } from '@/types/cafe';

let localCategoriesCache: Record<string, MenuCategory[]> = {};
let localItemsCache: Record<string, MenuItem[]> = {};

const loadLocalMenu = () => {
  try {
    const cats = localStorage.getItem('dineflow_local_categories');
    if (cats) localCategoriesCache = JSON.parse(cats);
    const items = localStorage.getItem('dineflow_local_items');
    if (items) localItemsCache = JSON.parse(items);
  } catch (e) {
    console.warn('Local storage load menu error:', e);
  }
};
loadLocalMenu();

const saveLocalMenu = () => {
  try {
    localStorage.setItem('dineflow_local_categories', JSON.stringify(localCategoriesCache));
    localStorage.setItem('dineflow_local_items', JSON.stringify(localItemsCache));
  } catch (e) {
    console.warn('Local storage save menu error:', e);
  }
};

/**
 * Fetch categories for a cafe
 */
export async function getCategories(cafeId: string): Promise<MenuCategory[]> {
  try {
    const snap = await getDocs(
      query(collection(db, 'cafes', cafeId, 'categories'), orderBy('order', 'asc'))
    );
    if (!snap.empty) {
      const cats = snap.docs.map((d) => ({ id: d.id, ...d.data() } as MenuCategory));
      localCategoriesCache[cafeId] = cats;
      saveLocalMenu();
      return cats;
    }
  } catch (e) {
    console.warn('Firebase error fetching categories:', e);
  }
  return localCategoriesCache[cafeId] || [];
}

/**
 * Create a new category
 */
export async function createCategory(
  cafeId: string,
  name: string
): Promise<MenuCategory> {
  const currentCats = localCategoriesCache[cafeId] || [];
  const catId = 'cat_' + Math.random().toString(36).substring(2, 9);
  const newCat: MenuCategory = {
    id: catId,
    cafeId,
    name: name.trim(),
    order: currentCats.length + 1,
    active: true,
  };

  try {
    await setDoc(doc(db, 'cafes', cafeId, 'categories', catId), newCat);
  } catch (e) {
    console.warn('Firebase error creating category:', e);
  }

  if (!localCategoriesCache[cafeId]) localCategoriesCache[cafeId] = [];
  localCategoriesCache[cafeId].push(newCat);
  saveLocalMenu();
  return newCat;
}

/**
 * Update category
 */
export async function updateCategory(
  cafeId: string,
  catId: string,
  updates: Partial<MenuCategory>
): Promise<void> {
  try {
    await updateDoc(doc(db, 'cafes', cafeId, 'categories', catId), updates);
  } catch (e) {
    console.warn('Firebase error updating category:', e);
  }

  const cats = localCategoriesCache[cafeId] || [];
  const target = cats.find((c) => c.id === catId);
  if (target) {
    Object.assign(target, updates);
    saveLocalMenu();
  }
}

/**
 * Delete category and optionally its items
 */
export async function deleteCategory(cafeId: string, catId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'cafes', cafeId, 'categories', catId));
  } catch (e) {
    console.warn('Firebase error deleting category:', e);
  }

  if (localCategoriesCache[cafeId]) {
    localCategoriesCache[cafeId] = localCategoriesCache[cafeId].filter((c) => c.id !== catId);
    saveLocalMenu();
  }
}

/**
 * Fetch menu items for a cafe
 */
export async function getMenuItems(cafeId: string): Promise<MenuItem[]> {
  try {
    const snap = await getDocs(collection(db, 'cafes', cafeId, 'items'));
    if (!snap.empty) {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as MenuItem));
      localItemsCache[cafeId] = items;
      saveLocalMenu();
      return items;
    }
  } catch (e) {
    console.warn('Firebase error fetching items:', e);
  }
  return localItemsCache[cafeId] || [];
}

/**
 * Create or save a menu item
 */
export async function createMenuItem(
  cafeId: string,
  itemData: Omit<MenuItem, 'id' | 'cafeId'>
): Promise<MenuItem> {
  const itemId = 'item_' + Math.random().toString(36).substring(2, 9);
  const newItem: MenuItem = {
    ...itemData,
    id: itemId,
    cafeId,
  };

  try {
    await setDoc(doc(db, 'cafes', cafeId, 'items', itemId), newItem);
  } catch (e) {
    console.warn('Firebase error creating item:', e);
  }

  if (!localItemsCache[cafeId]) localItemsCache[cafeId] = [];
  localItemsCache[cafeId].unshift(newItem);
  saveLocalMenu();
  return newItem;
}

/**
 * Update a menu item
 */
export async function updateMenuItem(
  cafeId: string,
  itemId: string,
  updates: Partial<MenuItem>
): Promise<void> {
  try {
    await updateDoc(doc(db, 'cafes', cafeId, 'items', itemId), updates);
  } catch (e) {
    console.warn('Firebase error updating item:', e);
  }

  const items = localItemsCache[cafeId] || [];
  const target = items.find((i) => i.id === itemId);
  if (target) {
    Object.assign(target, updates);
    saveLocalMenu();
  }
}

/**
 * Delete a menu item
 */
export async function deleteMenuItem(cafeId: string, itemId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'cafes', cafeId, 'items', itemId));
  } catch (e) {
    console.warn('Firebase error deleting item:', e);
  }

  if (localItemsCache[cafeId]) {
    localItemsCache[cafeId] = localItemsCache[cafeId].filter((i) => i.id !== itemId);
    saveLocalMenu();
  }
}

/**
 * Batch seed rich menu categories and items for a cafe
 */
export async function seedSampleMenuForCafe(cafeId: string): Promise<void> {
  const sampleCategories = [
    { name: 'Specialty Coffee', order: 1 },
    { name: 'Artisan Teas & Coolers', order: 2 },
    { name: 'All-Day Breakfast & Sourdough', order: 3 },
    { name: 'Burgers & Gourmet Sandwiches', order: 4 },
    { name: 'Pizzas & Pastas', order: 5 },
    { name: 'Desserts & Bakes', order: 6 },
  ];

  const createdCategories: MenuCategory[] = [];
  for (const sc of sampleCategories) {
    const cat = await createCategory(cafeId, sc.name);
    createdCategories.push(cat);
  }

  const coffeeCat = createdCategories[0]?.id;
  const beverageCat = createdCategories[1]?.id;
  const breakfastCat = createdCategories[2]?.id;
  const burgerCat = createdCategories[3]?.id;
  const dessertCat = createdCategories[5]?.id;

  const sampleItems: Omit<MenuItem, 'id' | 'cafeId'>[] = [
    {
      categoryId: coffeeCat,
      name: 'Classic Flat White',
      description: 'Double ristretto shot with micro-foamed whole milk and velvety texture.',
      image: 'https://images.unsplash.com/photo-1577968897966-3d4325b36b61?w=500&auto=format&fit=crop&q=80',
      type: 'veg',
      basePrice: 220,
      variants: [
        { name: 'Regular (240ml)', price: 220 },
        { name: 'Large (350ml)', price: 260 },
      ],
      addons: [
        { name: 'Oat Milk Substitute', price: 40 },
        { name: 'Extra Espresso Shot', price: 50 },
        { name: 'Vanilla Bean Syrup', price: 30 },
      ],
      prepMinutes: 5,
      available: true,
      tags: ['Bestseller', 'Hot', 'Coffee'],
    },
    {
      categoryId: coffeeCat,
      name: 'Signature Iced Spanish Latte',
      description: 'Espresso poured over condensed milk, chilled fresh milk, and crystal ice.',
      image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=500&auto=format&fit=crop&q=80',
      type: 'veg',
      basePrice: 260,
      variants: [
        { name: 'Regular', price: 260 },
        { name: 'Large', price: 300 },
      ],
      addons: [
        { name: 'Whipped Cream', price: 30 },
        { name: 'Hazelnut Drizzle', price: 35 },
      ],
      prepMinutes: 6,
      available: true,
      tags: ['Signature', 'Cold', 'Sweet'],
    },
    {
      categoryId: breakfastCat,
      name: 'Truffle Scrambled Eggs on Sourdough',
      description: 'Slow-cooked creamy eggs infused with black truffle oil on toasted rustic sourdough.',
      image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=500&auto=format&fit=crop&q=80',
      type: 'egg',
      basePrice: 340,
      variants: [],
      addons: [
        { name: 'Avocado Slices', price: 80 },
        { name: 'Grilled Mushrooms', price: 60 },
        { name: 'Extra Sourdough Slice', price: 50 },
      ],
      prepMinutes: 12,
      available: true,
      tags: ['Chef Special', 'Breakfast'],
    },
    {
      categoryId: burgerCat,
      name: 'Crispy Peri-Peri Chicken Burger',
      description: 'Panko fried chicken thigh, peri-peri spiced glaze, house purple slaw and brioche bun.',
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80',
      type: 'nonveg',
      basePrice: 390,
      variants: [
        { name: 'Single Patty', price: 390 },
        { name: 'Double Patty', price: 490 },
      ],
      addons: [
        { name: 'Smoked Cheddar Melt', price: 50 },
        { name: 'Truffle Parmesan Fries', price: 90 },
      ],
      prepMinutes: 15,
      available: true,
      tags: ['Spicy', 'Crispy', 'Popular'],
    },
    {
      categoryId: breakfastCat,
      name: 'Avocado & Burrata Sourdough Toast',
      description: 'Hass avocado mash, heirloom cherry tomatoes, fresh artisanal burrata, balsamic reduction.',
      image: 'https://images.unsplash.com/photo-1588137378633-dea1336ce1e2?w=500&auto=format&fit=crop&q=80',
      type: 'veg',
      basePrice: 420,
      variants: [],
      addons: [
        { name: 'Poached Egg', price: 50 },
        { name: 'Extra Burrata Ball', price: 120 },
      ],
      prepMinutes: 10,
      available: true,
      tags: ['Healthy', 'Vegetarian'],
    },
    {
      categoryId: beverageCat,
      name: 'Wild Berry & Mint Sparkling Cooler',
      description: 'Crushed blueberries, raspberries, garden mint, lime spritz and sparkling soda.',
      image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=80',
      type: 'veg',
      basePrice: 240,
      variants: [],
      addons: [],
      prepMinutes: 4,
      available: true,
      tags: ['Refreshing', 'Cold'],
    },
    {
      categoryId: dessertCat,
      name: 'Warm Belgian Chocolate Fondant',
      description: 'Gooey molten dark chocolate centre served with Madagascar vanilla bean gelato.',
      image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&auto=format&fit=crop&q=80',
      type: 'egg',
      basePrice: 310,
      variants: [],
      addons: [
        { name: 'Extra Scoop of Gelato', price: 70 },
      ],
      prepMinutes: 14,
      available: true,
      tags: ['Dessert', 'Warm'],
    },
  ];

  for (const item of sampleItems) {
    await createMenuItem(cafeId, item);
  }
}
