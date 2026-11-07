import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { getOrderById, subscribeToOrder, requestTableBill } from '@/lib/orderService';
import { getCafeById } from '@/lib/firestore';
import { generateQRCodeDataUrl } from '@/lib/qr';
import { FeedbackModal } from '@/components/customer/FeedbackModal';
import { Order, OrderStatus, Cafe } from '@/types/cafe';
import { toast } from '@/components/ui/ToastStore';
import {
  CheckCircle2,
  Clock,
  UtensilsCrossed,
  Sparkles,
  Receipt,
  ArrowLeft,
  Flame,
  Star,
} from 'lucide-react';

export const OrderStatusPage: React.FC = () => {
  const { cafeId, orderId, token } = useParams<{
    cafeId: string;
    orderId: string;
    token: string;
  }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [cafe, setCafe] = useState<Cafe | null>(null);
  const [upiQrUrl, setUpiQrUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [billRequested, setBillRequested] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  useEffect(() => {
    if (!cafeId || !orderId) return;

    // Fetch initial order and cafe
    const fetchInit = async () => {
      setLoading(true);
      const [ord, cafeData] = await Promise.all([
        getOrderById(cafeId, orderId),
        getCafeById(cafeId),
      ]);
      setOrder(ord);
      setCafe(cafeData);

      // Generate UPI QR if upiId is present
      if (cafeData?.upiId && ord) {
        // UPI deep link standard: upi://pay?pa=<upiId>&pn=<name>&am=<amount>&cu=INR
        const upiPayString = `upi://pay?pa=${cafeData.upiId}&pn=${encodeURIComponent(
          cafeData.name
        )}&am=${ord.total}&cu=INR`;
        const qr = await generateQRCodeDataUrl(upiPayString, { width: 220 });
        setUpiQrUrl(qr);
      }
      setLoading(false);
    };

    fetchInit();

    // Subscribe to live order updates
    const unsubscribe = subscribeToOrder(cafeId, orderId, (updated) => {
      if (updated) {
        setOrder(updated);
      }
    });

    return () => unsubscribe();
  }, [cafeId, orderId]);

  const handleRequestBill = async () => {
    if (!cafeId || !order) return;
    await requestTableBill(cafeId, order.tableId);
    setBillRequested(true);
    toast.success('Bill requested! Staff is printing your check.');
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-stone-500">
        Loading live order tracker...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-4 text-center">
        <p className="text-stone-500">Order not found.</p>
        <Button onClick={() => navigate(`/m/${cafeId}/${token}`)} className="mt-4">
          Back to Menu
        </Button>
      </div>
    );
  }

  const steps: { key: OrderStatus; label: string; icon: any }[] = [
    { key: 'new', label: 'Order Placed', icon: Clock },
    { key: 'preparing', label: 'Preparing', icon: Flame },
    { key: 'ready', label: 'Ready', icon: Sparkles },
    { key: 'served', label: 'Served', icon: CheckCircle2 },
  ];

  const statusOrder: OrderStatus[] = ['new', 'preparing', 'ready', 'served', 'completed'];
  const currentIndex = statusOrder.indexOf(order.status);

  return (
    <div className="p-4 space-y-4">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(`/m/${cafeId}/${token}`)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 dark:text-stone-300"
        >
          <ArrowLeft className="h-4 w-4" /> Add More Dishes
        </button>
        <span className="text-xs font-mono text-stone-400">#{order.id}</span>
      </div>

      {/* Hero Status Card */}
      <GlassCard variant="raised" className="p-6 text-center space-y-3">
        <div className="h-14 w-14 rounded-2xl bg-accent/15 text-accent flex items-center justify-center mx-auto shadow-sm">
          <UtensilsCrossed className="h-7 w-7 animate-pulse" />
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-accent">
            Table {order.tableNumber} · {order.floorName}
          </span>
          <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100 capitalize">
            {order.status === 'new'
              ? 'Order Sent to Kitchen!'
              : order.status === 'preparing'
              ? 'Chef is Preparing Your Food'
              : order.status === 'ready'
              ? 'Food is Hot & Ready!'
              : order.status === 'served'
              ? 'Dishes Served · Bon Appétit'
              : 'Order Completed'}
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Real-time status updates synced with the cafe live board.
          </p>
        </div>

        {/* Stepper Progress Bar */}
        <div className="pt-4 border-t border-stone-200/60 dark:border-stone-800">
          <div className="grid grid-cols-4 gap-2 text-center">
            {steps.map((s, idx) => {
              const Icon = s.icon;
              const isPastOrCurrent = currentIndex >= idx;
              const isCurrent = order.status === s.key;

              return (
                <div key={s.key} className="flex flex-col items-center gap-1.5">
                  <div
                    className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all ${
                      isCurrent
                        ? 'bg-accent text-white shadow-md ring-4 ring-accent/20'
                        : isPastOrCurrent
                        ? 'bg-emerald-500 text-white'
                        : 'bg-stone-200 dark:bg-stone-800 text-stone-400'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <span
                    className={`text-[10px] font-semibold leading-tight ${
                      isPastOrCurrent
                        ? 'text-stone-900 dark:text-stone-100'
                        : 'text-stone-400'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </GlassCard>

      {/* Order Itemized Summary */}
      <GlassCard className="p-4 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
          Items Ordered ({order.items.length})
        </h4>

        <div className="divide-y divide-stone-100 dark:divide-stone-800">
          {order.items.map((item, idx) => (
            <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-accent">{item.qty}x</span>
                <div>
                  <span className="font-semibold text-stone-800 dark:text-stone-200">
                    {item.name}
                  </span>
                  {item.variant && (
                    <span className="text-[11px] text-stone-500 block">
                      {item.variant.name}
                    </span>
                  )}
                </div>
              </div>
              <span className="font-bold text-stone-900 dark:text-stone-100">
                ₹{item.itemTotal}
              </span>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-stone-200/60 dark:border-stone-800 flex justify-between text-sm font-bold">
          <span>Total Bill</span>
          <span className="text-accent">₹{order.total}</span>
        </div>
      </GlassCard>

      {/* Bill Request & Seamless Payment Card */}
      <GlassCard variant="raised" className="p-5 text-center space-y-4">
        <div>
          <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
            Payment Options
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Pay instantly via UPI QR or request the physical bill at counter.
          </p>
        </div>

        {/* UPI QR Display if available */}
        {upiQrUrl ? (
          <div className="bg-white p-3 rounded-2xl shadow-sm border border-stone-200/80 inline-block mx-auto">
            <img
              src={upiQrUrl}
              alt="UPI Payment QR"
              className="w-44 h-44 object-contain rounded-xl"
            />
            <p className="text-[10px] font-bold text-stone-700 mt-1 uppercase tracking-wider">
              Scan with GPay / PhonePe / Paytm
            </p>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-stone-100 dark:bg-stone-800/60 text-xs text-stone-500">
            Cash, UPI & Card payments accepted at the counter.
          </div>
        )}

        <div className="flex flex-col gap-2">
          {order.status === 'served' || order.status === 'completed' ? (
            <Button
              onClick={() => setIsFeedbackOpen(true)}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold"
              leftIcon={<Star className="h-4 w-4 fill-white" />}
            >
              Rate Your Dining Experience
            </Button>
          ) : null}

          <Button
            onClick={handleRequestBill}
            disabled={billRequested}
            variant="outline"
            className="w-full"
            leftIcon={<Receipt className="h-4 w-4" />}
          >
            {billRequested ? 'Bill Requested (Staff Notified)' : 'Request Printed Bill'}
          </Button>

          <Button
            onClick={() => navigate(`/m/${cafeId}/${token}`)}
            className="w-full"
            leftIcon={<UtensilsCrossed className="h-4 w-4" />}
          >
            Add More Items to Table
          </Button>
        </div>
      </GlassCard>

      {/* Customer Post-Dining Feedback Modal */}
      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        orderId={order.id}
        cafeName={cafe?.name || 'DineFlow Cafe'}
      />
    </div>
  );
};

export default OrderStatusPage;
