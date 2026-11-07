import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { ItemCustomizeSheet } from '@/components/customer/ItemCustomizeSheet';
import { useCartStore } from '@/stores/cartStore';
import { getTableByQRToken } from '@/lib/orderService';
import { getCategories, getMenuItems, seedSampleMenuForCafe } from '@/lib/menuFirestore';
import { seedDemoPlatformData } from '@/lib/seed';
import { MenuItem, MenuCategory, Cafe, Table, DietType } from '@/types/cafe';
import {
  Coffee,
  ShoppingBag,
  Search,
} from 'lucide-react';

export const MenuPage: React.FC = () => {
  const { cafeId, token } = useParams<{ cafeId: string; token: string }>();
  const navigate = useNavigate();

  const [cafe, setCafe] = useState<Cafe | null>(null);
  const [table, setTable] = useState<Table | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [dietFilter, setDietFilter] = useState<'all' | DietType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Customization sheet
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);

  // Cart store
  const { setTableContext, addItem, getItemCount, getSubtotal } = useCartStore();

  const itemCount = getItemCount();
  const subtotal = getSubtotal();

  const loadCustomerData = async () => {
    if (!cafeId || !token) return;
    setLoading(true);

    try {
      let result = await getTableByQRToken(cafeId, token);

      // If opening demo or no seeded data yet, seed it automatically
      if (!result) {
        const demo = await seedDemoPlatformData();
        await seedSampleMenuForCafe(demo.cafe.id);
        result = await getTableByQRToken(demo.cafe.id, token);
        if (!result) {
          // Fallback to table 1 of demo
          const localTables = JSON.parse(
            localStorage.getItem('dineflow_local_tables') || '{}'
          );
          const tList: Table[] = localTables[demo.cafe.id] || [];
          if (tList[0]) {
            result = { cafe: demo.cafe, table: tList[0] };
          }
        }
      }

      if (result) {
        setCafe(result.cafe);
        setTable(result.table);

        setTableContext({
          cafeId: result.cafe.id,
          tableId: result.table.id,
          tableNumber: result.table.label,
          floorName: result.table.floorName || 'Dining Area',
        });

        // Load menu for this cafe
        let [cats, menuItems] = await Promise.all([
          getCategories(result.cafe.id),
          getMenuItems(result.cafe.id),
        ]);

        if (menuItems.length === 0) {
          await seedSampleMenuForCafe(result.cafe.id);
          [cats, menuItems] = await Promise.all([
            getCategories(result.cafe.id),
            getMenuItems(result.cafe.id),
          ]);
        }

        setCategories(cats);
        setItems(menuItems);
      }
    } catch (e) {
      console.warn('Customer load error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomerData();
  }, [cafeId, token]);

  const handleOpenCustomize = (item: MenuItem) => {
    // If no variants or addons, quick add
    if ((!item.variants || item.variants.length === 0) && (!item.addons || item.addons.length === 0)) {
      addItem(item);
    } else {
      setCustomizingItem(item);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesCat =
      selectedCategory === 'all' || item.categoryId === selectedCategory;
    const matchesDiet = dietFilter === 'all' || item.type === dietFilter;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesDiet && matchesSearch;
  });

  if (loading) {
    return (
      <div className="p-8 text-center text-stone-500 space-y-3">
        <div className="h-10 w-10 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-semibold">Loading Table Menu...</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Table Greeting Banner */}
      <GlassCard variant="raised" className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-accent block">
              {cafe?.name || 'DineFlow Cafe'}
            </span>
            <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">
              Table {table?.label || '5'}
            </h2>
            <p className="text-xs text-stone-500">
              {table?.floorName || 'Ground Floor'} · Capacity {table?.capacity || 4}
            </p>
          </div>
          <Badge variant="success" size="sm">
            Ready to Order
          </Badge>
        </div>
      </GlassCard>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-stone-400" />
        <input
          type="text"
          placeholder="Search food, coffee, desserts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full min-h-[44px] pl-10 pr-4 text-xs rounded-2xl border border-stone-200 dark:border-stone-800 bg-white/80 dark:bg-stone-900/80 focus:outline-none focus:border-accent"
        />
      </div>

      {/* Dietary Filters & Category Chips (Sticky Header) */}
      <div className="sticky top-14 z-20 bg-surface-light/95 dark:bg-surface-dark/95 backdrop-blur-md -mx-4 px-4 py-2 space-y-2 border-b border-stone-200/60 dark:border-stone-800/60">
        {/* Veg / Non-Veg Quick Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setDietFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              dietFilter === 'all'
                ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                : 'bg-stone-200/70 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setDietFilter('veg')}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
              dietFilter === 'veg'
                ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700'
                : 'border-stone-300 dark:border-stone-700 bg-transparent text-stone-600'
            }`}
          >
            <Badge variant="veg" size="sm" /> Veg
          </button>
          <button
            onClick={() => setDietFilter('nonveg')}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
              dietFilter === 'nonveg'
                ? 'border-rose-600 bg-rose-50 dark:bg-rose-950/40 text-rose-700'
                : 'border-stone-300 dark:border-stone-700 bg-transparent text-stone-600'
            }`}
          >
            <Badge variant="nonveg" size="sm" /> Non-Veg
          </button>
        </div>

        {/* Categories Bar */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-accent text-white shadow-sm'
                : 'bg-stone-200/70 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
            }`}
          >
            All Categories ({items.length})
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === c.id
                  ? 'bg-accent text-white shadow-sm'
                  : 'bg-stone-200/70 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Dishes List */}
      {filteredItems.length === 0 ? (
        <GlassCard className="p-8">
          <EmptyState
            icon={<Coffee className="h-8 w-8 text-accent" />}
            title="No Items Found"
            description="Try changing your search term or dietary filter."
          />
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item) => (
            <GlassCard
              key={item.id}
              variant="flat"
              className={`p-3.5 flex gap-3 transition-all ${
                !item.available ? 'opacity-50 grayscale' : ''
              }`}
            >
              {/* Item Info */}
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Badge variant={item.type} size="sm" />
                    {item.tags?.slice(0, 1).map((t) => (
                      <span
                        key={t}
                        className="text-[10px] font-bold text-accent uppercase tracking-wider"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                    {item.name}
                  </h3>

                  <p className="text-xs text-stone-500 line-clamp-2 mt-0.5 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <span className="font-bold text-sm text-stone-900 dark:text-stone-100">
                    ₹{item.basePrice}
                  </span>
                  {item.variants && item.variants.length > 0 && (
                    <span className="text-[10px] text-stone-400">
                      • {item.variants.length} sizes
                    </span>
                  )}
                </div>
              </div>

              {/* Photo & Add Action */}
              <div className="relative w-24 h-24 shrink-0 rounded-2xl overflow-hidden bg-stone-200 dark:bg-stone-800">
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                )}

                {/* Add button pinned on image bottom */}
                <div className="absolute inset-x-1 bottom-1">
                  <Button
                    size="sm"
                    disabled={!item.available}
                    onClick={() => handleOpenCustomize(item)}
                    className="w-full text-xs font-bold py-1 min-h-[32px] rounded-xl shadow-lg bg-white/95 text-accent hover:bg-white dark:bg-stone-900/95 dark:text-accent border border-stone-200/80 dark:border-stone-700"
                  >
                    {item.available ? 'ADD +' : 'SOLD OUT'}
                  </Button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Floating Bottom Cart Bar */}
      {itemCount > 0 && (
        <div className="fixed bottom-3 left-0 right-0 max-w-md mx-auto px-4 z-40 animate-slideUp">
          <div
            onClick={() => navigate(`/m/${cafeId}/${token}/cart`)}
            className="cursor-pointer glass-surface p-3.5 rounded-2xl flex items-center justify-between shadow-2xl border border-white/60 dark:border-stone-700 bg-accent text-white"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center font-bold text-sm">
                {itemCount}
              </div>
              <div>
                <p className="text-[11px] text-white/80 font-medium">Table {table?.label}</p>
                <p className="text-sm font-bold">₹{subtotal} · View Cart</p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs font-bold bg-white text-accent px-3.5 py-2 rounded-xl shadow-sm">
              <ShoppingBag className="h-4 w-4" />
              <span>Checkout</span>
            </div>
          </div>
        </div>
      )}

      {/* Item Customization Sheet */}
      <ItemCustomizeSheet
        isOpen={Boolean(customizingItem)}
        onClose={() => setCustomizingItem(null)}
        item={customizingItem}
        onAddToCart={(i, v, a, note) => addItem(i, v, a, note)}
      />
    </div>
  );
};

export default MenuPage;
