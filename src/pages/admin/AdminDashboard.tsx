import { useState, useEffect, useMemo } from 'react';
import {
  Building2, Users, ShoppingBag, Loader2, TrendingUp, DollarSign,
  ArrowUpRight, ArrowDownRight, UtensilsCrossed, Clock,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Restaurant } from '@/types/database';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface OrderRow {
  id: number;
  total_amount: number;
  status: string;
  created_at: string;
  restaurant_id: number;
}

interface OrderItemRow {
  item_name: string;
  quantity: number;
  subtotal: number;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
type RevenuePeriod = '7d' | '30d' | '4m' | '1y';
const PERIOD_LABELS: Record<RevenuePeriod, string> = { '7d': '7 Days', '30d': '30 Days', '4m': '4 Months', '1y': 'Yearly' };

const AdminDashboard = () => {
  const [restaurantCount, setRestaurantCount] = useState<number>(0);
  const [userCount, setUserCount] = useState<number>(0);
  const [orderCount, setOrderCount] = useState<number>(0);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [recentRestaurants, setRecentRestaurants] = useState<Restaurant[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItemRow[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [revenuePeriod, setRevenuePeriod] = useState<RevenuePeriod>('7d');

  useEffect(() => {
    const fetchAll = async () => {
      const [rRes, uRes, oRes, recentRes, ordersRes, itemsRes, allRestRes] = await Promise.all([
        supabase.from('restaurants').select('id', { count: 'exact', head: true }),
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id', { count: 'exact', head: true }),
        supabase.from('restaurants').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('orders').select('id, total_amount, status, created_at, restaurant_id').order('created_at', { ascending: false }).limit(5000),
        supabase.from('order_items').select('item_name, quantity, subtotal').limit(1000),
        supabase.from('restaurants').select('id, name'),
      ]);

      setRestaurantCount(rRes.count ?? 0);
      setUserCount(uRes.count ?? 0);
      setOrderCount(oRes.count ?? 0);
      setRecentRestaurants((recentRes.data as Restaurant[]) || []);
      const fetchedOrders = (ordersRes.data as OrderRow[]) || [];
      setOrders(fetchedOrders);
      setOrderItems((itemsRes.data as OrderItemRow[]) || []);
      setRestaurants((allRestRes.data as Restaurant[]) || []);
      setTotalRevenue(
        fetchedOrders
          .filter((o) => o.status === 'confirmed')
          .reduce((sum, o) => sum + (o.total_amount || 0), 0)
      );
      setLoading(false);
    };
    fetchAll();
  }, []);

  /* ---------- derived chart data ---------- */

  // Revenue over selected period
  const revenueChartData = useMemo(() => {
    const confirmed = orders.filter((o) => o.status === 'confirmed');
    const result: { date: string; revenue: number; orders: number }[] = [];

    if (revenuePeriod === '7d') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        const dayOrders = confirmed.filter((o) => o.created_at.slice(0, 10) === key);
        result.push({
          date: label,
          revenue: dayOrders.reduce((s, o) => s + (o.total_amount || 0), 0),
          orders: dayOrders.length,
        });
      }
    } else if (revenuePeriod === '30d') {
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const dayOrders = confirmed.filter((o) => o.created_at.slice(0, 10) === key);
        result.push({
          date: label,
          revenue: dayOrders.reduce((s, o) => s + (o.total_amount || 0), 0),
          orders: dayOrders.length,
        });
      }
    } else if (revenuePeriod === '4m') {
      // Group by week for last 4 months (~17 weeks)
      const start = new Date();
      start.setMonth(start.getMonth() - 4);
      start.setHours(0, 0, 0, 0);
      const startKey = start.toISOString().slice(0, 10);
      const periodOrders = confirmed.filter((o) => o.created_at.slice(0, 10) >= startKey);

      // Build weekly buckets
      const weekStart = new Date(start);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // align to Sunday
      const now = new Date();
      while (weekStart <= now) {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        const wStart = weekStart.toISOString().slice(0, 10);
        const wEnd = weekEnd.toISOString().slice(0, 10);
        const weekOrders = periodOrders.filter((o) => {
          const d = o.created_at.slice(0, 10);
          return d >= wStart && d <= wEnd;
        });
        result.push({
          date: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          revenue: weekOrders.reduce((s, o) => s + (o.total_amount || 0), 0),
          orders: weekOrders.length,
        });
        weekStart.setDate(weekStart.getDate() + 7);
      }
    } else {
      // Yearly — group by month for last 12 months
      for (let i = 11; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        const monthOrders = confirmed.filter((o) => o.created_at.slice(0, 7) === yearMonth);
        result.push({
          date: label,
          revenue: monthOrders.reduce((s, o) => s + (o.total_amount || 0), 0),
          orders: monthOrders.length,
        });
      }
    }

    return result;
  }, [orders, revenuePeriod]);

