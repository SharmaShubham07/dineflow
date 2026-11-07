import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { Badge } from '@/components/ui/Badge';
import { MenuItem, MenuCategory, DietType, MenuItemVariant, MenuItemAddon } from '@/types/cafe';
import { toast } from '@/components/ui/ToastStore';
import { Plus, Trash2, UtensilsCrossed, Clock, Tag } from 'lucide-react';

interface MenuItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: MenuCategory[];
  initialItem?: MenuItem | null;
  onSubmit: (itemData: Omit<MenuItem, 'id' | 'cafeId'>) => Promise<void>;
}

export const MenuItemModal: React.FC<MenuItemModalProps> = ({
  isOpen,
  onClose,
  categories,
  initialItem,
  onSubmit,
}) => {
  const [name, setName] = useState(initialItem?.name || '');
  const [description, setDescription] = useState(initialItem?.description || '');
  const [categoryId, setCategoryId] = useState(
    initialItem?.categoryId || categories[0]?.id || ''
  );
  const [type, setType] = useState<DietType>(initialItem?.type || 'veg');
  const [basePrice, setBasePrice] = useState(
    initialItem ? String(initialItem.basePrice) : '250'
  );
  const [image, setImage] = useState(initialItem?.image || '');
  const [prepMinutes, setPrepMinutes] = useState(
    initialItem ? String(initialItem.prepMinutes) : '10'
  );
  const [available, setAvailable] = useState(
    initialItem ? initialItem.available : true
  );
  const [tagsInput, setTagsInput] = useState(
    initialItem?.tags ? initialItem.tags.join(', ') : 'Popular'
  );

  // Variants & Addons
  const [variants, setVariants] = useState<MenuItemVariant[]>(
    initialItem?.variants || []
  );
  const [addons, setAddons] = useState<MenuItemAddon[]>(
    initialItem?.addons || []
  );

  const [loading, setLoading] = useState(false);

  // Add / remove variant
  const handleAddVariant = () => {
    setVariants([...variants, { name: 'Large', price: Number(basePrice) + 40 }]);
  };
  const handleRemoveVariant = (idx: number) => {
    setVariants(variants.filter((_, i) => i !== idx));
  };
  const handleVariantChange = (idx: number, field: 'name' | 'price', val: any) => {
    setVariants(
      variants.map((v, i) => (i === idx ? { ...v, [field]: val } : v))
    );
  };

  // Add / remove addon
  const handleAddAddon = () => {
    setAddons([...addons, { name: 'Extra Cheese', price: 50 }]);
  };
  const handleRemoveAddon = (idx: number) => {
    setAddons(addons.filter((_, i) => i !== idx));
  };
  const handleAddonChange = (idx: number, field: 'name' | 'price', val: any) => {
    setAddons(
      addons.map((a, i) => (i === idx ? { ...a, [field]: val } : a))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Item name is required');
      return;
    }
    if (!categoryId) {
      toast.error('Please assign a category');
      return;
    }

    const priceNum = parseFloat(basePrice);
    if (isNaN(priceNum) || priceNum < 0) {
      toast.error('Please enter a valid base price');
      return;
    }

    setLoading(true);
    try {
      const parsedTags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      await onSubmit({
        categoryId,
        name: name.trim(),
        description: description.trim(),
        image: image.trim() || undefined,
        type,
        basePrice: priceNum,
        variants: variants.map((v) => ({ ...v, price: Number(v.price) || 0 })),
        addons: addons.map((a) => ({ ...a, price: Number(a.price) || 0 })),
        prepMinutes: parseInt(prepMinutes) || 10,
        available,
        tags: parsedTags,
      });

      toast.success(
        initialItem
          ? `Updated "${name}"`
          : `Added "${name}" to menu!`
      );
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save menu item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialItem ? 'Edit Dish / Beverage' : 'Add New Menu Item'}
      description="Configure pricing, dietary tags, variants, and addons."
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">
        {/* Name & Category */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <Input
              label="Item Name *"
              placeholder="e.g. Avocado Toast with Poached Egg"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-300 mb-1.5">
              Category *
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-stone-300/80 bg-white/70 px-3.5 py-2 text-sm text-stone-900 transition-colors focus:border-accent focus:bg-white dark:border-stone-700/80 dark:bg-stone-900/60 dark:text-stone-100 dark:focus:border-accent"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dietary Type & Availability */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-3.5 rounded-xl bg-stone-100/70 dark:bg-stone-800/40 border border-stone-200/60 dark:border-stone-700/60">
          <div>
            <span className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300 mb-2">
              Dietary Classification
            </span>
            <div className="flex items-center gap-2">
              {(['veg', 'nonveg', 'egg'] as DietType[]).map((d) => (
                <button
                  type="button"
                  key={d}
                  onClick={() => setType(d)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    type === d
                      ? 'border-accent bg-accent/15 text-accent shadow-sm'
                      : 'border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300'
                  }`}
                >
                  <Badge variant={d} size="sm" />
                  <span className="capitalize">{d}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase text-stone-500">
              In Stock / Available
            </span>
            <Switch checked={available} onChange={setAvailable} />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-300">
            Description
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Crisp sourdough topped with guacamole, heirloom tomatoes, and aged balsamic glaze..."
            className="w-full rounded-xl border border-stone-300/80 bg-white/70 p-3 text-sm text-stone-900 transition-colors placeholder:text-stone-400 focus:border-accent focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent/20 dark:border-stone-700/80 dark:bg-stone-900/60 dark:text-stone-100"
          />
        </div>

        {/* Pricing & Prep Time */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Base Price (₹) *"
            type="number"
            min="0"
            step="1"
            value={basePrice}
            onChange={(e) => setBasePrice(e.target.value)}
            required
          />
          <Input
            label="Prep Time (Minutes)"
            type="number"
            min="1"
            value={prepMinutes}
            onChange={(e) => setPrepMinutes(e.target.value)}
            leftIcon={<Clock className="h-4 w-4" />}
          />
          <Input
            label="Tags (Comma separated)"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="Chef Special, Spicy"
            leftIcon={<Tag className="h-4 w-4" />}
          />
        </div>

        {/* Image URL */}
        <Input
          label="Food Photo URL (WebP or CDN)"
          placeholder="https://images.unsplash.com/..."
          value={image}
          onChange={(e) => setImage(e.target.value)}
        />

        {/* Variants Section */}
        <div className="pt-3 border-t border-stone-200/60 dark:border-stone-800 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                Portion & Size Variants (Optional)
              </h4>
              <p className="text-[11px] text-stone-500">
                e.g. Regular, Large, Half, Full
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddVariant}
              leftIcon={<Plus className="h-3.5 w-3.5" />}
            >
              Add Variant
            </Button>
          </div>

          {variants.map((v, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Variant Name (e.g. Large / 500ml)"
                value={v.name}
                onChange={(e) => handleVariantChange(idx, 'name', e.target.value)}
                className="flex-1 min-h-[38px] rounded-lg border border-stone-300 dark:border-stone-700 px-3 text-xs bg-white/80 dark:bg-stone-900"
              />
              <div className="w-28 relative flex items-center">
                <span className="absolute left-2.5 text-xs text-stone-400">₹</span>
                <input
                  type="number"
                  placeholder="Price"
                  value={v.price}
                  onChange={(e) =>
                    handleVariantChange(idx, 'price', parseFloat(e.target.value) || 0)
                  }
                  className="w-full min-h-[38px] rounded-lg border border-stone-300 dark:border-stone-700 pl-6 pr-2 text-xs bg-white/80 dark:bg-stone-900 text-center"
                />
              </div>
              <button
                type="button"
                onClick={() => handleRemoveVariant(idx)}
                className="p-1.5 text-stone-400 hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Addons Section */}
        <div className="pt-3 border-t border-stone-200/60 dark:border-stone-800 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                Custom Add-ons & Extras (Optional)
              </h4>
              <p className="text-[11px] text-stone-500">
                e.g. Extra Cheese (+₹40), Oat Milk (+₹50)
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddAddon}
              leftIcon={<Plus className="h-3.5 w-3.5" />}
            >
              Add Extra
            </Button>
          </div>

          {addons.map((a, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Addon Name (e.g. Extra Bacon)"
                value={a.name}
                onChange={(e) => handleAddonChange(idx, 'name', e.target.value)}
                className="flex-1 min-h-[38px] rounded-lg border border-stone-300 dark:border-stone-700 px-3 text-xs bg-white/80 dark:bg-stone-900"
              />
              <div className="w-28 relative flex items-center">
                <span className="absolute left-2.5 text-xs text-stone-400">₹</span>
                <input
                  type="number"
                  placeholder="Price"
                  value={a.price}
                  onChange={(e) =>
                    handleAddonChange(idx, 'price', parseFloat(e.target.value) || 0)
                  }
                  className="w-full min-h-[38px] rounded-lg border border-stone-300 dark:border-stone-700 pl-6 pr-2 text-xs bg-white/80 dark:bg-stone-900 text-center"
                />
              </div>
              <button
                type="button"
                onClick={() => handleRemoveAddon(idx)}
                className="p-1.5 text-stone-400 hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200/60 dark:border-stone-800">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading} leftIcon={<UtensilsCrossed className="h-4 w-4" />}>
            {initialItem ? 'Save Changes' : 'Add to Menu'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

