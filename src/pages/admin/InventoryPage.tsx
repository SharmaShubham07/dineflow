import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useInventoryStore } from '@/stores/inventoryStore';
import { getCafes } from '@/lib/firestore';
import {
  Boxes,
  AlertTriangle,
  Plus,
  Minus,
  Search,
  Trash2,
} from 'lucide-react';

export const InventoryPage: React.FC = () => {
  const { inventory, initInventoryFromMenu, addItem, deleteItem, updateStock, getLowStockItems } =
    useInventoryStore();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'low'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New item form state
  const [newItemName, setNewItemName] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('portions');
  const [newItemStock, setNewItemStock] = useState('30');
  const [newItemThreshold, setNewItemThreshold] = useState('5');

  useEffect(() => {
    const loadItems = async () => {
      const cafes = await getCafes();
      if (cafes[0]) {
        const localItems = JSON.parse(
          localStorage.getItem('dineflow_local_items') || '{}'
        );
        const menuItems = localItems[cafes[0].id] || [];
        initInventoryFromMenu(menuItems);
      }
    };
    loadItems();
  }, []);

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    addItem({
      name: newItemName.trim(),
      unit: newItemUnit,
      currentStock: parseInt(newItemStock) || 0,
      lowStockThreshold: parseInt(newItemThreshold) || 5,
      trackStock: true,
    });
    setNewItemName('');
    setIsAddModalOpen(false);
  };

  const itemsList = Object.values(inventory);
  const lowStockItems = getLowStockItems();

  const filteredItems = itemsList.filter((item) => {
    const matchesFilter = filter === 'all' || item.currentStock <= item.lowStockThreshold;
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Boxes className="h-6 w-6 text-accent" />
            Kitchen Inventory & Stock Alerts
          </h2>
          <p className="text-sm text-stone-500">
            Real-time stock deduction on orders, depletion tracking, and low-inventory warnings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {lowStockItems.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs font-bold text-amber-700 dark:text-amber-300">
              <AlertTriangle className="h-4 w-4" />
              <span>{lowStockItems.length} running low!</span>
            </div>
          )}

          <Button
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Add Stock Item
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="inline-flex rounded-xl bg-stone-200/70 dark:bg-stone-800 p-1 text-xs font-semibold">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'all'
                ? 'bg-white dark:bg-stone-900 text-accent shadow-sm'
                : 'text-stone-500'
            }`}
          >
            All Items ({itemsList.length})
          </button>
          <button
            onClick={() => setFilter('low')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'low'
                ? 'bg-white dark:bg-stone-900 text-accent shadow-sm'
                : 'text-stone-500'
            }`}
          >
            Low Stock Alerts ({lowStockItems.length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search ingredient / item..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white/70 dark:bg-stone-900 focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      {/* Inventory Table */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="divide-y divide-stone-100 dark:divide-stone-800">
          <div className="p-4 grid grid-cols-12 text-xs font-bold text-stone-500 uppercase tracking-wider bg-stone-50 dark:bg-stone-900/50">
            <span className="col-span-5">Item / Ingredient</span>
            <span className="col-span-2 text-center">Status</span>
            <span className="col-span-4 text-right">Stock Level</span>
            <span className="col-span-1 text-right"></span>
          </div>

          {filteredItems.map((item) => {
            const isLow = item.currentStock <= item.lowStockThreshold;

            return (
              <div
                key={item.itemId}
                className="p-4 grid grid-cols-12 items-center text-xs hover:bg-stone-50/50 dark:hover:bg-stone-900/30 transition-colors"
              >
                <div className="col-span-5">
                  <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                    {item.name}
                  </h4>
                  <p className="text-[11px] text-stone-500">
                    Alert threshold: &le; {item.lowStockThreshold} {item.unit}
                  </p>
                </div>

                <div className="col-span-2 text-center">
                  <Badge variant={isLow ? 'error' : 'success'} size="sm">
                    {isLow ? 'Low Stock' : 'In Stock'}
                  </Badge>
                </div>

                <div className="col-span-4 flex items-center justify-end gap-2">
                  <div className="inline-flex items-center border border-stone-300 dark:border-stone-700 rounded-xl bg-white dark:bg-stone-900 px-2 py-1">
                    <button
                      onClick={() => updateStock(item.itemId, item.currentStock - 1)}
                      className="p-1 text-stone-500 hover:text-accent font-bold"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-10 text-center font-extrabold text-sm text-stone-900 dark:text-stone-100">
                      {item.currentStock}
                    </span>
                    <button
                      onClick={() => updateStock(item.itemId, item.currentStock + 5)}
                      title="Add 5 portions"
                      className="p-1 text-stone-500 hover:text-accent font-bold"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <span className="text-[11px] font-semibold text-stone-500 w-16">
                    {item.unit}
                  </span>
                </div>

                <div className="col-span-1 text-right">
                  <button
                    onClick={() => deleteItem(item.itemId)}
                    title="Remove item"
                    className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* Add Stock Item Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Inventory Item / Stock"
        description="Track raw materials, kitchen ingredients, or packaged goods."
        size="sm"
      >
        <form onSubmit={handleCreateItem} className="space-y-4">
          <Input
            label="Item / Ingredient Name *"
            placeholder="e.g. Arabica Coffee Beans, Burrata Cheese"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            required
            autoFocus
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-300 mb-1.5">
                Unit of Measure
              </label>
              <select
                value={newItemUnit}
                onChange={(e) => setNewItemUnit(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-stone-300 dark:border-stone-700 bg-white/70 dark:bg-stone-900 px-3 text-xs"
              >
                <option value="portions">portions</option>
                <option value="kg">kg</option>
                <option value="liters">liters</option>
                <option value="pcs">pcs</option>
                <option value="cups">cups</option>
                <option value="packs">packs</option>
              </select>
            </div>

            <Input
              label="Initial Stock *"
              type="number"
              min="0"
              value={newItemStock}
              onChange={(e) => setNewItemStock(e.target.value)}
              required
            />
          </div>

          <Input
            label="Low-Stock Alert Threshold"
            type="number"
            min="1"
            value={newItemThreshold}
            onChange={(e) => setNewItemThreshold(e.target.value)}
          />

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200 dark:border-stone-800">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" leftIcon={<Plus className="h-4 w-4" />}>
              Add to Stock
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default InventoryPage;
