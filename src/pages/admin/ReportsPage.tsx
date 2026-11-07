import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { StatCard } from '@/components/ui/StatCard';
import { Button } from '@/components/ui/Button';
import { Order } from '@/types/cafe';
import {
  IndianRupee,
  ShoppingBag,
  TrendingUp,
  CreditCard,
  Download,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month'>('today');

  useEffect(() => {
    const localOrders = JSON.parse(
      localStorage.getItem('dineflow_local_orders') || '[]'
    );
    setOrders(localOrders);
  }, []);

  const totalSales = orders.reduce((sum, o) => sum + o.total, 0);
  const totalOrders = orders.length;
  const avgOrderValue = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;

  // Payment method breakdown
  const upiSales = orders
    .filter((o) => o.payment.method === 'upi')
    .reduce((sum, o) => sum + o.total, 0);
  const cashSales = orders
    .filter((o) => o.payment.method === 'cash')
    .reduce((sum, o) => sum + o.total, 0);
  const cardSales = orders
    .filter((o) => o.payment.method === 'card')
    .reduce((sum, o) => sum + o.total, 0);

  // Top selling items aggregation
  const itemCounts: Record<string, { name: string; qty: number; revenue: number }> = {};
  orders.forEach((o) => {
    o.items.forEach((item) => {
      if (!itemCounts[item.name]) {
        itemCounts[item.name] = { name: item.name, qty: 0, revenue: 0 };
      }
      itemCounts[item.name].qty += item.qty;
      itemCounts[item.name].revenue += item.itemTotal;
    });
  });

  const topItems = Object.values(itemCounts)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const handleExportCSV = () => {
    const headers = 'Order ID,Table,Total,Payment Method,Status,Created At\n';
    const rows = orders
      .map(
        (o) =>
          `"${o.id}","${o.tableNumber}","${o.total}","${
            o.payment.method || 'pending'
          }","${o.status}","${o.createdAt}"`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `dineflow_sales_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            Sales & Operational Analytics
          </h2>
          <p className="text-sm text-stone-500">
            Real-time daily sales, item velocities, payment splits, and CSV export.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl bg-stone-200/70 dark:bg-stone-800 p-1 text-xs font-semibold">
            <button
              onClick={() => setTimeframe('today')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                timeframe === 'today'
                  ? 'bg-white dark:bg-stone-900 text-accent shadow-sm'
                  : 'text-stone-500'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setTimeframe('week')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                timeframe === 'week'
                  ? 'bg-white dark:bg-stone-900 text-accent shadow-sm'
                  : 'text-stone-500'
              }`}
            >
              This Week
            </button>
          </div>

          <Button
            size="sm"
            onClick={handleExportCSV}
            leftIcon={<Download className="h-4 w-4" />}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Revenue"
          value={`₹${totalSales}`}
          icon={<IndianRupee className="h-5 w-5" />}
          description="Gross sales across tables"
        />
        <StatCard
          label="Total Orders"
          value={totalOrders}
          icon={<ShoppingBag className="h-5 w-5" />}
          description="Tickets processed"
        />
        <StatCard
          label="Avg Ticket Size"
          value={`₹${avgOrderValue}`}
          icon={<TrendingUp className="h-5 w-5" />}
          description="Per table order"
        />
        <StatCard
          label="UPI Collection"
          value={`₹${upiSales}`}
          icon={<CreditCard className="h-5 w-5" />}
          description="Digital QR payments"
        />
      </div>

      {/* Analytics Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Items Table */}
        <GlassCard className="p-5 space-y-4">
          <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center justify-between">
            <span>Top Performing Dishes & Drinks</span>
            <span className="text-xs font-normal text-stone-400">By Quantity Sold</span>
          </h3>

          {topItems.length === 0 ? (
            <p className="text-xs text-stone-400 py-6 text-center">
              No orders placed yet to compute sales velocity.
            </p>
          ) : (
            <div className="divide-y divide-stone-100 dark:divide-stone-800">
              {topItems.map((item, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="h-6 w-6 rounded-lg bg-accent/15 text-accent font-bold flex items-center justify-center text-[11px]">
                      #{idx + 1}
                    </span>
                    <span className="font-semibold text-stone-900 dark:text-stone-100">
                      {item.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-stone-900 dark:text-stone-100 block">
                      {item.qty} sold
                    </span>
                    <span className="text-[11px] text-stone-400">
                      ₹{item.revenue}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Payment Split & Table Traffic */}
        <GlassCard className="p-5 space-y-4">
          <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
            Payment Method Split
          </h3>

          <div className="space-y-3 pt-2">
            <div>
              <div className="flex justify-between text-xs mb-1 font-semibold">
                <span>UPI Payments (GPay/PhonePe/Paytm)</span>
                <span>₹{upiSales}</span>
              </div>
              <div className="h-2 rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full"
                  style={{
                    width: totalSales > 0 ? `${(upiSales / totalSales) * 100}%` : '0%',
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1 font-semibold">
                <span>Cash at Counter</span>
                <span>₹{cashSales}</span>
              </div>
              <div className="h-2 rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{
                    width: totalSales > 0 ? `${(cashSales / totalSales) * 100}%` : '0%',
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1 font-semibold">
                <span>Credit / Debit Card POS</span>
                <span>₹{cardSales}</span>
              </div>
              <div className="h-2 rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
                <div
                  className="h-full bg-sky-500 rounded-full"
                  style={{
                    width: totalSales > 0 ? `${(cardSales / totalSales) * 100}%` : '0%',
                  }}
                />
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default ReportsPage;
