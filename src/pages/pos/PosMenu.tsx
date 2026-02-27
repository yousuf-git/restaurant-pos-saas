import { useState, useEffect } from 'react';
import { Loader2, Package, Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/integrations/supabase/client';
import { ItemWithVariants, ItemVariant } from '@/types/database';
import { toast } from 'sonner';

const PosMenu = () => {
  const user = useAuthStore((s) => s.user);
  const [items, setItems] = useState<ItemWithVariants[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingVariant, setEditingVariant] = useState<{ id: number; price: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchItems = async () => {
    if (!user?.restaurant_id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('items')
      .select('*, item_variants(*)')
      .eq('restaurant_id', user.restaurant_id)
      .order('sort_order')
      .order('name');

    if (error) {
      toast.error('Failed to load menu');
      console.error(error);
    } else {
      const mapped = (data || []).map((item: any) => ({
        ...item,
        variants: (item.item_variants || []).sort((a: ItemVariant, b: ItemVariant) => a.sort_order - b.sort_order),
      }));
      setItems(mapped);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, [user?.restaurant_id]);

  const startEditPrice = (variant: ItemVariant) => {
    setEditingVariant({ id: variant.id, price: String(variant.price) });
  };

  const cancelEdit = () => {
    setEditingVariant(null);
  };

  const savePrice = async () => {
    if (!editingVariant) return;
    const newPrice = Number(editingVariant.price);
    if (isNaN(newPrice) || newPrice < 0) {
      toast.error('Invalid price');
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('item_variants')
      .update({ price: newPrice })
      .eq('id', editingVariant.id);

    if (error) {
      toast.error('Failed to update price');
      console.error(error);
    } else {
      toast.success('Price updated');
      setEditingVariant(null);
      fetchItems();
    }
    setSaving(false);
  };

  const totalItems = items.length;
  const totalVariants = items.reduce((sum, item) => sum + item.variants.length, 0);

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold">Menu</h1>
          {!loading && totalItems > 0 && (
            <span className="text-sm text-muted-foreground font-medium">
              {totalItems} item{totalItems !== 1 ? 's' : ''} &middot; {totalVariants} variant{totalVariants !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          All your menu items are listed here. Feel free to review and update pricing.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center">
          <p className="text-muted-foreground">No menu items found. Ask admin to add items for your restaurant.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-xl border bg-card overflow-hidden shadow-sm">
              <div className="flex items-center gap-3 p-4 border-b bg-muted/30">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="w-10 h-10 rounded-lg object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-semibold">{item.name}</h3>
                  <span className="text-xs text-muted-foreground">
                    {item.variants.length} variant{item.variants.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <Badge variant={item.is_active ? 'default' : 'secondary'} className="text-xs">
                  {item.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                {item.variants.map((v, idx) => (
                  <div
                    key={v.id}
                    className={`flex items-center justify-between px-4 py-3 border-b md:border-b md:border-r last:border-b-0 ${
                      idx % 3 === 2 ? 'xl:border-r-0' : ''
                    } ${idx % 2 === 1 ? 'md:border-r-0 xl:border-r' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">{v.label}</span>
                      {!v.is_active && (
                        <Badge variant="secondary" className="text-xs">Inactive</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {editingVariant?.id === v.id ? (
                        <div className="flex items-center gap-1">
                          <span className="text-sm text-muted-foreground">Rs</span>
                          <Input
                            type="number"
                            value={editingVariant.price}
                            onChange={(e) => setEditingVariant({ ...editingVariant, price: e.target.value })}
                            className="w-24 h-8 text-sm"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') savePrice();
                              if (e.key === 'Escape') cancelEdit();
                            }}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-green-600"
                            onClick={savePrice}
                            disabled={saving}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground"
                            onClick={cancelEdit}
                          >
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEditPrice(v)}
                          className="text-sm font-mono font-semibold text-primary hover:underline cursor-pointer"
                        >
                          Rs {v.price}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PosMenu;
