import { useState, useEffect, useCallback } from 'react';
import { Loader2, Printer, Calendar, Search, Package, ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Receipt } from '@/components/pos/Receipt';
import { useAuthStore } from '@/stores/authStore';
import { useBillStore } from '@/stores/billStore';
import { supabase } from '@/integrations/supabase/client';
import { Order, OrderItem, Restaurant } from '@/types/database';
import { toast } from 'sonner';

type DatePreset = 'today' | '7days' | '30days' | 'custom';

function getDateRange(preset: DatePreset): { from: Date; to: Date } {
  const now = new Date();
  const to = new Date(now);
  to.setHours(23, 59, 59, 999);
  const from = new Date(now);

  switch (preset) {
    case 'today':
      from.setHours(0, 0, 0, 0);
      break;
    case '7days':
      from.setDate(from.getDate() - 7);
      from.setHours(0, 0, 0, 0);
      break;
    case '30days':
      from.setDate(from.getDate() - 30);
      from.setHours(0, 0, 0, 0);
      break;
    default:
      from.setHours(0, 0, 0, 0);
  }
  return { from, to };
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function toInputDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const PosOrderHistory = () => {
  const user = useAuthStore((s) => s.user);
  const restaurant = useBillStore((s) => s.restaurant);
  const setRestaurant = useBillStore((s) => s.setRestaurant);

  const [orders, setOrders] = useState<(Order & { order_items?: OrderItem[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [preset, setPreset] = useState<DatePreset>('today');
  const [customFrom, setCustomFrom] = useState(() => toInputDate(new Date()));
  const [customTo, setCustomTo] = useState(() => toInputDate(new Date()));
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);

  const [reprintOrder, setReprintOrder] = useState<(Order & { order_items?: OrderItem[] }) | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  // Fetch restaurant if not available
  useEffect(() => {
    if (restaurant || !user?.restaurant_id) return;
    const fetchRestaurant = async () => {
      const { data } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', user.restaurant_id!)
        .single();
      if (data) setRestaurant(data as Restaurant);
    };
    fetchRestaurant();
  }, [user?.restaurant_id, restaurant, setRestaurant]);

  const fetchOrders = useCallback(async () => {
    if (!user?.restaurant_id) return;
    setLoading(true);

    let from: Date, to: Date;
    if (preset === 'custom') {
      from = new Date(customFrom);
      from.setHours(0, 0, 0, 0);
      to = new Date(customTo);
      to.setHours(23, 59, 59, 999);
    } else {
      ({ from, to } = getDateRange(preset));
    }

    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('restaurant_id', user.restaurant_id!)
      .gte('created_at', from.toISOString())
      .lte('created_at', to.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load orders');
      console.error(error);
    } else {
      setOrders((data as any[]) || []);
    }
    setLoading(false);
  }, [user?.restaurant_id, preset, customFrom, customTo]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handlePrint = (order: Order & { order_items?: OrderItem[] }) => {
    setReprintOrder(order);
    setShowReceipt(true);
    setTimeout(() => {
      window.print();
      setTimeout(() => setShowReceipt(false), 500);
    }, 100);
  };

  const toggleExpand = (orderId: number) => {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId));
  };

  const totalRevenue = orders.filter((o) => o.status === 'confirmed').reduce((s, o) => s + Number(o.total_amount), 0);
  const totalOrders = orders.length;
  const confirmedCount = orders.filter((o) => o.status === 'confirmed').length;

  return (
    <div className="p-6 h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold">Order History</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Complete history of all orders. Filter by date to find specific orders.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {(['today', '7days', '30days'] as DatePreset[]).map((p) => (
          <Button
            key={p}
            variant={preset === p ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPreset(p)}
          >
            {p === 'today' ? 'Today' : p === '7days' ? 'Last 7 Days' : 'Last 30 Days'}
          </Button>
        ))}
        <Button
          variant={preset === 'custom' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setPreset('custom')}
        >
          <Calendar className="w-3.5 h-3.5 mr-1.5" />
          Custom
        </Button>

        {preset === 'custom' && (
          <div className="flex items-center gap-2 ml-2">
            <Input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="h-8 w-36 text-sm"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <Input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="h-8 w-36 text-sm"
            />
          </div>
        )}
      </div>

      {/* Summary strip */}
      {!loading && (
        <div className="flex items-center gap-6 mb-4 px-4 py-3 rounded-xl border bg-card shadow-sm">
          <div className="text-sm">
            <span className="text-muted-foreground">Total Orders:</span>{' '}
            <strong>{totalOrders}</strong>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Confirmed:</span>{' '}
            <strong className="text-green-600">{confirmedCount}</strong>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Revenue:</span>{' '}
            <strong className="text-primary">Rs {totalRevenue.toLocaleString()}</strong>
          </div>
        </div>
      )}

      {/* Orders list */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 rounded-xl border bg-card">
            <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No orders found for the selected period</p>
          </div>
        ) : (
          <div className="space-y-2">
            {orders.map((order) => {
              const isExpanded = expandedOrderId === order.id;
              return (
                <div key={order.id} className="rounded-xl border bg-card shadow-sm overflow-hidden">
                  {/* Order header row */}
                  <button
                    onClick={() => toggleExpand(order.id)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-mono font-bold text-primary text-sm">#{order.order_number}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(order.created_at)} &middot; {formatTime(order.created_at)}
                      </span>
                      <Badge
                        variant={order.status === 'confirmed' ? 'default' : order.status === 'cancelled' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {order.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-sm">Rs {Number(order.total_amount).toLocaleString()}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </button>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="border-t px-4 py-3 bg-muted/10">
                      {/* Items table */}
                      {order.order_items && order.order_items.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-xs text-muted-foreground border-b">
                                <th className="text-left py-2 pr-4 font-medium">Item</th>
                                <th className="text-center py-2 px-2 font-medium">Qty</th>
                                <th className="text-right py-2 px-2 font-medium">Unit Price</th>
                                <th className="text-right py-2 pl-2 font-medium">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {order.order_items.map((oi: OrderItem) => (
                                <tr key={oi.id} className="border-b last:border-0">
                                  <td className="py-2 pr-4">
                                    {oi.item_name}
                                    {oi.variant_label !== 'Default' && (
                                      <span className="text-muted-foreground ml-1">({oi.variant_label})</span>
                                    )}
                                  </td>
                                  <td className="py-2 px-2 text-center">{oi.quantity}</td>
                                  <td className="py-2 px-2 text-right font-mono">Rs {oi.unit_price}</td>
                                  <td className="py-2 pl-2 text-right font-mono font-medium">Rs {oi.subtotal}</td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr className="border-t font-semibold">
                                <td colSpan={3} className="py-2 text-right pr-2">Total</td>
                                <td className="py-2 pl-2 text-right font-mono">Rs {Number(order.total_amount).toLocaleString()}</td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No items</p>
                      )}

                      {order.note && (
                        <p className="text-xs text-muted-foreground mt-2 italic">Note: {order.note}</p>
                      )}

                      {/* Print button */}
                      <div className="mt-3 flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePrint(order);
                          }}
                        >
                          <Printer className="w-3.5 h-3.5 mr-1.5" />
                          Print Receipt
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Print receipt (hidden, only shows during print) */}
      {showReceipt && reprintOrder && (
        <Receipt
          restaurant={restaurant}
          orderNumber={reprintOrder.order_number}
          items={(reprintOrder.order_items || []).map((oi: OrderItem) => ({
            item_variant_id: oi.item_variant_id || 0,
            item_name: oi.item_name,
            variant_label: oi.variant_label,
            quantity: oi.quantity,
            unit_price: oi.unit_price,
          }))}
          total={reprintOrder.total_amount}
          note={reprintOrder.note || ''}
          dateTime={new Date(reprintOrder.created_at)}
        />
      )}
    </div>
  );
};

export default PosOrderHistory;
