import { useState, useEffect } from 'react';
import { Building2, Users, ShoppingBag, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Restaurant } from '@/types/database';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const [restaurantCount, setRestaurantCount] = useState<number | null>(null);
  const [userCount, setUserCount] = useState<number | null>(null);
  const [orderCount, setOrderCount] = useState<number | null>(null);
  const [recentRestaurants, setRecentRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [rRes, uRes, oRes, recentRes] = await Promise.all([
        supabase.from('restaurants').select('id', { count: 'exact', head: true }),
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id', { count: 'exact', head: true }),
        supabase.from('restaurants').select('*').order('created_at', { ascending: false }).limit(5),
      ]);
      setRestaurantCount(rRes.count ?? 0);
      setUserCount(uRes.count ?? 0);
      setOrderCount(oRes.count ?? 0);
      setRecentRestaurants((recentRes.data as Restaurant[]) || []);
      setLoading(false);
    };
    fetchStats();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard icon={Building2} label="Restaurants" value={loading ? null : String(restaurantCount ?? 0)} />
        <StatCard icon={Users} label="Users" value={loading ? null : String(userCount ?? 0)} />
        <StatCard icon={ShoppingBag} label="Total Orders" value={loading ? null : String(orderCount ?? 0)} />
      </div>

      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Restaurants</h2>
          <Link to="/admin/restaurants" className="text-sm text-primary hover:underline">View all</Link>
        </div>
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : recentRestaurants.length === 0 ? (
          <p className="text-muted-foreground text-sm">No restaurants yet. Create your first restaurant to get started.</p>
        ) : (
          <div className="space-y-3">
            {recentRestaurants.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
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

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string | null }) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      {value === null ? (
        <div className="h-9 w-16 bg-muted animate-pulse rounded" />
      ) : (
        <p className="text-3xl font-bold">{value}</p>
      )}
    </div>
  );
}

export default AdminDashboard;
