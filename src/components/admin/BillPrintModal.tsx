import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Order } from '@/types/cafe';
import { Printer, Share2 } from 'lucide-react';

interface BillPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  cafeName: string;
  cafeAddress?: string;
  cafePhone?: string;
  gstNumber?: string;
}

export const BillPrintModal: React.FC<BillPrintModalProps> = ({
  isOpen,
  onClose,
  order,
  cafeName,
  cafeAddress,
  cafePhone,
  gstNumber,
}) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const text = `*Bill from ${cafeName}*%0AOrder ID: ${order.id}%0ATable: ${
      order.tableNumber
    }%0AAmount: ₹${order.total}%0AThank you for dining with us!`;
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Print Bill / Invoice"
      description="Thermal 58mm/80mm POS receipt format with GST breakdown."
      size="sm"
    >
      <div className="space-y-4">
        {/* Printable Thermal Receipt Container */}
        <div
          id="printable-bill"
          className="bg-white text-black p-5 rounded-xl border border-stone-300 font-mono text-xs shadow-inner space-y-3 print:border-none print:shadow-none print:m-0"
        >
          {/* Header */}
          <div className="text-center space-y-1 pb-3 border-b border-dashed border-stone-300">
            <h3 className="font-bold text-base uppercase tracking-tight">{cafeName}</h3>
            {cafeAddress && <p className="text-[10px] text-stone-600">{cafeAddress}</p>}
            {cafePhone && <p className="text-[10px] text-stone-600">Ph: {cafePhone}</p>}
            {gstNumber && (
              <p className="text-[10px] font-bold text-stone-700">GSTIN: {gstNumber}</p>
            )}
          </div>

          {/* Ticket metadata */}
          <div className="flex justify-between text-[11px] pb-2 border-b border-dashed border-stone-300">
            <div>
              <p>Table: <span className="font-bold">{order.tableNumber}</span></p>
              <p className="text-[10px] text-stone-500">Floor: {order.floorName}</p>
            </div>
            <div className="text-right">
              <p>ID: {order.id.slice(-6).toUpperCase()}</p>
              <p className="text-[10px] text-stone-500">
                {new Date(order.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>

          {/* Itemized list */}
          <div className="space-y-1.5 py-1">
            <div className="flex justify-between font-bold text-[10px] text-stone-600 border-b pb-1">
              <span>ITEM</span>
              <span>QTY x PRICE</span>
              <span>TOTAL</span>
            </div>
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-[11px]">
                <div className="flex-1 pr-2">
                  <p className="font-medium">{item.name}</p>
                  {item.variant && (
                    <p className="text-[9px] text-stone-500">{item.variant.name}</p>
                  )}
                </div>
                <div className="text-stone-600 whitespace-nowrap px-2">
                  {item.qty} x ₹{item.price}
                </div>
                <div className="font-bold whitespace-nowrap">₹{item.itemTotal}</div>
              </div>
            ))}
          </div>

          {/* Financials */}
          <div className="pt-2 border-t border-dashed border-stone-300 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>₹{order.subtotal}</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>Tax / GST:</span>
              <span>₹{order.tax}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-600 font-bold">
                <span>Discount:</span>
                <span>-₹{order.discount}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold pt-1 border-t border-stone-800">
              <span>TOTAL BILL:</span>
              <span>₹{order.total}</span>
            </div>
          </div>

          {/* Payment & Footer */}
          <div className="text-center pt-3 border-t border-dashed border-stone-300 text-[10px] text-stone-500 space-y-1">
            <p className="font-bold text-stone-800 uppercase">
              Payment Status: {order.payment.status.toUpperCase()} (
              {order.payment.method?.toUpperCase() || 'COUNTER'})
            </p>
            <p>Thank you for dining with us!</p>
            <p className="text-[9px]">Powered by DineFlow POS</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleWhatsAppShare}
            className="flex-1"
            leftIcon={<Share2 className="h-4 w-4" />}
          >
            WhatsApp Bill
          </Button>

          <Button
            onClick={handlePrint}
            className="flex-1 font-bold"
            leftIcon={<Printer className="h-4 w-4" />}
          >
            Print Receipt
          </Button>
        </div>
      </div>
    </Modal>
  );
};

