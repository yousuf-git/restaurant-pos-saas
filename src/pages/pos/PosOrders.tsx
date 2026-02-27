import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Search, Loader2, History, Printer, ArrowLeft, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { BillPanel } from '@/components/pos/BillPanel';
import { ItemCard } from '@/components/pos/ItemCard';
import { VariantPicker } from '@/components/pos/VariantPicker';
import { Receipt } from '@/components/pos/Receipt';
import { useBillStore } from '@/stores/billStore';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/integrations/supabase/client';
import { ItemWithVariants, ItemVariant, Order, OrderItem, Restaurant } from '@/types/database';
import { toast } from 'sonner';

type Tab = 'new-order' | 'history';

const PosOrders = () => {
  const [search, setSearch] = useState('');
  const [variantPickerItem, setVariantPickerItem] = useState<ItemWithVariants | null>(null);
  const [items, setItems] = useState<ItemWithVariants[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [tab, setTab] = useState<Tab>('new-order');

  // Order history
  const [orders, setOrders] = useState<(Order & { order_items?: OrderItem[] })[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [reprintOrder, setReprintOrder] = useState<(Order & { order_items?: OrderItem[] }) | null>(null);
  const [showHistoryReceipt, setShowHistoryReceipt] = useState(false);

  const addItem = useBillStore((s) => s.addItem);
  const setRestaurant = useBillStore((s) => s.setRestaurant);
  const restaurant = useBillStore((s) => s.restaurant);
  const user = useAuthStore((s) => s.user);

  const searchRef = useRef<HTMLInputElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [focusedItemIndex, setFocusedItemIndex] = useState(-1);
  const [focusArea, setFocusArea] = useState<'search' | 'grid' | 'bill'>('search');
  const [focusedBillIndex, setFocusedBillIndex] = useState(0);

  // Fetch restaurant info
  useEffect(() => {
    if (!user?.restaurant_id) return;
    const fetchRestaurant = async () => {
      const { data } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', user.restaurant_id!)
        .single();
      if (data) setRestaurant(data as Restaurant);
    };
    fetchRestaurant();
  }, [user?.restaurant_id, setRestaurant]);

  // Fetch items from DB
  useEffect(() => {
    if (!user?.restaurant_id) return;
    const fetchItems = async () => {
      setLoadingItems(true);
      const { data, error } = await supabase
        .from('items')
        .select('*, item_variants(*)')
        .eq('restaurant_id', user.restaurant_id!)
        .eq('is_active', true)
        .order('sort_order');

      if (error) {
        toast.error('Failed to load items');
        console.error(error);
      } else {
        const mapped = (data || []).map((item: any) => ({
          ...item,
          variants: (item.item_variants || [])
            .filter((v: ItemVariant) => v.is_active)
            .sort((a: ItemVariant, b: ItemVariant) => a.sort_order - b.sort_order),
        }));
        setItems(mapped);
      }
      setLoadingItems(false);
    };
    fetchItems();
  }, [user?.restaurant_id]);

  // Fetch order history
  const fetchOrders = useCallback(async () => {
    if (!user?.restaurant_id) return;
    setLoadingOrders(true);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('restaurant_id', user.restaurant_id!)
      .gte('created_at', today.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load orders');
    } else {
      setOrders((data as any[]) || []);
    }
    setLoadingOrders(false);
  }, [user?.restaurant_id]);

  useEffect(() => {
    if (tab === 'history') fetchOrders();
  }, [tab, fetchOrders]);

  const filteredItems = useMemo(() => {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter(item => item.name.toLowerCase().includes(q));
  }, [search, items]);

  const handleItemClick = (item: ItemWithVariants) => {
    const activeVariants = item.variants.filter(v => v.is_active);
    if (activeVariants.length === 1) {
      const v = activeVariants[0];
      addItem({
        item_variant_id: v.id,
        item_name: item.name,
        variant_label: v.label,
        unit_price: v.price,
      });
    } else if (activeVariants.length > 1) {
      setVariantPickerItem(item);
    }
  };

  const handleVariantSelect = (variant: { id: number; label: string; price: number }, itemName: string) => {
    addItem({
      item_variant_id: variant.id,
      item_name: itemName,
      variant_label: variant.label,
      unit_price: variant.price,
    });
    setVariantPickerItem(null);
  };

  const handleReprintOrder = (order: Order & { order_items?: OrderItem[] }) => {
    setReprintOrder(order);
    setShowHistoryReceipt(true);
    setTimeout(() => {
      window.print();
      setTimeout(() => setShowHistoryReceipt(false), 500);
    }, 100);
  };

  // Get actual grid columns from DOM
  const getActualGridCols = useCallback((): number => {
    if (!gridRef.current || gridRef.current.children.length === 0) return 1;
    const firstChild = gridRef.current.children[0] as HTMLElement;
    const secondChild = gridRef.current.children[1] as HTMLElement;
    if (!secondChild) return 1;
    // If the top of first and second child are the same, they're in the same row
    // Count how many are in the first row
    const firstTop = firstChild.offsetTop;
    let cols = 0;
    for (let i = 0; i < gridRef.current.children.length; i++) {
      if ((gridRef.current.children[i] as HTMLElement).offsetTop === firstTop) {
        cols++;
      } else {
        break;
      }
    }
    return cols || 1;
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If variant picker is open, let it handle keys
      if (variantPickerItem) return;

      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      const isSearchFocused = target === searchRef.current;

      // Ctrl+K or / — Focus search
      if ((e.key === '/' && !isInput) || (e.ctrlKey && e.key === 'k')) {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
        setFocusArea('search');
        return;
      }

      // Ctrl+Enter — Confirm order
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        const confirmBtn = document.querySelector('[data-confirm-order]') as HTMLButtonElement;
        if (confirmBtn && !confirmBtn.disabled) confirmBtn.click();
        return;
      }

      // Ctrl+P — Print
      if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        const printBtn = document.querySelector('[data-reprint]') as HTMLButtonElement;
        if (printBtn && !printBtn.disabled) printBtn.click();
        return;
      }

      // Escape — Clear search if in search, else clear order
      if (e.key === 'Escape') {
        e.preventDefault();
        if (isSearchFocused) {
          setSearch('');
          searchRef.current?.blur();
        } else {
          useBillStore.getState().clear();
          setFocusedBillIndex(0);
        }
        return;
      }

      // Tab — ONLY switch focus between grid and bill (no native tab behavior)
      if (e.key === 'Tab') {
        e.preventDefault();
        if (focusArea === 'search' || focusArea === 'grid') {
          setFocusArea('bill');
          setFocusedBillIndex(0);
          // Blur search if focused
          if (isSearchFocused) searchRef.current?.blur();
        } else {
          setFocusArea('grid');
          if (focusedItemIndex < 0) setFocusedItemIndex(0);
        }
        return;
      }

      // --- Grid navigation ---
      if (focusArea === 'grid' || isSearchFocused) {
        const cols = getActualGridCols();
        const totalItems = filteredItems.length;

        if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (isSearchFocused) {
            setFocusArea('grid');
            setFocusedItemIndex(0);
            searchRef.current?.blur();
          } else {
            const nextIdx = focusedItemIndex + cols;
            if (nextIdx < totalItems) {
              setFocusedItemIndex(nextIdx);
            }
            // If would go past end, stay put
          }
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (focusArea === 'grid') {
            const nextIdx = focusedItemIndex - cols;
            if (nextIdx < 0) {
              // Go back to search
              searchRef.current?.focus();
              setFocusArea('search');
              setFocusedItemIndex(-1);
            } else {
              setFocusedItemIndex(nextIdx);
            }
          }
          return;
        }
        if (e.key === 'ArrowRight' && !isSearchFocused) {
          e.preventDefault();
          if (focusedItemIndex < totalItems - 1) {
            setFocusedItemIndex(focusedItemIndex + 1);
          }
          return;
        }
        if (e.key === 'ArrowLeft' && !isSearchFocused) {
          e.preventDefault();
          if (focusedItemIndex > 0) {
            setFocusedItemIndex(focusedItemIndex - 1);
          }
          return;
        }
        if (e.key === 'Enter' && focusArea === 'grid' && focusedItemIndex >= 0 && focusedItemIndex < totalItems) {
          e.preventDefault();
          handleItemClick(filteredItems[focusedItemIndex]);
          return;
        }
      }

      // --- Bill navigation ---
      if (focusArea === 'bill' && !isInput) {
        const billItems = useBillStore.getState().items;

        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setFocusedBillIndex((prev) => Math.min(prev + 1, billItems.length - 1));
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setFocusedBillIndex((prev) => Math.max(prev - 1, 0));
          return;
        }

        if (focusedBillIndex >= 0 && focusedBillIndex < billItems.length) {
          const currentItem = billItems[focusedBillIndex];
          if (e.key === '+' || e.key === '=') {
            e.preventDefault();
            useBillStore.getState().updateQuantity(currentItem.item_variant_id, currentItem.quantity + 1);
            return;
          }
          if (e.key === '-') {
            e.preventDefault();
            useBillStore.getState().updateQuantity(currentItem.item_variant_id, currentItem.quantity - 1);
            // If item was removed, adjust index
            if (currentItem.quantity <= 1) {
              setFocusedBillIndex((prev) => Math.max(prev - 1, 0));
            }
            return;
          }
          if (e.key === 'Delete' || e.key === 'Backspace') {
            e.preventDefault();
            useBillStore.getState().removeItem(currentItem.item_variant_id);
            setFocusedBillIndex((prev) => Math.min(prev, billItems.length - 2));
            return;
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusArea, focusedItemIndex, focusedBillIndex, filteredItems, variantPickerItem, getActualGridCols]);

  // Scroll focused grid item into view
  useEffect(() => {
    if (focusArea === 'grid' && focusedItemIndex >= 0 && gridRef.current) {
      const el = gridRef.current.children[focusedItemIndex] as HTMLElement;
      if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [focusedItemIndex, focusArea]);

  return (
    <div className="flex h-screen">
      {/* Item grid area */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden">
        {/* Search + History toggle */}
        {tab === 'new-order' ? (
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search items... ( / or Ctrl+K )"
                className="pl-10"
                onFocus={() => setFocusArea('search')}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTab('history')}
              className="shrink-0 gap-1.5"
            >
              <Clock className="w-4 h-4" />
              Today's Orders
            </Button>
          </div>
        ) : (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-bold">Today's Orders</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTab('new-order')}
                className="shrink-0 gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                New Order
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {orders.length > 0
                ? `${orders.length} order${orders.length !== 1 ? 's' : ''} placed today`
                : 'No orders placed today yet'}
            </p>
          </div>
        )}

        {tab === 'new-order' ? (
          /* Item Grid */
          <div className="flex-1 overflow-auto" onScroll={(e) => e.stopPropagation()}>
            {loadingItems ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-muted-foreground">
                  {items.length === 0 ? 'No items found for this restaurant' : 'No items match your search'}
                </p>
              </div>
            ) : (
              <div
                ref={gridRef}
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3"
              >
                {filteredItems.map((item, index) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    onClick={() => handleItemClick(item)}
                    focused={focusArea === 'grid' && focusedItemIndex === index}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Today's Order History */
          <div className="flex-1 overflow-auto">
            {loadingOrders ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-20 rounded-xl border bg-card">
                <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No orders today</p>
              </div>
            ) : (
              <div className="space-y-2">
                {orders.map((order) => (
                  <div key={order.id} className="rounded-xl border bg-card shadow-sm p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-mono font-bold text-primary">#{order.order_number}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          order.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold font-mono">Rs {Number(order.total_amount).toLocaleString()}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReprintOrder(order)}
                          className="gap-1"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Print
                        </Button>
                      </div>
                    </div>
                    {order.order_items && order.order_items.length > 0 && (
                      <div className="text-sm text-muted-foreground">
                        {order.order_items.map((oi: OrderItem, idx: number) => (
                          <span key={oi.id}>
                            {oi.item_name}
                            {oi.variant_label !== 'Default' ? ` (${oi.variant_label})` : ''}
                            {' x'}{oi.quantity}
                            {idx < order.order_items!.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </div>
                    )}
                    {order.note && (
                      <p className="text-xs text-muted-foreground mt-1 italic">Note: {order.note}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bill panel */}
      <BillPanel focused={focusArea === 'bill'} focusedBillIndex={focusedBillIndex} />

      {/* Variant picker */}
      {variantPickerItem && (
        <VariantPicker
          item={variantPickerItem}
          onSelect={(v) => handleVariantSelect(v, variantPickerItem.name)}
          onClose={() => setVariantPickerItem(null)}
        />
      )}

      {/* Reprint receipt for history orders — only shown during print */}
      {showHistoryReceipt && reprintOrder && (
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

export default PosOrders;
