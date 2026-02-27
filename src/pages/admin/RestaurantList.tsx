import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Building2, Phone, MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { Restaurant } from '@/types/database';
import { toast } from 'sonner';

const emptyForm = {
  name: '',
  phone: '',
  address: '',
  logo_url: '',
  receipt_header: '',
  receipt_footer: '',
};

const RestaurantList = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchRestaurants = async () => {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      toast.error('Failed to load restaurants');
      console.error(error);
    } else {
      setRestaurants(data as Restaurant[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (r: Restaurant) => {
    setEditingId(r.id);
    setForm({
      name: r.name,
      phone: r.phone || '',
      address: r.address || '',
      logo_url: r.logo_url || '',
      receipt_header: r.receipt_header || '',
      receipt_footer: r.receipt_footer || '',
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Restaurant name is required');
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      address: form.address.trim() || null,
      logo_url: form.logo_url.trim() || null,
      receipt_header: form.receipt_header.trim() || null,
      receipt_footer: form.receipt_footer.trim() || null,
    };

    if (editingId) {
      const { error } = await supabase
        .from('restaurants')
        .update(payload)
        .eq('id', editingId);
      if (error) {
        toast.error('Failed to update restaurant');
        console.error(error);
      } else {
        toast.success('Restaurant updated');
      }
    } else {
      const { error } = await supabase.from('restaurants').insert(payload);
      if (error) {
        toast.error('Failed to create restaurant');
        console.error(error);
      } else {
        toast.success('Restaurant created');
      }
    }
    setSaving(false);
    setFormOpen(false);
    fetchRestaurants();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('restaurants').delete().eq('id', deleteId);
    if (error) {
      toast.error('Failed to delete restaurant. It may have associated data.');
      console.error(error);
    } else {
      toast.success('Restaurant deleted');
    }
    setDeleteId(null);
    fetchRestaurants();
  };

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Restaurants</h1>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add Restaurant
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : restaurants.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center">
          <p className="text-muted-foreground mb-2">No restaurants yet</p>
          <p className="text-sm text-muted-foreground">Create your first restaurant to start managing orders.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {restaurants.map((r) => (
            <div key={r.id} className="rounded-xl border bg-card p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {r.logo_url ? (
                    <img src={r.logo_url} alt={r.name} className="w-10 h-10 rounded-lg object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold">{r.name}</h3>
                    {r.phone && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" /> {r.phone}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(r)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(r.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              {r.address && (
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 shrink-0" /> {r.address}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Restaurant' : 'Add Restaurant'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Name <span className="text-destructive">*</span></Label>
              <Input
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="Restaurant name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Phone <span className="text-xs text-muted-foreground">(optional)</span></Label>
                <Input
                  value={form.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="+92 300 1234567"
                />
              </div>
              <div>
                <Label>Logo URL <span className="text-xs text-muted-foreground">(optional)</span></Label>
                <Input
                  value={form.logo_url}
                  onChange={(e) => updateField('logo_url', e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>
            <div>
              <Label>Address <span className="text-xs text-muted-foreground">(optional)</span></Label>
              <Input
                value={form.address}
                onChange={(e) => updateField('address', e.target.value)}
                placeholder="Full address"
              />
            </div>
            <div>
              <Label>Receipt Header <span className="text-xs text-muted-foreground">(optional)</span></Label>
              <Textarea
                value={form.receipt_header}
                onChange={(e) => updateField('receipt_header', e.target.value)}
                placeholder="Text shown at top of receipts"
                rows={2}
              />
            </div>
            <div>
              <Label>Receipt Footer <span className="text-xs text-muted-foreground">(optional)</span></Label>
              <Textarea
                value={form.receipt_footer}
                onChange={(e) => updateField('receipt_footer', e.target.value)}
                placeholder="Text shown at bottom of receipts"
                rows={2}
              />
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingId ? 'Update Restaurant' : 'Create Restaurant'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Restaurant?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All associated items, orders, and users will be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RestaurantList;