  // Order status breakdown
  const statusData = useMemo(() => {
    const map: Record<string, number> = {};
    orders.forEach((o) => {
      map[o.status] = (map[o.status] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));
  }, [orders]);

  // Top 5 items by quantity
  const topItems = useMemo(() => {
    const map: Record<string, { qty: number; revenue: number }> = {};
    orderItems.forEach((oi) => {
      if (!map[oi.item_name]) map[oi.item_name] = { qty: 0, revenue: 0 };
      map[oi.item_name].qty += oi.quantity;
      map[oi.item_name].revenue += oi.subtotal;
    });
    return Object.entries(map)
      .sort((a, b) => b[1].qty - a[1].qty)
      .slice(0, 5)
      .map(([name, d]) => ({ name, quantity: d.qty, revenue: d.revenue }));
  }, [orderItems]);

  // Revenue per restaurant
  const revenueByRestaurant = useMemo(() => {
    const map: Record<number, number> = {};
    orders
      .filter((o) => o.status === 'confirmed')
      .forEach((o) => {
        map[o.restaurant_id] = (map[o.restaurant_id] || 0) + (o.total_amount || 0);
      });
    return restaurants
      .map((r) => ({ name: r.name, revenue: map[r.id] || 0 }))
      .filter((r) => r.revenue > 0)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);
  }, [orders, restaurants]);

