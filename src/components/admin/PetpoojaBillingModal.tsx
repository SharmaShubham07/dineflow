import React, { useState } from 'react';
import { Table, MenuItem, MenuCategory, DietType } from '@/types/cafe';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/ToastStore';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  X,
  ShoppingBag,
  Send,
  Printer,
  CheckCircle2,
} from 'lucide-react';

interface PetpoojaBillingModalProps {
  isOpen: boolean;
  onClose: () => void;
  table: Table;
  categories: MenuCategory[];
  menuItems: MenuItem[];
  taxPercent: number;
  existingOrder?: any;
  onSubmitOrder: (orderPayload: {
    table: Table;
    items: {
      item: MenuItem;
      qty: number;
      variantName?: string;
      price: number;
      itemTotal: number;
    }[];
    note?: string;
    action: 'kot' | 'kot_and_print' | 'settle';
  }) => Promise<void>;
}

interface OrderRow {
  item: MenuItem;
  qty: number;
  variantIndex?: number;
  variantName?: string;
  price: number;
  itemTotal: number;
}

export const PetpoojaBillingModal: React.FC<PetpoojaBillingModalProps> = ({
  isOpen,
  onClose,
  table,
  categories,
  menuItems,
  taxPercent,
  existingOrder,
  onSubmitOrder,
}) => {
  if (!isOpen) return null;

  // Selected category in left menu
  const [selectedCatId, setSelectedCatId] = useState<string>('all');
  const [dietFilter, setDietFilter] = useState<'all' | DietType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [note, setNote] = useState(existingOrder?.note || '');
  const [loading, setLoading] = useState(false);

  // Initial order items (load existing if table has running session)
  const [orderItems, setOrderItems] = useState<OrderRow[]>(() => {
    if (existingOrder?.items) {
      return existingOrder.items.map((i: any) => ({
        item: {
          id: i.itemId || i.id,
          name: i.name,
          basePrice: i.price,
          type: i.type || 'veg',
        } as MenuItem,
        qty: i.qty,
        variantName: i.variant?.name,
        price: i.price,
        itemTotal: i.itemTotal || i.price * i.qty,
      }));
    }
    return [];
  });

  // Keep items updated if existingOrder changes
  React.useEffect(() => {
    if (existingOrder?.items) {
      setOrderItems(
        existingOrder.items.map((i: any) => ({
          item: {
            id: i.itemId || i.id,
            name: i.name,
            basePrice: i.price,
            type: i.type || 'veg',
          } as MenuItem,
          qty: i.qty,
          variantName: i.variant?.name,
          price: i.price,
          itemTotal: i.itemTotal || i.price * i.qty,
        }))
      );
      if (existingOrder.note) setNote(existingOrder.note);
    }
  }, [existingOrder]);

  // Add item on tile click (Petpooja one-click punch)
  const handleAddItem = (item: MenuItem, variantIdx?: number) => {
    const variant = typeof variantIdx === 'number' && item.variants?.[variantIdx];
    const price = variant ? variant.price : item.basePrice;
    const variantName = variant ? variant.name : undefined;

    const existingIdx = orderItems.findIndex(
      (row) => row.item.id === item.id && row.variantName === variantName
    );

    if (existingIdx > -1) {
      const updated = [...orderItems];
      updated[existingIdx].qty += 1;
      updated[existingIdx].itemTotal = updated[existingIdx].qty * updated[existingIdx].price;
      setOrderItems(updated);
    } else {
      setOrderItems([
        ...orderItems,
        {
          item,
          qty: 1,
          variantIndex: variantIdx,
          variantName,
          price,
          itemTotal: price,
        },
      ]);
    }
  };

  const handleUpdateQty = (idx: number, newQty: number) => {
    if (newQty <= 0) {
      setOrderItems(orderItems.filter((_, i) => i !== idx));
      return;
    }
    const updated = [...orderItems];
    updated[idx].qty = newQty;
    updated[idx].itemTotal = newQty * updated[idx].price;
    setOrderItems(updated);
  };

  const handleRemoveRow = (idx: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== idx));
  };

  // Calculations
  const subtotal = orderItems.reduce((sum, r) => sum + r.itemTotal, 0);
  const tax = Math.round((subtotal * (taxPercent / 100)) * 100) / 100;
  const grandTotal = Math.round((subtotal + tax) * 100) / 100;

  const handleAction = async (action: 'kot' | 'kot_and_print' | 'settle') => {
    if (orderItems.length === 0) {
      toast.error('Add at least one item to punch order');
      return;
    }

    setLoading(true);
    try {
      await onSubmitOrder({
        table,
        items: orderItems,
        note,
        action,
      });
      onClose();
    } catch (e: any) {
      toast.error('Failed to submit: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  // Filtered menu items
  const filteredItems = menuItems.filter((item) => {
    const matchesCat = selectedCatId === 'all' || item.categoryId === selectedCatId;
    const matchesDiet = dietFilter === 'all' || item.type === dietFilter;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesDiet && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-6xl h-[92vh] flex flex-col rounded-3xl bg-surface-light dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden">
        
        {/* Top Petpooja Header */}
        <header className="px-6 py-3.5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-white/70 dark:bg-stone-900/80">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="h-9 w-9 rounded-xl bg-accent text-white font-extrabold flex items-center justify-center text-sm shadow-sm">
                {table.label}
              </span>
              <div>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  Table {table.label} · Punch Order / KOT
                  <Badge variant={table.status === 'free' ? 'neutral' : 'accent'} size="sm">
                    {table.status.toUpperCase()}
                  </Badge>
                </h3>
                <p className="text-xs text-stone-500">
                  {table.floorName || 'Dining Area'} · Seating: {table.capacity} guests
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick search input */}
            <div className="relative w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
              <input
                type="text"
                placeholder="Search dishes or item code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full min-h-[36px] pl-9 pr-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-800 text-xs focus:outline-none focus:border-accent"
              />
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* 2-Column POS Layout */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          
          {/* Left Column: Categories + Dish Grid (60%) */}
          <div className="flex-1 flex flex-col border-r border-stone-200 dark:border-stone-800 min-w-0 bg-stone-50/50 dark:bg-stone-950/20">
            
            {/* Category Filter Chips */}
            <div className="p-3 border-b border-stone-200/80 dark:border-stone-800 flex items-center gap-2 overflow-x-auto no-scrollbar bg-white/50 dark:bg-stone-900/50">
              <button
                onClick={() => setSelectedCatId('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCatId === 'all'
                    ? 'bg-accent text-white shadow-sm'
                    : 'bg-stone-200/70 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                }`}
              >
                All Items ({menuItems.length})
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCatId(c.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCatId === c.id
                      ? 'bg-accent text-white shadow-sm'
                      : 'bg-stone-200/70 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                  }`}
                >
                  {c.name}
                </button>
              ))}

              {/* Diet toggles */}
              <div className="ml-auto flex items-center gap-1 pl-2">
                <button
                  onClick={() => setDietFilter(dietFilter === 'veg' ? 'all' : 'veg')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                    dietFilter === 'veg'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-400'
                  }`}
                >
                  Veg
                </button>
                <button
                  onClick={() => setDietFilter(dietFilter === 'nonveg' ? 'all' : 'nonveg')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                    dietFilter === 'nonveg'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                      : 'border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-400'
                  }`}
                >
                  Non-Veg
                </button>
              </div>
            </div>

            {/* Quick Helper Banner */}
            <div className="px-4 py-2.5 bg-accent/10 border-b border-accent/20 flex items-center justify-between text-xs">
              <span className="text-stone-700 dark:text-stone-200 font-medium">
                👉 <strong>How to add items:</strong> Click any dish card below to punch it into Table <strong>{table.label}</strong>'s bill.
              </span>
              <span className="text-xs font-bold text-accent">
                {orderItems.length} {orderItems.length === 1 ? 'dish' : 'dishes'} in bill
              </span>
            </div>

            {/* Menu Grid (Clickable Tiles like Petpooja POS) */}
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {filteredItems.map((item) => {
                  const inOrderRows = orderItems.filter((r) => r.item.id === item.id);
                  const currentQty = inOrderRows.reduce((sum, r) => sum + r.qty, 0);

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleAddItem(item)}
                      className={`group cursor-pointer rounded-2xl border p-3 flex flex-col justify-between transition-all active:scale-[0.98] ${
                        currentQty > 0
                          ? 'border-accent bg-accent/5 ring-1 ring-accent/30 shadow-sm'
                          : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-accent hover:shadow-md'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <Badge variant={item.type} size="sm" />
                          <span className="text-xs font-extrabold text-accent">
                            ₹{item.basePrice}
                          </span>
                        </div>
                        <h4 className="font-bold text-xs text-stone-900 dark:text-stone-100 line-clamp-2 leading-snug group-hover:text-accent transition-colors">
                          {item.name}
                        </h4>
                      </div>

                      {/* Quick Variant Pills if available */}
                      {item.variants && item.variants.length > 0 ? (
                        <div className="mt-2 pt-2 border-t border-stone-100 dark:border-stone-800 flex gap-1 overflow-x-auto no-scrollbar">
                          {item.variants.map((v, vIdx) => (
                            <button
                              key={v.name}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddItem(item, vIdx);
                              }}
                              className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 hover:bg-accent hover:text-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 transition-colors"
                            >
                              {v.name} (₹{v.price})
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-2.5 pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                          {currentQty > 0 ? (
                            <>
                              <span className="text-[11px] font-extrabold text-accent bg-accent/15 px-2 py-0.5 rounded-md">
                                {currentQty} in bill
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-accent text-white shadow-xs">
                                + Add More
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="text-[10px] text-stone-400 font-medium">Tap to add</span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-accent group-hover:bg-accent group-hover:text-white transition-colors">
                                + Add
                              </span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Running Order Ticket / Bill (40%) */}
          <div className="w-96 flex flex-col bg-white dark:bg-stone-900 shadow-xl min-w-0">
            
            {/* Ticket Header */}
            <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/70 dark:bg-stone-900/80">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-accent block">
                  {existingOrder ? '● Active Running Order · Editing' : '● New Order Ticket'}
                </span>
                <h4 className="text-base font-extrabold text-stone-900 dark:text-stone-100">
                  Table {table.label}
                  {existingOrder && (
                    <span className="text-xs font-normal text-stone-500 ml-1.5">
                      (#{existingOrder.id.slice(-4)})
                    </span>
                  )}
                </h4>
                <p className="text-[11px] text-stone-500">
                  {orderItems.length} dishes · Bill: ₹{grandTotal}
                </p>
              </div>

              {orderItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => setOrderItems([])}
                  className="text-xs text-stone-400 hover:text-rose-500 font-semibold"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Selected Items Table */}
            <div className="flex-1 p-3 overflow-y-auto space-y-2">
              {orderItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-400 space-y-2">
                  <ShoppingBag className="h-10 w-10 opacity-30 text-accent" />
                  <p className="text-xs font-semibold">No dishes added yet</p>
                  <p className="text-[11px] text-stone-500">
                    Click any menu card on the left to punch dishes into this table.
                  </p>
                </div>
              ) : (
                orderItems.map((row, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/70 dark:border-stone-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Badge variant={row.item.type} size="sm" />
                        <span className="font-bold text-stone-900 dark:text-stone-100 truncate">
                          {row.item.name}
                        </span>
                      </div>
                      {row.variantName && (
                        <span className="text-[10px] font-semibold text-accent block ml-5">
                          Size: {row.variantName}
                        </span>
                      )}
                      <span className="text-[11px] text-stone-400 ml-5">
                        ₹{row.price} each
                      </span>
                    </div>

                    {/* Stepper */}
                    <div className="flex items-center gap-2">
                      <div className="inline-flex items-center border border-stone-300 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-900 px-1 py-0.5">
                        <button
                          onClick={() => handleUpdateQty(idx, row.qty - 1)}
                          className="p-1 text-stone-500 hover:text-accent"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold">
                          {row.qty}
                        </span>
                        <button
                          onClick={() => handleUpdateQty(idx, row.qty + 1)}
                          className="p-1 text-stone-500 hover:text-accent"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <span className="font-bold text-stone-900 dark:text-stone-100 w-14 text-right">
                        ₹{row.itemTotal}
                      </span>

                      <button
                        onClick={() => handleRemoveRow(idx)}
                        className="text-stone-400 hover:text-rose-500 p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Kitchen Note */}
            <div className="p-3 px-4 border-t border-stone-200 dark:border-stone-800">
              <input
                type="text"
                placeholder="Kitchen cooking instructions..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full text-xs rounded-xl border border-stone-200 dark:border-stone-800 p-2.5 bg-stone-50 dark:bg-stone-800/40 focus:outline-none focus:border-accent"
              />
            </div>

            {/* Bill Summary & Action Buttons */}
            <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-950/40 space-y-3">
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-stone-500">
                  <span>Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-stone-500">
                  <span>GST ({taxPercent}%)</span>
                  <span>₹{tax}</span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-stone-900 dark:text-stone-100 pt-1 border-t border-stone-200 dark:border-stone-800">
                  <span>Total Amount</span>
                  <span className="text-accent">₹{grandTotal}</span>
                </div>
              </div>

              {/* Petpooja Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  loading={loading}
                  onClick={() => handleAction('kot')}
                  className="font-bold text-xs"
                  leftIcon={<Send className="h-3.5 w-3.5" />}
                >
                  Save & KOT
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  loading={loading}
                  onClick={() => handleAction('kot_and_print')}
                  className="font-bold text-xs"
                  leftIcon={<Printer className="h-3.5 w-3.5" />}
                >
                  KOT & Bill
                </Button>
              </div>

              <Button
                size="md"
                loading={loading}
                onClick={() => handleAction('settle')}
                className="w-full font-bold shadow-lg text-sm bg-emerald-600 hover:bg-emerald-700 text-white"
                leftIcon={<CheckCircle2 className="h-4 w-4" />}
              >
                Settle & Pay · ₹{grandTotal}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
