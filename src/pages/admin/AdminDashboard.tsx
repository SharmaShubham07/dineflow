import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { EmptyState } from '@/components/ui/EmptyState';
import { BillPrintModal } from '@/components/admin/BillPrintModal';
import { KOTPrintModal } from '@/components/admin/KOTPrintModal';
import { SplitBillModal } from '@/components/admin/SplitBillModal';
import { PetpoojaBillingModal } from '@/components/admin/PetpoojaBillingModal';
import { AddTableModal } from '@/components/admin/AddTableModal';
import { ViewTableQRModal } from '@/components/admin/ViewTableQRModal';
import { sound } from '@/lib/sound';
import { getTables, getCafes, getFloors, addTable } from '@/lib/firestore';
import { getMenuItems, getCategories, seedSampleMenuForCafe } from '@/lib/menuFirestore';
import { placeCustomerOrder } from '@/lib/orderService';
import { seedDemoPlatformData } from '@/lib/seed';
import { Order, OrderStatus, Table, MenuItem, MenuCategory, Cafe, Floor } from '@/types/cafe';
import { toast } from '@/components/ui/ToastStore';
import {
  Plus,
  Grid,
  Clock,
  Printer,
  CheckCircle2,
  Sparkles,
  Split,
  Edit2,
  QrCode,
} from 'lucide-react';

/**
 * Robust matching between an active Order and a dining Table
 */
export const isTableOrderMatch = (order: Order, table?: Table | null): boolean => {
  if (!table || !order) return false;
  if (order.status === 'completed' || order.status === 'cancelled') return false;
  if (order.tableId && table.id && order.tableId === table.id) return true;
  if (order.tableNumber && table.label) {
    const oNum = order.tableNumber.toLowerCase().replace(/^(table\s*|t-?)/, '').trim();
    const tLabel = table.label.toLowerCase().replace(/^(table\s*|t-?)/, '').trim();
    if (order.tableNumber.trim().toLowerCase() === table.label.trim().toLowerCase()) return true;
    if (oNum === tLabel) return true;
    if (order.tableNumber.trim() === String(table.number).trim()) return true;
  }
  return false;
};

