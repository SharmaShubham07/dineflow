import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '@/stores/cartStore';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { placeCustomerOrder } from '@/lib/orderService';
import { toast } from '@/components/ui/ToastStore';
import {
  ArrowLeft,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  Send,
  Tag,
  Check,
} from 'lucide-react';

export const CustomerCartPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    cafeId,
    tableId,
    tableNumber,
    floorName,
    items,
    updateQuantity,
    removeItem,
    clearCart,
    getSubtotal,
    getTaxAmount,
    getTotal,
    orderNote,
    setOrderNote,
    customerName,
    customerPhone,
    setCustomerDetails,
    couponCode,
    discountAmount,
    applyCoupon,
    removeCoupon,
  } = useCartStore();

  const [couponInput, setCouponInput] = useState('');
  const [loading, setLoading] = useState(false);

  const taxPercent = 5.0;
  const subtotal = getSubtotal();
  const tax = getTaxAmount(taxPercent);
  const total = getTotal(taxPercent);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    const success = applyCoupon(couponInput);
    if (success) {
      toast.success(`Coupon "${couponInput.toUpperCase()}" applied!`);
      setCouponInput('');
    } else {
      toast.error('Invalid coupon. Try "DINE10" or "FLAT50"');
    }
  };

  const handlePlaceOrder = async () => {
    if (items.length === 0 || !cafeId || !tableId) {
      toast.error('Cart is empty or table session invalid.');
      return;
    }

    setLoading(true);
    try {
      const order = await placeCustomerOrder({
        cafeId,
        table: {
          id: tableId,
          cafeId,
          floorId: '',
          number: parseInt(tableNumber || '1') || 1,
          label: tableNumber || '1',
          capacity: 4,
          qrToken: '',
          status: 'ordered',
        },
        items,
        note: orderNote,
        taxPercent,
        customerName,
        customerPhone,
      });

      clearCart();
      toast.success('Order placed successfully! Kitchen has received your ticket.');
      // Navigate to live status page
      const currentToken = window.location.pathname.split('/')[3] || 'token';
      navigate(`/m/${cafeId}/${currentToken}/order/${order.id}`);
    } catch (e: any) {
      toast.error('Failed to submit order: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="p-4 space-y-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-semibold text-stone-600 dark:text-stone-300"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Menu
        </button>
        <GlassCard className="p-8">
          <EmptyState
            icon={<ShoppingBag className="h-8 w-8 text-accent" />}
            title="Your Order Cart is Empty"
            description="Explore our specialty coffees, artisan toasts, and freshly baked desserts."
            actionLabel="Browse Menu"
            onAction={() => navigate(-1)}
          />
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-semibold text-stone-600 dark:text-stone-300"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Menu
        </button>

        <span className="text-xs font-bold text-accent">
          Table {tableNumber} ({floorName})
        </span>
      </div>

      <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">
        Review Your Order
      </h2>

      {/* Cart Items */}
      <div className="space-y-3">
        {items.map((item) => (
          <GlassCard key={item.cartId} variant="flat" className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <Badge variant={item.type} size="sm" className="mt-1" />
                <div>
                  <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                    {item.name}
                  </h4>
                  {item.selectedVariant && (
                    <p className="text-[11px] font-semibold text-accent">
                      {item.selectedVariant.name}
                    </p>
                  )}
                  {item.selectedAddons && item.selectedAddons.length > 0 && (
                    <p className="text-[11px] text-stone-500">
                      + {item.selectedAddons.map((a) => a.name).join(', ')}
                    </p>
                  )}
                  {item.specialInstructions && (
                    <p className="text-[11px] italic text-stone-400">
                      "{item.specialInstructions}"
                    </p>
                  )}
                </div>
              </div>

              <span className="font-bold text-sm text-stone-900 dark:text-stone-100">
                ₹{item.itemTotal}
              </span>
            </div>

            {/* Stepper & Delete */}
            <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-stone-800">
              <button
                onClick={() => removeItem(item.cartId)}
                className="text-stone-400 hover:text-red-500 p-1"
                title="Remove item"
              >
                <Trash2 className="h-4 w-4" />
              </button>

              <div className="inline-flex items-center border border-stone-300 dark:border-stone-700 rounded-xl bg-white dark:bg-stone-900 px-2 py-1 gap-3">
                <button
                  onClick={() => updateQuantity(item.cartId, item.quantity - 1)}
                  className="text-stone-500 hover:text-accent font-bold"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateQuantity(item.cartId, item.quantity + 1)}
                  className="text-stone-500 hover:text-accent font-bold"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Customer Info (Optional) */}
      <GlassCard variant="flat" className="p-4 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
          Your Contact (Optional for Order Updates)
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            placeholder="Your Name"
            value={customerName}
            onChange={(e) =>
              setCustomerDetails({ name: e.target.value, phone: customerPhone })
            }
            className="w-full text-xs rounded-xl border border-stone-300 dark:border-stone-700 p-2.5 bg-white/70 dark:bg-stone-900 focus:outline-none focus:border-accent"
          />
          <input
            type="tel"
            placeholder="Phone Number"
            value={customerPhone}
            onChange={(e) =>
              setCustomerDetails({ name: customerName, phone: e.target.value })
            }
            className="w-full text-xs rounded-xl border border-stone-300 dark:border-stone-700 p-2.5 bg-white/70 dark:bg-stone-900 focus:outline-none focus:border-accent"
          />
        </div>

        <div>
          <label className="text-[11px] font-semibold text-stone-500 block mb-1">
            Table Note for Kitchen
          </label>
          <input
            type="text"
            placeholder="Serve everything together, bring water first..."
            value={orderNote}
            onChange={(e) => setOrderNote(e.target.value)}
            className="w-full text-xs rounded-xl border border-stone-300 dark:border-stone-700 p-2.5 bg-white/70 dark:bg-stone-900 focus:outline-none focus:border-accent"
          />
        </div>
      </GlassCard>

      {/* Coupon Code Section */}
      <GlassCard variant="flat" className="p-4 space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
          <Tag className="h-3.5 w-3.5 text-accent" />
          Promo / Coupon Code
        </h4>

        {couponCode ? (
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="h-5 w-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                <Check className="h-3 w-3 stroke-[3]" />
              </span>
              <div>
                <span className="font-bold text-emerald-800 dark:text-emerald-200">
                  {couponCode} Applied!
                </span>
                <span className="block text-[11px] text-emerald-600 dark:text-emerald-400">
                  You save ₹{discountAmount} on this order
                </span>
              </div>
            </div>
            <button
              onClick={removeCoupon}
              className="text-xs font-bold text-rose-500 hover:underline"
            >
              Remove
            </button>
          </div>
        ) : (
          <form onSubmit={handleApplyCoupon} className="flex gap-2">
            <input
              type="text"
              placeholder="Try DINE10 or FLAT50"
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value)}
              className="flex-1 uppercase text-xs rounded-xl border border-stone-300 dark:border-stone-700 p-2.5 bg-white/70 dark:bg-stone-900 focus:outline-none focus:border-accent"
            />
            <Button type="submit" size="sm" variant="outline">
              Apply
            </Button>
          </form>
        )}
      </GlassCard>

      {/* Bill Breakdown */}
      <GlassCard variant="raised" className="p-4 space-y-2">
        <div className="flex justify-between text-xs text-stone-600 dark:text-stone-400">
          <span>Item Subtotal</span>
          <span>₹{subtotal}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between text-xs text-emerald-600 font-bold">
            <span>Coupon Discount ({couponCode})</span>
            <span>-₹{discountAmount}</span>
          </div>
        )}
        <div className="flex justify-between text-xs text-stone-600 dark:text-stone-400">
          <span>GST / Service Tax ({taxPercent}%)</span>
          <span>₹{tax}</span>
        </div>
        <div className="flex justify-between text-base font-bold text-stone-900 dark:text-stone-100 pt-2 border-t border-stone-200/60 dark:border-stone-800">
          <span>To Pay</span>
          <span className="text-accent">₹{total}</span>
        </div>
      </GlassCard>

      {/* Submit Button */}
      <Button
        onClick={handlePlaceOrder}
        loading={loading}
        className="w-full text-base font-bold py-3.5 shadow-xl"
        leftIcon={<Send className="h-4 w-4" />}
      >
        Send Order to Kitchen · ₹{total}
      </Button>
    </div>
  );
};

export default CustomerCartPage;
