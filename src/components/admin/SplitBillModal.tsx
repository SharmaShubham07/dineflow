import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Order } from '@/types/cafe';
import { toast } from '@/components/ui/ToastStore';
import { Split } from 'lucide-react';

interface SplitBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onConfirmSplit: (method: 'equal' | 'custom', shares: number[]) => void;
}

export const SplitBillModal: React.FC<SplitBillModalProps> = ({
  isOpen,
  onClose,
  order,
  onConfirmSplit,
}) => {
  if (!order) return null;

  const [splitCount, setSplitCount] = useState(2);
  const [splitMode, setSplitMode] = useState<'equal' | 'itemwise'>('equal');

  const perPersonAmount = Math.ceil(order.total / splitCount);

  const handleApply = () => {
    const shares = Array(splitCount).fill(perPersonAmount);
    onConfirmSplit('equal', shares);
    toast.success(`Bill split equally among ${splitCount} guests (₹${perPersonAmount} each)!`);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Split Table Bill"
      description={`Total Payable: ₹${order.total} (Table ${order.tableNumber})`}
      size="md"
    >
      <div className="space-y-4">
        {/* Split Mode Selector */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-stone-100 dark:bg-stone-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setSplitMode('equal')}
            className={`py-2 rounded-lg transition-all ${
              splitMode === 'equal'
                ? 'bg-white dark:bg-stone-900 text-accent shadow-sm'
                : 'text-stone-500'
            }`}
          >
            Equal Split
          </button>
          <button
            type="button"
            onClick={() => setSplitMode('itemwise')}
            className={`py-2 rounded-lg transition-all ${
              splitMode === 'itemwise'
                ? 'bg-white dark:bg-stone-900 text-accent shadow-sm'
                : 'text-stone-500'
            }`}
          >
            By Items Ordered
          </button>
        </div>

        {splitMode === 'equal' ? (
          <div className="space-y-4">
            <div className="text-center py-3">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500 block mb-2">
                Number of Guests
              </span>
              <div className="inline-flex items-center gap-4 p-2 rounded-2xl bg-stone-100 dark:bg-stone-800">
                {[2, 3, 4, 5, 6].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setSplitCount(num)}
                    className={`h-10 w-10 rounded-xl font-bold text-sm transition-all ${
                      splitCount === num
                        ? 'bg-accent text-white shadow-md'
                        : 'text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Breakdown Card */}
            <div className="p-4 rounded-2xl bg-accent/10 border border-accent/20 text-center space-y-1">
              <span className="text-xs font-semibold text-accent uppercase">
                Each Person Pays
              </span>
              <h3 className="text-3xl font-extrabold text-stone-900 dark:text-stone-100">
                ₹{perPersonAmount}
              </h3>
              <p className="text-[11px] text-stone-500">
                {splitCount} guests × ₹{perPersonAmount} = ₹{perPersonAmount * splitCount} (Incl. taxes)
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            <span className="text-xs font-bold text-stone-500 block">
              Dishes Ordered
            </span>
            {order.items.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800 text-xs"
              >
                <div>
                  <span className="font-bold mr-1.5">{item.qty}x</span>
                  <span className="font-semibold">{item.name}</span>
                </div>
                <span className="font-bold text-accent">₹{item.itemTotal}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200/60 dark:border-stone-800">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleApply} leftIcon={<Split className="h-4 w-4" />}>
            Confirm Split (₹{perPersonAmount}/guest)
          </Button>
        </div>
      </div>
    </Modal>
  );
};

