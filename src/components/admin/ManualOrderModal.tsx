import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Table, MenuItem } from '@/types/cafe';
import { toast } from '@/components/ui/ToastStore';
import { Plus, Trash2, ShoppingBag } from 'lucide-react';

interface ManualOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  tables: Table[];
  menuItems: MenuItem[];
  taxPercent: number;
  onSubmit: (orderData: {
    table: Table;
    items: { item: MenuItem; qty: number; variantName?: string }[];
    note?: string;
  }) => Promise<void>;
}

export const ManualOrderModal: React.FC<ManualOrderModalProps> = ({
  isOpen,
  onClose,
  tables,
  menuItems,
  taxPercent,
  onSubmit,
}) => {
  const [selectedTableId, setSelectedTableId] = useState<string>(
    tables[0]?.id || ''
  );
  const [selectedItems, setSelectedItems] = useState<
    { itemId: string; qty: number; variantIndex?: number }[]
  >([]);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddItemRow = () => {
    if (menuItems.length === 0) return;
    setSelectedItems([
      ...selectedItems,
      { itemId: menuItems[0].id, qty: 1, variantIndex: undefined },
    ]);
  };

  const handleRemoveItemRow = (idx: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== idx));
  };

  const handleUpdateItemRow = (idx: number, field: string, val: any) => {
    setSelectedItems(
      selectedItems.map((r, i) => (i === idx ? { ...r, [field]: val } : r))
    );
  };

  // Subtotal computation
  const subtotal = selectedItems.reduce((sum, row) => {
    const item = menuItems.find((m) => m.id === row.itemId);
    if (!item) return sum;
    const price =
      typeof row.variantIndex === 'number' && item.variants?.[row.variantIndex]
        ? item.variants[row.variantIndex].price
        : item.basePrice;
    return sum + price * row.qty;
  }, 0);

  const tax = Math.round((subtotal * (taxPercent / 100)) * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const table = tables.find((t) => t.id === selectedTableId);
    if (!table) {
      toast.error('Please pick a table');
      return;
    }
    if (selectedItems.length === 0) {
      toast.error('Add at least one item to the order');
      return;
    }

    setLoading(true);
    try {
      const orderItems = selectedItems.map((row) => {
        const item = menuItems.find((m) => m.id === row.itemId)!;
        const variantName =
          typeof row.variantIndex === 'number' && item.variants?.[row.variantIndex]
            ? item.variants[row.variantIndex].name
            : undefined;
        return { item, qty: row.qty, variantName };
      });

      await onSubmit({ table, items: orderItems, note });
      toast.success(`Manual order placed for Table ${table.label}!`);
      onClose();
    } catch (e: any) {
      toast.error('Failed to create manual order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Staff / Walk-In Order"
      description="Create a manual ticket for customers who ordered at the counter or without QR."
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Table Selector */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-300 mb-1.5">
            Select Dining Table *
          </label>
          <select
            value={selectedTableId}
            onChange={(e) => setSelectedTableId(e.target.value)}
            className="w-full min-h-[44px] rounded-xl border border-stone-300/80 bg-white/70 px-3.5 py-2 text-sm text-stone-900 transition-colors focus:border-accent dark:border-stone-700/80 dark:bg-stone-900/60 dark:text-stone-100"
          >
            {tables.map((t) => (
              <option key={t.id} value={t.id}>
                Table {t.label} ({t.floorName || 'Dining Area'} · Status: {t.status})
              </option>
            ))}
          </select>
        </div>

        {/* Items Rows */}
        <div className="space-y-2 pt-2 border-t border-stone-200/60 dark:border-stone-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Ordered Dishes & Beverages
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddItemRow}
              leftIcon={<Plus className="h-3.5 w-3.5" />}
            >
              Add Item
            </Button>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {selectedItems.map((row, idx) => {
              const currentItem = menuItems.find((m) => m.id === row.itemId);

              return (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2 rounded-xl bg-stone-100/70 dark:bg-stone-800/40 border border-stone-200/60 dark:border-stone-700/60"
                >
                  {/* Item Picker */}
                  <select
                    value={row.itemId}
                    onChange={(e) =>
                      handleUpdateItemRow(idx, 'itemId', e.target.value)
                    }
                    className="flex-1 min-h-[36px] text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-2"
                  >
                    {menuItems.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} (₹{m.basePrice})
                      </option>
                    ))}
                  </select>

                  {/* Variant Picker if exists */}
                  {currentItem?.variants && currentItem.variants.length > 0 && (
                    <select
                      value={row.variantIndex ?? ''}
                      onChange={(e) =>
                        handleUpdateItemRow(
                          idx,
                          'variantIndex',
                          e.target.value === '' ? undefined : Number(e.target.value)
                        )
                      }
                      className="w-28 min-h-[36px] text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-2"
                    >
                      <option value="">Base Size</option>
                      {currentItem.variants.map((v, vIdx) => (
                        <option key={v.name} value={vIdx}>
                          {v.name} (₹{v.price})
                        </option>
                      ))}
                    </select>
                  )}

                  {/* Qty */}
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={row.qty}
                    onChange={(e) =>
                      handleUpdateItemRow(idx, 'qty', parseInt(e.target.value) || 1)
                    }
                    className="w-16 min-h-[36px] text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-center font-bold"
                  />

                  <button
                    type="button"
                    onClick={() => handleRemoveItemRow(idx)}
                    className="p-1.5 text-stone-400 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Note */}
        <Input
          label="Kitchen Note"
          placeholder="e.g. VIP guest, pack for takeout"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        {/* Total Summary */}
        <div className="p-3 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-between">
          <span className="text-xs font-bold text-accent uppercase">
            Total Amount (Incl. {taxPercent}% GST)
          </span>
          <span className="text-lg font-bold text-stone-900 dark:text-stone-100">
            ₹{total}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200/60 dark:border-stone-800">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading} leftIcon={<ShoppingBag className="h-4 w-4" />}>
            Create Order Ticket
          </Button>
        </div>
      </form>
    </Modal>
  );
};

