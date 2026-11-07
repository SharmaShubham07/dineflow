import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Order } from '@/types/cafe';
import { Printer } from 'lucide-react';

interface KOTPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  cafeName: string;
}

export const KOTPrintModal: React.FC<KOTPrintModalProps> = ({
  isOpen,
  onClose,
  order,
  cafeName,
}) => {
  if (!order) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Kitchen Order Ticket (KOT)"
      description="Standard kitchen routing ticket format for chef / food preparation."
      size="sm"
    >
      <div className="space-y-4">
        {/* Printable KOT Ticket */}
        <div className="bg-amber-50 dark:bg-stone-900 border-2 border-stone-800 text-stone-900 dark:text-stone-100 p-5 rounded-xl font-mono text-xs space-y-3">
          <div className="text-center pb-2 border-b-2 border-stone-800">
            <span className="text-[10px] font-bold uppercase tracking-wider block text-stone-500">
              {cafeName}
            </span>
            <h3 className="text-xl font-black tracking-tight">KITCHEN TICKET</h3>
          </div>

          <div className="flex justify-between items-center text-sm font-bold pb-2 border-b border-dashed border-stone-400">
            <div>
              <span className="text-2xl text-accent font-black">
                TABLE {order.tableNumber}
              </span>
              <span className="block text-[10px] font-normal text-stone-500">
                {order.floorName}
              </span>
            </div>
            <div className="text-right">
              <span className="block font-bold">KOT #{order.id.slice(-4).toUpperCase()}</span>
              <span className="text-[10px] text-stone-500">
                {new Date(order.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
            </div>
          </div>

          {/* Dishes & Instructions */}
          <div className="space-y-2 py-2">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 px-2 py-0.5 rounded">
                      {item.qty}
                    </span>
                    <span className="text-sm font-bold">{item.name}</span>
                  </div>

                  {item.variant && (
                    <span className="text-xs text-stone-600 dark:text-stone-400 ml-8 block">
                      Size: {item.variant.name}
                    </span>
                  )}

                  {item.addons && item.addons.length > 0 && (
                    <span className="text-xs text-stone-500 ml-8 block">
                      Add-ons: {item.addons.map((a) => a.name).join(', ')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {order.note && (
            <div className="p-2.5 rounded-lg border border-red-500 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 font-bold text-xs">
              ⚠️ COOKING NOTE: "{order.note}"
            </div>
          )}

          <div className="pt-2 border-t-2 border-stone-800 text-[10px] text-center text-stone-500">
            Source: {order.source.toUpperCase()} · Ticket Sent Automatically
          </div>
        </div>

        <Button
          onClick={() => window.print()}
          className="w-full font-bold"
          leftIcon={<Printer className="h-4 w-4" />}
        >
          Print Kitchen KOT (58/80mm)
        </Button>
      </div>
    </Modal>
  );
};
