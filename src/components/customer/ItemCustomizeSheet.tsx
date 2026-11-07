import React, { useState } from 'react';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { MenuItem, MenuItemVariant, MenuItemAddon } from '@/types/cafe';
import { Check, Plus, Minus } from 'lucide-react';

interface ItemCustomizeSheetProps {
  isOpen: boolean;
  onClose: () => void;
  item: MenuItem | null;
  onAddToCart: (
    item: MenuItem,
    variant?: MenuItemVariant,
    addons?: MenuItemAddon[],
    instructions?: string
  ) => void;
}

export const ItemCustomizeSheet: React.FC<ItemCustomizeSheetProps> = ({
  isOpen,
  onClose,
  item,
  onAddToCart,
}) => {
  if (!item) return null;

  const [selectedVariant, setSelectedVariant] = useState<MenuItemVariant | undefined>(
    item.variants?.[0]
  );
  const [selectedAddons, setSelectedAddons] = useState<MenuItemAddon[]>([]);
  const [instructions, setInstructions] = useState('');
  const [quantity, setQuantity] = useState(1);

  const toggleAddon = (addon: MenuItemAddon) => {
    if (selectedAddons.some((a) => a.name === addon.name)) {
      setSelectedAddons(selectedAddons.filter((a) => a.name !== addon.name));
    } else {
      setSelectedAddons([...selectedAddons, addon]);
    }
  };

  const unitPrice =
    (selectedVariant ? selectedVariant.price : item.basePrice) +
    selectedAddons.reduce((sum, a) => sum + a.price, 0);

  const totalPrice = unitPrice * quantity;

  const handleAdd = () => {
    onAddToCart(item, selectedVariant, selectedAddons, instructions);
    onClose();
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} position="bottom" className="p-5 max-w-md mx-auto">
      <div className="space-y-4">
        {/* Item Header */}
        <div className="flex items-start gap-3">
          <Badge variant={item.type} size="md" className="mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
              {item.name}
            </h3>
            <p className="text-xs text-stone-500 mt-0.5 line-clamp-2">
              {item.description}
            </p>
          </div>
        </div>

        {/* Variants Selection */}
        {item.variants && item.variants.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-stone-200/60 dark:border-stone-800">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Select Portion / Size
            </span>
            <div className="grid grid-cols-2 gap-2">
              {item.variants.map((v) => {
                const isSelected = selectedVariant?.name === v.name;
                return (
                  <button
                    key={v.name}
                    type="button"
                    onClick={() => setSelectedVariant(v)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition-all ${
                      isSelected
                        ? 'border-accent bg-accent/10 text-accent ring-1 ring-accent'
                        : 'border-stone-200 dark:border-stone-700 bg-white/70 dark:bg-stone-900 text-stone-800 dark:text-stone-200'
                    }`}
                  >
                    <span>{v.name}</span>
                    <span>₹{v.price}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Addons Selection */}
        {item.addons && item.addons.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-stone-200/60 dark:border-stone-800">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Choose Add-ons & Extras
            </span>
            <div className="space-y-1.5">
              {item.addons.map((addon) => {
                const isSelected = selectedAddons.some((a) => a.name === addon.name);
                return (
                  <button
                    key={addon.name}
                    type="button"
                    onClick={() => toggleAddon(addon)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all ${
                      isSelected
                        ? 'border-accent bg-accent/10 text-accent font-semibold'
                        : 'border-stone-200 dark:border-stone-700 bg-white/70 dark:bg-stone-900 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-4 w-4 rounded flex items-center justify-center border ${
                          isSelected ? 'bg-accent border-accent text-white' : 'border-stone-400'
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>
                      <span>{addon.name}</span>
                    </div>
                    <span>+₹{addon.price}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Special Cooking Note */}
        <div className="space-y-1.5 pt-2 border-t border-stone-200/60 dark:border-stone-800">
          <label className="text-xs font-semibold text-stone-500">
            Cooking note / allergies
          </label>
          <input
            type="text"
            placeholder="e.g. Less sugar, extra crispy, no onions"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            className="w-full text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-white/70 dark:bg-stone-900 p-2.5 focus:border-accent focus:outline-none"
          />
        </div>

        {/* Bottom Bar: Stepper & Add Button */}
        <div className="flex items-center gap-3 pt-3 border-t border-stone-200/60 dark:border-stone-800">
          <div className="inline-flex items-center border border-stone-300 dark:border-stone-700 rounded-xl bg-white dark:bg-stone-900 p-1">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="p-1.5 text-stone-600 dark:text-stone-300 hover:text-accent"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-8 text-center text-xs font-bold text-stone-900 dark:text-stone-100">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="p-1.5 text-stone-600 dark:text-stone-300 hover:text-accent"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <Button onClick={handleAdd} className="flex-1 font-bold">
            Add to Order · ₹{totalPrice}
          </Button>
        </div>
      </div>
    </Drawer>
  );
};

