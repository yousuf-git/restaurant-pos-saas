import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, TrendingUp, ShoppingBag, DollarSign, Calendar, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/integrations/supabase/client';
import { Order, OrderItem } from '@/types/database';

const PosSummary = () => {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [todayOrders, setTodayOrders] = useState<(Order & { order_items?: OrderItem[] })[]>([]);
  const [weekOrders, setWeekOrders] = useState<Order[]>([]);
  const [monthOrders, setMonthOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!user?.restaurant_id) return;
    const fetchSummary = async () => {
      setLoading(true);
      const now = new Date();
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - 7);
      weekStart.setHours(0, 0, 0, 0);
      const monthStart = new Date(now);
      monthStart.setDate(monthStart.getDate() - 30);
      monthStart.setHours(0, 0, 0, 0);

      const [todayRes, weekRes, monthRes] = await Promise.all([
        supabase
          .from('orders')
          .select('*, order_items(*)')
          .eq('restaurant_id', user.restaurant_id!)
          .gte('created_at', todayStart.toISOString())
          .order('created_at', { ascending: false }),
        supabase
          .from('orders')
          .select('*')
          .eq('restaurant_id', user.restaurant_id!)
          .gte('created_at', weekStart.toISOString())
          .eq('status', 'confirmed'),
        supabase
          .from('orders')
          .select('*')
          .eq('restaurant_id', user.restaurant_id!)
          .gte('created_at', monthStart.toISOString())
          .eq('status', 'confirmed'),
      ]);

      setTodayOrders((todayRes.data as any[]) || []);
      setWeekOrders((weekRes.data as Order[]) || []);
      setMonthOrders((monthRes.data as Order[]) || []);
      setLoading(false);
    };
    fetchSummary();
  }, [user?.restaurant_id]);

  const confirmedToday = todayOrders.filter((o) => o.status === 'confirmed');
  const todayRevenue = confirmedToday.reduce((sum, o) => sum + Number(o.total_amount), 0);
  const weekRevenue = weekOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
  const monthRevenue = monthOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);

  const todayOrderCount = confirmedToday.length;
  const weekOrderCount = weekOrders.length;
  const monthOrderCount = monthOrders.length;

  const todayAvg = todayOrderCount > 0 ? Math.round(todayRevenue / todayOrderCount) : 0;
  const weekAvg = weekOrderCount > 0 ? Math.round(weekRevenue / weekOrderCount) : 0;
  const monthAvg = monthOrderCount > 0 ? Math.round(monthRevenue / monthOrderCount) : 0;

  // Top selling items today
  const itemCounts: Record<string, { name: string; qty: number; revenue: number }> = {};
  confirmedToday.forEach((o) => {
    (o.order_items || []).forEach((oi) => {
      const key = oi.item_name + (oi.variant_label !== 'Default' ? ` (${oi.variant_label})` : '');
      if (!itemCounts[key]) itemCounts[key] = { name: key, qty: 0, revenue: 0 };
      itemCounts[key].qty += oi.quantity;
      itemCounts[key].revenue += oi.subtotal;
    });
  });
  const topItems = Object.values(itemCounts)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 10);

  return (
    <div className="p-6 h-screen overflow-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Sales Summary</h1>
        <p className="text-sm text-muted-foreground mt-1">Overview of your restaurant's performance</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Revenue Section */}
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b bg-muted/30 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              <h2 className="font-semibold text-sm">Revenue</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x">
              <MetricCell label="Today" value={`Rs ${todayRevenue.toLocaleString()}`} highlight />
              <MetricCell label="Last 7 Days" value={`Rs ${weekRevenue.toLocaleString()}`} />
              <MetricCell label="Last 30 Days" value={`Rs ${monthRevenue.toLocaleString()}`} />
            </div>
          </div>

          {/* Orders Count Section */}
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b bg-muted/30 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-sm">Number of Orders</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x">
              <MetricCell label="Today" value={String(todayOrderCount)} highlight />
              <MetricCell label="Last 7 Days" value={String(weekOrderCount)} />
              <MetricCell label="Last 30 Days" value={String(monthOrderCount)} />
            </div>
          </div>

          {/* Avg Order Value Section */}
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b bg-muted/30 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <h2 className="font-semibold text-sm">Average Order Value</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x">
              <MetricCell label="Today" value={`Rs ${todayAvg.toLocaleString()}`} highlight />
              <MetricCell label="Last 7 Days" value={`Rs ${weekAvg.toLocaleString()}`} />
              <MetricCell label="Last 30 Days" value={`Rs ${monthAvg.toLocaleString()}`} />
            </div>
          </div>

          {/* Bottom sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Selling Items */}
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b bg-muted/30">
                <h2 className="font-semibold text-sm">Top Items Today</h2>
              </div>
              <div className="p-5">
                {topItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No orders yet today</p>
                ) : (
                  <div className="space-y-1">
                    {topItems.map((item, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono text-muted-foreground w-5">{i + 1}.</span>
                          <span className="text-sm font-medium">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-muted-foreground">{item.qty} sold</span>
                          <span className="text-sm font-semibold font-mono">Rs {item.revenue.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Orders */}
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b bg-muted/30 flex items-center justify-between">
                <h2 className="font-semibold text-sm">Recent Orders</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7 gap-1"
                  onClick={() => navigate('/pos/order-history')}
                >
                  View All
                  <ArrowRight className="w-3 h-3" />
                </Button>
              </div>
              <div className="p-5">
                {todayOrders.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No orders yet today</p>
                ) : (
                  <div className="space-y-1">
                    {todayOrders.slice(0, 10).map((order) => (
                      <div key={order.id} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-primary text-sm">#{order.order_number}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                            order.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                            order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                        <span className="text-sm font-semibold font-mono">Rs {Number(order.total_amount).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function MetricCell({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="px-5 py-4">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-2xl font-bold ${highlight ? 'text-foreground' : 'text-muted-foreground/80'}`}>{value}</p>
    </div>
  );
}

export default PosSummary;