  // Today vs yesterday comparison
  const todayStats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const todayOrders = orders.filter((o) => o.created_at.slice(0, 10) === today && o.status === 'confirmed');
    const yesterdayOrders = orders.filter((o) => o.created_at.slice(0, 10) === yesterday && o.status === 'confirmed');
    const todayRev = todayOrders.reduce((s, o) => s + (o.total_amount || 0), 0);
    const yesterdayRev = yesterdayOrders.reduce((s, o) => s + (o.total_amount || 0), 0);
    const change = yesterdayRev > 0 ? ((todayRev - yesterdayRev) / yesterdayRev) * 100 : todayRev > 0 ? 100 : 0;
    return { todayRev, todayCount: todayOrders.length, change };
  }, [orders]);

  const PIE_COLORS = ['hsl(142, 71%, 45%)', 'hsl(25, 95%, 53%)', 'hsl(0, 72%, 51%)'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Overview of your restaurant operations</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={Building2}
          label="Restaurants"
          value={String(restaurantCount)}
          accent="bg-info/10 text-info"
        />
        <StatCard
          icon={Users}
          label="Users"
          value={String(userCount)}
          accent="bg-purple-500/10 text-purple-500"
        />
        <StatCard
          icon={ShoppingBag}
          label="Total Orders"
          value={String(orderCount)}
          accent="bg-primary/10 text-primary"
        />
        <StatCard
          icon={DollarSign}
          label="Total Revenue"
          value={`Rs ${totalRevenue.toLocaleString()}`}
          accent="bg-success/10 text-success"
          extra={
            todayStats.change !== 0 ? (
              <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${todayStats.change >= 0 ? 'text-success' : 'text-destructive'}`}>
                {todayStats.change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(todayStats.change).toFixed(1)}% vs yesterday
              </span>
            ) : null
          }
        />
      </div>

      {/* Today highlight */}
      <div className="rounded-xl border bg-gradient-to-r from-primary/5 via-card to-card p-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Clock className="w-4 h-4 text-primary" />
          </div>
          <h3 className="font-semibold">Today's Snapshot</h3>
        </div>
        <div className="flex gap-8 mt-3">
          <div>
            <p className="text-2xl font-bold">Rs {todayStats.todayRev.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Revenue today</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{todayStats.todayCount}</p>
            <p className="text-xs text-muted-foreground">Orders today</p>
          </div>
          <div>
            <p className="text-2xl font-bold">
              {todayStats.todayCount > 0 ? `Rs ${Math.round(todayStats.todayRev / todayStats.todayCount).toLocaleString()}` : '--'}
            </p>
            <p className="text-xs text-muted-foreground">Avg order value</p>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue trend — spans 2 cols */}
        <div className="lg:col-span-2 rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h3 className="font-semibold">Revenue — {PERIOD_LABELS[revenuePeriod]}</h3>
            </div>
            <div className="flex gap-1 bg-muted rounded-lg p-0.5">
              {(Object.keys(PERIOD_LABELS) as RevenuePeriod[]).map((key) => (
                <button
                  key={key}
                  onClick={() => setRevenuePeriod(key)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                    revenuePeriod === key
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {PERIOD_LABELS[key]}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueChartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(25, 95%, 53%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(25, 95%, 53%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  stroke="hsl(220, 10%, 46%)"
                  interval={revenuePeriod === '30d' ? 4 : revenuePeriod === '4m' ? 2 : 0}
                />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 46%)" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(0, 0%, 100%)',
                    border: '1px solid hsl(220, 13%, 91%)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number) => [`Rs ${value.toLocaleString()}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="hsl(25, 95%, 53%)" fill="url(#colorRev)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order status pie */}
        <div className="rounded-xl border bg-card p-5">
          <h3 className="font-semibold mb-4">Order Status</h3>
          {statusData.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-12">No orders yet</p>
          ) : (
            <div className="h-[280px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                    style={{ fontSize: '11px' }}
                  >
                    {statusData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(0, 0%, 100%)',
                      border: '1px solid hsl(220, 13%, 91%)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top items */}
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <UtensilsCrossed className="w-4 h-4 text-primary" />
            <h3 className="font-semibold">Top Selling Items</h3>
          </div>
          {topItems.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-12">No item data yet</p>
          ) : (
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topItems} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 46%)" />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 46%)" width={100} />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(0, 0%, 100%)',
                      border: '1px solid hsl(220, 13%, 91%)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value: number, name: string) => [
                      name === 'quantity' ? value : `Rs ${value.toLocaleString()}`,
                      name === 'quantity' ? 'Qty Sold' : 'Revenue',
                    ]}
                  />
                  <Bar dataKey="quantity" fill="hsl(25, 95%, 53%)" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Revenue per restaurant */}
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-4 h-4 text-primary" />
            <h3 className="font-semibold">Revenue by Restaurant</h3>
          </div>
          {revenueByRestaurant.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-12">No revenue data yet</p>
          ) : (
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueByRestaurant} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(220, 10%, 46%)" interval={0} angle={-20} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 46%)" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(0, 0%, 100%)',
                      border: '1px solid hsl(220, 13%, 91%)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value: number) => [`Rs ${value.toLocaleString()}`, 'Revenue']}
                  />
                  <Bar dataKey="revenue" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} barSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Recent Restaurants */}
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Restaurants</h2>
          <Link to="/admin/restaurants" className="text-sm text-primary hover:underline">View all</Link>
        </div>
        {recentRestaurants.length === 0 ? (
          <p className="text-muted-foreground text-sm">No restaurants yet. Create your first restaurant to get started.</p>
        ) : (
          <div className="space-y-3">
            {recentRestaurants.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors">
                <div className="flex items-center gap-3">
                  {r.logo_url ? (
                    <img src={r.logo_url} alt={r.name} className="w-8 h-8 rounded-lg object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium">{r.name}</p>
                    {r.address && <p className="text-xs text-muted-foreground">{r.address}</p>}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Stat Card                                                          */
/* ------------------------------------------------------------------ */
function StatCard({
  icon: Icon,
  label,
  value,
  accent,
  extra,
}: {
  icon: any;
  label: string;
  value: string;
  accent: string;
  extra?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${accent}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <p className="text-3xl font-bold">{value}</p>
      {extra && <div className="mt-1">{extra}</div>}
    </div>
  );
}

export default AdminDashboard;