export const AdminDashboard: React.FC = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'board' | 'floormap'>(() => {
    return location.pathname.includes('floor-map') ? 'floormap' : 'board';
  });

  useEffect(() => {
    if (location.pathname.includes('floor-map')) {
      setViewMode('floormap');
    } else if (location.pathname.includes('orders')) {
      setViewMode('board');
    }
  }, [location.pathname]);

  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [currentCafe, setCurrentCafe] = useState<Cafe | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [selectedPetpoojaTable, setSelectedPetpoojaTable] = useState<Table | null>(null);
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);
  const [kotPrintingOrder, setKotPrintingOrder] = useState<Order | null>(null);
  const [splitOrder, setSplitOrder] = useState<Order | null>(null);
  const [isAddTableOpen, setIsAddTableOpen] = useState(false);
  const [viewingQRTable, setViewingQRTable] = useState<Table | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      let cafes = await getCafes();
      if (cafes.length === 0) {
        const demo = await seedDemoPlatformData();
        await seedSampleMenuForCafe(demo.cafe.id);
        cafes = [demo.cafe];
      }

      const activeCafe = cafes[0];
      setCurrentCafe(activeCafe);

      const [tablesData, itemsData, catsData, floorsData] = await Promise.all([
        getTables(activeCafe.id),
        getMenuItems(activeCafe.id),
        getCategories(activeCafe.id),
        getFloors(activeCafe.id),
      ]);

      setTables(tablesData);
      setMenuItems(itemsData);
      setCategories(catsData);
      setFloors(
        floorsData.length > 0
          ? floorsData
          : [
              {
                id: 'floor_default',
                cafeId: activeCafe.id,
                name: 'Ground Floor (Indoor)',
                order: 1,
                tableCount: tablesData.length || 10,
              },
            ]
      );

      const localOrders = JSON.parse(
        localStorage.getItem('dineflow_local_orders') || '[]'
      );
      setOrders(localOrders);
    } catch (e) {
      console.warn('Admin load error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleStorageChange = () => {
      const localOrders = JSON.parse(
        localStorage.getItem('dineflow_local_orders') || '[]'
      );
      if (localOrders.length > orders.length) {
        sound.playNewOrderAlert();
      }
      setOrders(localOrders);
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleUpdateStatus = (orderId: string, nextStatus: OrderStatus) => {
    const updated = orders.map((o) =>
      o.id === orderId ? { ...o, status: nextStatus, updatedAt: new Date().toISOString() } : o
    );
    setOrders(updated);
    localStorage.setItem('dineflow_local_orders', JSON.stringify(updated));
    toast.success(`Order #${orderId.slice(-4)} marked as ${nextStatus.toUpperCase()}`);
  };

  const handleMarkPaid = (orderId: string, method: 'cash' | 'upi' | 'card') => {
    sound.playPaymentSuccess();
    const updated = orders.map((o) =>
      o.id === orderId
        ? {
            ...o,
            payment: { status: 'paid' as const, method, paidAmount: o.total },
            status: o.status === 'served' ? ('completed' as OrderStatus) : o.status,
          }
        : o
    );
    setOrders(updated);
    localStorage.setItem('dineflow_local_orders', JSON.stringify(updated));
    toast.success(`Payment confirmed via ${method.toUpperCase()}!`);
  };

  const handlePetpoojaOrderSubmit = async ({
    table,
    items,
    note,
    action,
  }: any) => {
    if (!currentCafe) return;

    const cartFormattedItems = items.map((i: any) => ({
      cartId: `${i.item.id}_${i.variantName || 'def'}`,
      itemId: i.item.id,
      name: i.item.name,
      basePrice: i.price,
      type: i.item.type,
      selectedVariant: i.variantName ? { name: i.variantName, price: i.price } : undefined,
      selectedAddons: [],
      unitPrice: i.price,
      quantity: i.qty,
      itemTotal: i.itemTotal,
      specialInstructions: '',
    }));

    // Check if table already has a running order
    const existingOrder = orders.find((o) => isTableOrderMatch(o, table));

    let finalOrder: Order;

    if (existingOrder) {
      // EDIT EXISTING ORDER: Recompute subtotal, tax and total
      const subtotal = cartFormattedItems.reduce((sum: number, it: any) => sum + it.itemTotal, 0);
      const tax = Math.round((subtotal * (currentCafe.taxPercent / 100)) * 100) / 100;
      const total = Math.round((subtotal + tax) * 100) / 100;

      finalOrder = {
        ...existingOrder,
        items: cartFormattedItems.map((it: any) => ({
          id: it.cartId,
          itemId: it.itemId,
          name: it.name,
          qty: it.quantity,
          variant: it.selectedVariant,
          addons: [],
          price: it.unitPrice,
          itemTotal: it.itemTotal,
          type: it.type,
        })),
        subtotal,
        tax,
        total,
        note: note || existingOrder.note,
        updatedAt: new Date().toISOString(),
      };

      if (action === 'settle') {
        finalOrder.status = 'completed';
        finalOrder.payment = { status: 'paid', method: 'cash', paidAmount: finalOrder.total };
        sound.playPaymentSuccess();
      }

      const updatedOrders = orders.map((o) => (o.id === existingOrder.id ? finalOrder : o));
      setOrders(updatedOrders);
      localStorage.setItem('dineflow_local_orders', JSON.stringify(updatedOrders));
      toast.success(`Updated running order for Table ${table.label}!`);
    } else {
      // CREATE BRAND NEW ORDER
      finalOrder = await placeCustomerOrder({
        cafeId: currentCafe.id,
        table,
        items: cartFormattedItems,
        note,
        taxPercent: currentCafe.taxPercent,
      });

      if (action === 'settle') {
        finalOrder.status = 'completed';
        finalOrder.payment = { status: 'paid', method: 'cash', paidAmount: finalOrder.total };
        sound.playPaymentSuccess();
      } else {
        sound.playNewOrderAlert();
      }

      setOrders([finalOrder, ...orders]);
      toast.success(`KOT punched for Table ${table.label}!`);
    }

    if (action === 'kot' || action === 'kot_and_print') {
      setKotPrintingOrder(finalOrder);
    }
    if (action === 'kot_and_print' || action === 'settle') {
      setPrintingOrder(finalOrder);
    }
  };

  const handleAddTable = async (data: {
    floorId: string;
    floorName: string;
    label: string;
    capacity: number;
  }) => {
    if (!currentCafe) return;
    const newTable = await addTable(
      currentCafe.id,
      data.floorId,
      data.floorName,
      data.label,
      data.capacity
    );
    setTables((prev) => [...prev, newTable]);
  };

  const handleTokenRotated = (tableId: string, newToken: string) => {
    setTables((prev) =>
      prev.map((t) => (t.id === tableId ? { ...t, qrToken: newToken } : t))
    );
    if (viewingQRTable && viewingQRTable.id === tableId) {
      setViewingQRTable({ ...viewingQRTable, qrToken: newToken });
    }
  };

  const tabs = [
    { id: 'all', label: 'All Active', count: orders.filter((o) => o.status !== 'completed' && o.status !== 'cancelled').length },
    { id: 'new', label: 'New Tickets', count: orders.filter((o) => o.status === 'new').length },
    { id: 'preparing', label: 'Kitchen / Prep', count: orders.filter((o) => o.status === 'preparing').length },
    { id: 'ready', label: 'Ready to Serve', count: orders.filter((o) => o.status === 'ready').length },
    { id: 'served', label: 'Served / At Table', count: orders.filter((o) => o.status === 'served').length },
    { id: 'completed', label: 'Completed', count: orders.filter((o) => o.status === 'completed').length },
  ];

  const filteredOrders = orders.filter((o) => {
    if (activeTab === 'all') return o.status !== 'completed' && o.status !== 'cancelled';
    return o.status === activeTab;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
              Live Operations & Order Board
            </h2>
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
          </div>
          <p className="text-sm text-stone-500">
            Real-time kitchen display system (KDS), floor map, and POS billing.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddTableOpen(true)}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Add Table
          </Button>

          <Button
            variant={viewMode === 'floormap' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode(viewMode === 'board' ? 'floormap' : 'board')}
            leftIcon={<Grid className="h-4 w-4" />}
          >
            {viewMode === 'floormap' ? 'Show Kanban Board' : 'Floor Map View'}
          </Button>

          <Button
            size="sm"
            onClick={() => {
              if (tables.length > 0) {
                setSelectedPetpoojaTable(tables[0]);
              }
            }}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Punch Table Order (POS)
          </Button>
        </div>
      </div>

      {viewMode === 'floormap' ? (
        <div className="space-y-4">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  Restaurant Tables & Dining Status
                </h3>
                <p className="text-xs text-stone-500">
                  Click any table to punch or edit an order in Petpooja POS. Click the QR icon on a table to view, print, or rotate its QR code.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddTableOpen(true)}
                leftIcon={<Plus className="h-4 w-4" />}
              >
                + Add Table
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {tables.map((table) => {
                const tableOrder = orders.find((o) => isTableOrderMatch(o, table));

                const statusColor = tableOrder
                  ? 'border-accent bg-accent/15 ring-2 ring-accent/40 shadow-md text-stone-900 dark:text-stone-100'
                  : 'border-stone-200 dark:border-stone-700 bg-white/70 dark:bg-stone-900/60 text-stone-700 dark:text-stone-300 hover:border-accent/40';

                return (
                  <div
                    key={table.id}
                    className={`p-4 rounded-2xl border-2 text-center transition-all cursor-pointer hover:shadow-lg active:scale-[0.98] ${statusColor} relative group flex flex-col justify-between`}
                    onClick={() => {
                      setSelectedPetpoojaTable(table);
                    }}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75 truncate text-left">
                          {table.floorName || 'Dining Area'}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingQRTable(table);
                          }}
                          title="View & Download Table QR Code"
                          className="p-1 rounded-md bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 shadow-sm border border-stone-200 dark:border-stone-700 transition-colors"
                        >
                          <QrCode className="h-3.5 w-3.5 text-accent" />
                        </button>
                      </div>
                      <h4 className="text-xl font-bold my-1">Table {table.label}</h4>

                      {tableOrder ? (
                        <div className="my-1.5 space-y-1">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-tight bg-accent text-white shadow-sm">
                            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                            Occupied · {tableOrder.status}
                          </span>
                          <div className="text-base font-extrabold text-accent">
                            ₹{tableOrder.total}
                          </div>
                          <div className="text-[10px] font-semibold text-stone-600 dark:text-stone-300">
                            {tableOrder.items.length} {tableOrder.items.length === 1 ? 'dish' : 'dishes'} in order
                          </div>
                        </div>
                      ) : (
                        <div className="my-2">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            Free / Available
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 pt-2 border-t border-stone-200/50 dark:border-stone-700/50 flex items-center justify-between text-[10px] opacity-70">
                      <span>{table.capacity || 4} Seats</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewingQRTable(table);
                        }}
                        className="text-accent font-semibold hover:underline flex items-center gap-0.5"
                      >
                        <QrCode className="h-3 w-3 inline" /> QR
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </div>
      ) : (
        <div className="space-y-4">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

          {loading ? (
            <div className="p-8 text-center text-stone-500">
              Syncing live tickets with kitchen...
            </div>
          ) : filteredOrders.length === 0 ? (
            <GlassCard className="p-8">
              <EmptyState
                icon={<Clock className="h-8 w-8 text-accent" />}
                title="No active orders in this column"
                description="When guests scan a table QR or staff creates a ticket, cards appear here within 1 second."
                actionLabel="Punch Table Order"
                onAction={() => {
                  if (tables.length > 0) setSelectedPetpoojaTable(tables[0]);
                }}
              />
            </GlassCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredOrders.map((order) => {
                const isPaid = order.payment.status === 'paid';
                const matchingTable = tables.find((t) => isTableOrderMatch(order, t));

                return (
                  <GlassCard
                    key={order.id}
                    variant="raised"
                    className="p-5 flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-bold text-lg text-stone-900 dark:text-stone-100">
                              Table {order.tableNumber}
                            </h3>
                            <Badge variant={order.source === 'qr' ? 'accent' : 'neutral'}>
                              {order.source.toUpperCase()}
                            </Badge>
                            {matchingTable && (
                              <button
                                type="button"
                                onClick={() => setViewingQRTable(matchingTable)}
                                title={`View Table ${order.tableNumber} QR Code`}
                                className="p-1 rounded hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-500 hover:text-accent transition-colors"
                              >
                                <QrCode className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-stone-500">
                            {order.floorName} · {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-tight shadow-sm ${
                            order.status === 'new'
                              ? 'bg-amber-500 text-white animate-pulse'
                              : order.status === 'preparing'
                              ? 'bg-sky-500 text-white'
                              : order.status === 'ready'
                              ? 'bg-emerald-500 text-white'
                              : order.status === 'served'
                              ? 'bg-purple-500 text-white'
                              : 'bg-stone-500 text-white'
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>

                      <div className="divide-y divide-stone-100 dark:divide-stone-800 text-xs py-2 border-y border-stone-200/60 dark:border-stone-800 space-y-1.5">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="pt-1.5 flex justify-between items-start">
                            <div>
                              <span className="font-bold text-accent mr-1.5">{item.qty}x</span>
                              <span className="font-semibold text-stone-900 dark:text-stone-100">
                                {item.name}
                              </span>
                              {item.variant && (
                                <span className="text-[10px] text-stone-500 block">
                                  ({item.variant.name})
                                </span>
                              )}
                            </div>
                            <span className="font-semibold text-stone-800 dark:text-stone-200">
                              ₹{item.itemTotal}
                            </span>
                          </div>
                        ))}
                      </div>

                      {order.note && (
                        <p className="text-xs italic text-stone-500 bg-stone-100 dark:bg-stone-800/60 p-2 rounded-lg mt-2">
                          Note: "{order.note}"
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-3 text-xs">
                        <span className="font-bold text-stone-900 dark:text-stone-100 text-base">
                          Total: ₹{order.total}
                        </span>

                        <span
                          className={`font-semibold text-xs px-2 py-0.5 rounded-md ${
                            isPaid
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}
                        >
                          {isPaid ? `PAID (${order.payment.method?.toUpperCase()})` : 'PAYMENT DUE'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-stone-200/60 dark:border-stone-800 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        {/* Petpooja POS Edit Order Action */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const tableForOrder = tables.find((t) => t.id === order.tableId) || {
                              id: order.tableId,
                              cafeId: order.cafeId,
                              floorId: '',
                              number: parseInt(order.tableNumber) || 1,
                              label: order.tableNumber,
                              capacity: 4,
                              qrToken: '',
                              status: 'ordered' as const,
                              floorName: order.floorName,
                            };
                            setSelectedPetpoojaTable(tableForOrder);
                          }}
                          className="w-full text-xs font-bold"
                          leftIcon={<Edit2 className="h-3.5 w-3.5 text-accent" />}
                        >
                          Edit Order / Add Items
                        </Button>

                        {order.status === 'preparing' && (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateStatus(order.id, 'ready')}
                            className="w-full text-xs"
                            leftIcon={<Sparkles className="h-3.5 w-3.5" />}
                          >
                            Mark Ready
                          </Button>
                        )}

                        {order.status === 'ready' && (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateStatus(order.id, 'served')}
                            className="w-full text-xs"
                            leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
                          >
                            Mark Served
                          </Button>
                        )}

                        {order.status === 'served' && (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateStatus(order.id, 'completed')}
                            className="w-full text-xs"
                          >
                            Close Ticket
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setKotPrintingOrder(order)}
                          className="w-full text-xs"
                        >
                          Print KOT
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSplitOrder(order)}
                          className="w-full text-xs"
                          leftIcon={<Split className="h-3.5 w-3.5" />}
                        >
                          Split Bill
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPrintingOrder(order)}
                          className="w-full text-xs"
                          leftIcon={<Printer className="h-3.5 w-3.5" />}
                        >
                          Print Bill
                        </Button>
                      </div>

                      {!isPaid && (
                        <div className="flex items-center gap-1.5 pt-1">
                          <span className="text-[10px] font-bold uppercase text-stone-400">
                            Collect:
                          </span>
                          <button
                            onClick={() => handleMarkPaid(order.id, 'upi')}
                            className="flex-1 py-1 text-[11px] font-bold rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 border border-stone-300 dark:border-stone-700"
                          >
                            UPI
                          </button>
                          <button
                            onClick={() => handleMarkPaid(order.id, 'cash')}
                            className="flex-1 py-1 text-[11px] font-bold rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 border border-stone-300 dark:border-stone-700"
                          >
                            Cash
                          </button>
                          <button
                            onClick={() => handleMarkPaid(order.id, 'card')}
                            className="flex-1 py-1 text-[11px] font-bold rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 border border-stone-300 dark:border-stone-700"
                          >
                            Card
                          </button>
                        </div>
                      )}
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Petpooja Full POS Table Billing Modal */}
      {selectedPetpoojaTable && (
        <PetpoojaBillingModal
          isOpen={Boolean(selectedPetpoojaTable)}
          onClose={() => setSelectedPetpoojaTable(null)}
          table={selectedPetpoojaTable}
          categories={categories}
          menuItems={menuItems}
          taxPercent={currentCafe?.taxPercent || 5.0}
          existingOrder={orders.find((o) => isTableOrderMatch(o, selectedPetpoojaTable))}
          onSubmitOrder={handlePetpoojaOrderSubmit}
        />
      )}

      <BillPrintModal
        isOpen={Boolean(printingOrder)}
        onClose={() => setPrintingOrder(null)}
        order={printingOrder}
        cafeName={currentCafe?.name || 'DineFlow Cafe'}
        cafeAddress={currentCafe?.address}
        cafePhone={currentCafe?.phone}
        gstNumber={currentCafe?.gstNumber}
      />

      <KOTPrintModal
        isOpen={Boolean(kotPrintingOrder)}
        onClose={() => setKotPrintingOrder(null)}
        order={kotPrintingOrder}
        cafeName={currentCafe?.name || 'DineFlow Kitchen'}
      />

      <SplitBillModal
        isOpen={Boolean(splitOrder)}
        onClose={() => setSplitOrder(null)}
        order={splitOrder}
        onConfirmSplit={() => setSplitOrder(null)}
      />

      {/* Add Dining Table Modal */}
      <AddTableModal
        isOpen={isAddTableOpen}
        onClose={() => setIsAddTableOpen(false)}
        floors={floors}
        onAddTable={handleAddTable}
      />

      {/* View Table QR Modal with live PNG download & Token Rotate */}
      <ViewTableQRModal
        isOpen={Boolean(viewingQRTable)}
        onClose={() => setViewingQRTable(null)}
        table={viewingQRTable}
        cafe={currentCafe}
        onTokenRotated={handleTokenRotated}
      />
    </div>
  );
};

export default AdminDashboard;
