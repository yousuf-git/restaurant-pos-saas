import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Loader2, ChevronDown, ChevronRight, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Restaurant, ItemWithVariants, ItemVariant } from '@/types/database';
import { toast } from 'sonner';

interface VariantForm {
  id?: number;
  label: string;
  price: string;
  is_active: boolean;
  sort_order: number;
}

const emptyItemForm = {
  name: '',
  image_url: '',
  is_active: true,
  sort_order: 0,
};

const ItemList = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('');
  const [items, setItems] = useState<ItemWithVariants[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  // Item form
  const [formOpen, setFormOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [itemForm, setItemForm] = useState(emptyItemForm);
  const [variantForms, setVariantForms] = useState<VariantForm[]>([]);
  const [saving, setSaving] = useState(false);

  // Delete
  const [deleteItemId, setDeleteItemId] = useState<number | null>(null);

  useEffect(() => {
    const fetchRestaurants = async () => {
      const { data } = await supabase.from('restaurants').select('*').order('name');
      const list = (data as Restaurant[]) || [];
      setRestaurants(list);
      if (list.length > 0) setSelectedRestaurant(String(list[0].id));
      setLoading(false);
    };
    fetchRestaurants();
  }, []);

  const fetchItems = async (restaurantId: string) => {
    if (!restaurantId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('items')
      .select('*, item_variants(*)')
      .eq('restaurant_id', Number(restaurantId))
      .order('sort_order')
      .order('name');
    if (error) {
      toast.error('Failed to load items');
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
    if (selectedRestaurant) fetchItems(selectedRestaurant);
  }, [selectedRestaurant]);

  const toggleExpand = (id: number) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openCreate = () => {
    setEditingItemId(null);
    setItemForm(emptyItemForm);
    setVariantForms([{ label: 'Default', price: '', is_active: true, sort_order: 0 }]);
    setFormOpen(true);
  };

  const openEdit = (item: ItemWithVariants) => {
    setEditingItemId(item.id);
    setItemForm({
      name: item.name,
      image_url: item.image_url || '',
      is_active: item.is_active,
      sort_order: item.sort_order,
    });
    setVariantForms(
      item.variants.map((v) => ({
        id: v.id,
        label: v.label,
        price: String(v.price),
        is_active: v.is_active,
        sort_order: v.sort_order,
      }))
    );
    setFormOpen(true);
  };

  const addVariantRow = () => {
    setVariantForms((prev) => [
      ...prev,
      { label: '', price: '', is_active: true, sort_order: prev.length },
    ]);
  };

  const removeVariantRow = (index: number) => {
    setVariantForms((prev) => prev.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: keyof VariantForm, value: any) => {
    setVariantForms((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    );
  };

  const handleSave = async () => {
    if (!itemForm.name.trim()) {
      toast.error('Item name is required');
      return;
    }
    const validVariants = variantForms.filter((v) => v.label.trim() && v.price);
    if (validVariants.length === 0) {
      toast.error('At least one variant with label and price is required');
      return;
    }

    setSaving(true);
    const restaurantId = Number(selectedRestaurant);

    if (editingItemId) {
      // Update item
      const { error: itemError } = await supabase
        .from('items')
        .update({
          name: itemForm.name.trim(),
          image_url: itemForm.image_url.trim() || null,
          is_active: itemForm.is_active,
          sort_order: itemForm.sort_order,
        })
        .eq('id', editingItemId);

      if (itemError) {
        toast.error('Failed to update item');
        setSaving(false);
        return;
      }

      // Handle variants: delete removed, update existing, insert new
      const existingIds = variantForms.filter((v) => v.id).map((v) => v.id!);
      // Delete removed variants
      const { data: currentVariants } = await supabase
        .from('item_variants')
        .select('id')
        .eq('item_id', editingItemId);
      const toDelete = (currentVariants || [])
        .map((v: any) => v.id)
        .filter((id: number) => !existingIds.includes(id));
      if (toDelete.length > 0) {
        await supabase.from('item_variants').delete().in('id', toDelete);
      }

      // Upsert variants
      for (const v of validVariants) {
        if (v.id) {
          await supabase
            .from('item_variants')
            .update({ label: v.label.trim(), price: Number(v.price), is_active: v.is_active, sort_order: v.sort_order })
            .eq('id', v.id);
        } else {
          await supabase.from('item_variants').insert({
            item_id: editingItemId,
            label: v.label.trim(),
            price: Number(v.price),
            is_active: v.is_active,
            sort_order: v.sort_order,
          });
        }
      }
      toast.success('Item updated');
    } else {
      // Create item
      const { data: newItem, error: itemError } = await supabase
        .from('items')
        .insert({
          restaurant_id: restaurantId,
          name: itemForm.name.trim(),
          image_url: itemForm.image_url.trim() || null,
          is_active: itemForm.is_active,
          sort_order: itemForm.sort_order,
        })
        .select()
        .single();

      if (itemError || !newItem) {
        toast.error('Failed to create item');
        setSaving(false);
        return;
      }

      // Insert variants
      const variantsToInsert = validVariants.map((v, i) => ({
        item_id: (newItem as any).id,
        label: v.label.trim(),
        price: Number(v.price),
        is_active: v.is_active,
        sort_order: i,
      }));
      const { error: varError } = await supabase.from('item_variants').insert(variantsToInsert);
      if (varError) {
        toast.error('Item created but variants failed');
        console.error(varError);
      } else {
        toast.success('Item created');
      }
    }

    setSaving(false);
    setFormOpen(false);
    fetchItems(selectedRestaurant);
  };

  const handleDeleteItem = async () => {
    if (!deleteItemId) return;
    // Delete variants first, then item
    await supabase.from('item_variants').delete().eq('item_id', deleteItemId);
    const { error } = await supabase.from('items').delete().eq('id', deleteItemId);
    if (error) {
      toast.error('Failed to delete item');
    } else {
      toast.success('Item deleted');
    }
    setDeleteItemId(null);
    fetchItems(selectedRestaurant);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Items</h1>
        <Button onClick={openCreate} disabled={!selectedRestaurant}>
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* Restaurant Selector */}
      <div className="mb-6">
        <Label>Restaurant</Label>
        <Select value={selectedRestaurant} onValueChange={setSelectedRestaurant}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select restaurant" />
          </SelectTrigger>
          <SelectContent>
            {restaurants.map((r) => (
              <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : !selectedRestaurant ? (
        <div className="rounded-xl border bg-card p-12 text-center">
          <p className="text-muted-foreground">Select a restaurant to manage its items</p>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center">
          <p className="text-muted-foreground mb-2">No items yet</p>
          <p className="text-sm text-muted-foreground">Add items with variants to this restaurant's menu.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="rounded-xl border bg-card overflow-hidden">
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => toggleExpand(item.id)}
              >
                <div className="flex items-center gap-3">
                  {expandedItems.has(item.id) ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                  <div className="flex items-center gap-3">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-8 h-8 rounded-lg object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Package className="w-4 h-4 text-primary" />
                      </div>
                    )}
                    <div>
                      <span className="font-medium">{item.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {item.variants.length} variant{item.variants.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <Badge variant={item.is_active ? 'default' : 'secondary'} className="text-xs">
                    {item.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteItemId(item.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              {expandedItems.has(item.id) && item.variants.length > 0 && (
                <div className="border-t px-4 py-3 bg-muted/20">
                  <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground font-medium mb-2 px-2">
                    <span>Label</span>
                    <span>Price</span>
                    <span>Status</span>
                    <span>Order</span>
                  </div>
                  {item.variants.map((v) => (
                    <div key={v.id} className="grid grid-cols-4 gap-2 text-sm px-2 py-1.5 rounded hover:bg-muted/30">
                      <span>{v.label}</span>
                      <span className="font-mono">Rs {v.price}</span>
                      <Badge variant={v.is_active ? 'default' : 'secondary'} className="text-xs w-fit">
                        {v.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <span className="text-muted-foreground">{v.sort_order}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Item Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{editingItemId ? 'Edit Item' : 'Add Item'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Name <span className="text-destructive">*</span></Label>
              <Input
                value={itemForm.name}
                onChange={(e) => setItemForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Item name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Image URL <span className="text-xs text-muted-foreground">(optional)</span></Label>
                <Input
                  value={itemForm.image_url}
                  onChange={(e) => setItemForm((f) => ({ ...f, image_url: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
              <div>
                <Label>Sort Order <span className="text-xs text-muted-foreground">(optional)</span></Label>
                <Input
                  type="number"
                  value={itemForm.sort_order}
                  onChange={(e) => setItemForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={itemForm.is_active}
                onCheckedChange={(v) => setItemForm((f) => ({ ...f, is_active: v }))}
              />
              <Label>Active</Label>
            </div>

            {/* Variants */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-base font-semibold">Variants <span className="text-destructive">*</span></Label>
                <Button variant="outline" size="sm" onClick={addVariantRow}>
                  <Plus className="w-3 h-3 mr-1" /> Add Variant
                </Button>
              </div>
              <div className="space-y-2">
                {variantForms.map((v, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-lg border bg-muted/20">
                    <Input
                      value={v.label}
                      onChange={(e) => updateVariant(i, 'label', e.target.value)}
                      placeholder="Label *"
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      value={v.price}
                      onChange={(e) => updateVariant(i, 'price', e.target.value)}
                      placeholder="Price *"
                      className="w-28"
                    />
                    <Switch
                      checked={v.is_active}
                      onCheckedChange={(val) => updateVariant(i, 'is_active', val)}
                    />
                    {variantForms.length > 1 && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={() => removeVariantRow(i)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingItemId ? 'Update Item' : 'Create Item'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteItemId !== null} onOpenChange={() => setDeleteItemId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the item and all its variants. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteItem} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ItemList;
