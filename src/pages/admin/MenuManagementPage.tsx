import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Switch } from '@/components/ui/Switch';
import { EmptyState } from '@/components/ui/EmptyState';
import { toast } from '@/components/ui/ToastStore';
import { MenuItemModal } from '@/components/admin/MenuItemModal';
import { CategoryModal } from '@/components/admin/CategoryModal';
import {
  getCategories,
  getMenuItems,
  createCategory,
  deleteCategory,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  seedSampleMenuForCafe,
} from '@/lib/menuFirestore';
import { getCafes } from '@/lib/firestore';
import { MenuItem, MenuCategory } from '@/types/cafe';
import {
  Plus,
  Coffee,
  Sparkles,
  Edit2,
  Trash2,
  Clock,
  Layers,
  Search,
} from 'lucide-react';

export const MenuManagementPage: React.FC = () => {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentCafeId, setCurrentCafeId] = useState<string>('');

  // Modals
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);

  const loadMenuData = async (cafeIdToUse?: string) => {
    setLoading(true);
    try {
      let targetCafeId = cafeIdToUse || currentCafeId;
      if (!targetCafeId) {
        const cafes = await getCafes();
        targetCafeId = cafes[0]?.id || 'demo_cafe_1';
        setCurrentCafeId(targetCafeId);
      }

      const [cats, menuItems] = await Promise.all([
        getCategories(targetCafeId),
        getMenuItems(targetCafeId),
      ]);
      setCategories(cats);
      setItems(menuItems);
    } catch (e) {
      toast.error('Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenuData();
  }, []);

  const handleSeedMenu = async () => {
    if (!currentCafeId) return;
    setIsSeeding(true);
    try {
      await seedSampleMenuForCafe(currentCafeId);
      toast.success('Sample specialty menu seeded with 6 categories and 7 items!');
      await loadMenuData();
    } catch (e: any) {
      toast.error('Failed to seed menu: ' + e.message);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleToggleStock = async (item: MenuItem) => {
    const nextVal = !item.available;
    await updateMenuItem(currentCafeId, item.id, { available: nextVal });
    setItems(items.map((i) => (i.id === item.id ? { ...i, available: nextVal } : i)));
    toast.info(`${item.name} marked ${nextVal ? 'In Stock' : 'Out of Stock'}`);
  };

  const handleDeleteItem = async (item: MenuItem) => {
    if (!confirm(`Delete "${item.name}" from menu?`)) return;
    await deleteMenuItem(currentCafeId, item.id);
    setItems(items.filter((i) => i.id !== item.id));
    toast.success(`Removed "${item.name}"`);
  };

  const handleSaveItem = async (itemData: Omit<MenuItem, 'id' | 'cafeId'>) => {
    if (editingItem) {
      await updateMenuItem(currentCafeId, editingItem.id, itemData);
      setItems(
        items.map((i) =>
          i.id === editingItem.id ? { ...i, ...itemData } : i
        )
      );
    } else {
      const created = await createMenuItem(currentCafeId, itemData);
      setItems([created, ...items]);
    }
    setEditingItem(null);
  };

  const handleCreateCat = async (name: string) => {
    const created = await createCategory(currentCafeId, name);
    setCategories([...categories, created]);
  };

  const handleDeleteCat = async (cat: MenuCategory) => {
    if (!confirm(`Delete category "${cat.name}"?`)) return;
    await deleteCategory(currentCafeId, cat.id);
    setCategories(categories.filter((c) => c.id !== cat.id));
    toast.success(`Category "${cat.name}" deleted.`);
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesCategory =
      selectedCategory === 'all' || item.categoryId === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            Menu & Pricing Management
          </h2>
          <p className="text-sm text-stone-500">
            Manage dishes, drinks, portion sizes, add-ons, and real-time 86/stock availability.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {items.length === 0 && (
            <Button
              variant="outline"
              size="sm"
              loading={isSeeding}
              onClick={handleSeedMenu}
              leftIcon={<Sparkles className="h-4 w-4 text-accent" />}
            >
              Seed Sample Cafe Menu
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCategoryModalOpen(true)}
            leftIcon={<Layers className="h-4 w-4" />}
          >
            New Category
          </Button>

          <Button
            size="sm"
            onClick={() => {
              if (categories.length === 0) {
                toast.error('Please add a menu category first!');
                setIsCategoryModalOpen(true);
                return;
              }
              setEditingItem(null);
              setIsItemModalOpen(true);
            }}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Add Menu Item
          </Button>
        </div>
      </div>

      {/* Search & Categories Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Category Chips */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto py-1">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === 'all'
                  ? 'bg-accent text-white shadow-sm'
                  : 'bg-stone-200/70 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-300'
              }`}
            >
              All Items ({items.length})
            </button>

            {categories.map((cat) => (
              <div key={cat.id} className="relative inline-flex items-center group">
                <button
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-accent text-white shadow-sm'
                      : 'bg-stone-200/70 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-300'
                  }`}
                >
                  {cat.name} ({items.filter((i) => i.categoryId === cat.id).length})
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCat(cat);
                  }}
                  className="opacity-0 group-hover:opacity-100 ml-1 p-1 text-stone-400 hover:text-red-500 transition-opacity"
                  title="Delete Category"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>

          {/* Search box */}
          <div className="w-full sm:w-64 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
            <input
              type="text"
              placeholder="Search dishes, ingredients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full min-h-[38px] pl-9 pr-3 rounded-xl border border-stone-300/80 bg-white/70 dark:border-stone-700/80 dark:bg-stone-900/60 text-xs focus:outline-none focus:border-accent"
            />
          </div>
        </div>
      </div>

      {/* Menu Items Grid */}
      {loading ? (
        <div className="p-8 text-center text-stone-500">Loading menu database...</div>
      ) : filteredItems.length === 0 ? (
        <GlassCard className="p-8">
          <EmptyState
            icon={<Coffee className="h-8 w-8 text-accent" />}
            title={items.length === 0 ? 'Menu is Empty' : 'No items match your filter'}
            description={
              items.length === 0
                ? "Click 'Seed Sample Cafe Menu' to load classic coffees, burgers, sourdough toasts, and desserts instantly."
                : 'Try clearing your search term or picking a different category.'
            }
            actionLabel={items.length === 0 ? 'Seed Sample Menu' : 'Show All Items'}
            onAction={
              items.length === 0 ? handleSeedMenu : () => setSelectedCategory('all')
            }
          />
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map((item) => (
            <GlassCard
              key={item.id}
              variant="raised"
              className={`p-0 overflow-hidden flex flex-col justify-between transition-all ${
                !item.available ? 'opacity-60 grayscale-[40%]' : ''
              }`}
            >
              {/* Photo Header */}
              <div className="relative h-44 w-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-stone-400">
                    <Coffee className="h-10 w-10 opacity-30" />
                  </div>
                )}

                {/* Dietary badge on photo */}
                <div className="absolute top-3 left-3 bg-white/90 dark:bg-stone-900/90 backdrop-blur-sm p-1.5 rounded-lg shadow-sm">
                  <Badge variant={item.type} size="md" />
                </div>

                {/* Stock status indicator */}
                <div className="absolute top-3 right-3">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold tracking-tight shadow-sm backdrop-blur-md ${
                      item.available
                        ? 'bg-emerald-500/90 text-white'
                        : 'bg-rose-500/90 text-white'
                    }`}
                  >
                    {item.available ? 'In Stock' : 'Sold Out'}
                  </span>
                </div>
              </div>

              {/* Item Details */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-base text-stone-900 dark:text-stone-100 line-clamp-1">
                      {item.name}
                    </h3>
                    <span className="font-bold text-base text-accent shrink-0">
                      ₹{item.basePrice}
                    </span>
                  </div>

                  <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 mt-1">
                    {item.description || 'Delicious culinary preparation crafted fresh.'}
                  </p>
                </div>

                {/* Variants & Addons count badges */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-100 dark:border-stone-800 text-[11px] text-stone-500">
                  <span className="flex items-center gap-1 font-medium">
                    <Clock className="h-3.5 w-3.5 text-stone-400" />
                    {item.prepMinutes} mins
                  </span>

                  {item.variants && item.variants.length > 0 && (
                    <span className="bg-stone-200/70 dark:bg-stone-800 px-2 py-0.5 rounded-md font-medium">
                      {item.variants.length} sizes
                    </span>
                  )}

                  {item.addons && item.addons.length > 0 && (
                    <span className="bg-stone-200/70 dark:bg-stone-800 px-2 py-0.5 rounded-md font-medium">
                      +{item.addons.length} extras
                    </span>
                  )}

                  {item.tags?.slice(0, 2).map((t) => (
                    <span
                      key={t}
                      className="bg-accent/10 text-accent px-2 py-0.5 rounded-md font-semibold"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Bar */}
              <div className="p-3 px-5 bg-stone-50/80 dark:bg-stone-900/40 border-t border-stone-200/50 dark:border-stone-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={item.available}
                    onChange={() => handleToggleStock(item)}
                    label={item.available ? 'Available' : 'Unavailable'}
                  />
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingItem(item);
                      setIsItemModalOpen(true);
                    }}
                    title="Edit Item"
                    className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item)}
                    title="Delete Item"
                    className="p-1.5 rounded-lg text-stone-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Modals */}
      <MenuItemModal
        isOpen={isItemModalOpen}
        onClose={() => {
          setIsItemModalOpen(false);
          setEditingItem(null);
        }}
        categories={categories}
        initialItem={editingItem}
        onSubmit={handleSaveItem}
      />

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSubmit={handleCreateCat}
      />
    </div>
  );
};

export default MenuManagementPage;

