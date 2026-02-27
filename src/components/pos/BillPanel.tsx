import { useState, useRef, useEffect, useCallback } from 'react';
import { useBillStore } from '@/stores/billStore';
import { useAuthStore } from '@/stores/authStore';
import { Minus, Plus, Trash2, X, Printer, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Receipt } from './Receipt';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface BillPanelProps {
  focused?: boolean;
  focusedBillIndex?: number;
}

export function BillPanel({ focused, focusedBillIndex }: BillPanelProps) {
  const items = useBillStore((s) => s.items);
  const note = useBillStore((s) => s.note);
  const lastOrderNumber = useBillStore((s) => s.lastOrderNumber);
  const lastOrder = useBillStore((s) => s.lastOrder);
  const restaurant = useBillStore((s) => s.restaurant);
  const updateQuantity = useBillStore((s) => s.updateQuantity);
  const removeItem = useBillStore((s) => s.removeItem);
  const setNote = useBillStore((s) => s.setNote);
  const clear = useBillStore((s) => s.clear);
  const total = useBillStore((s) => s.total);
  const setLastOrder = useBillStore((s) => s.setLastOrder);
  const user = useAuthStore((s) => s.user);

  const [confirming, setConfirming] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [printData, setPrintData] = useState<{
    orderNumber: number;
    items: typeof items;
    total: number;
    note: string;
    dateTime: Date;
  } | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);
  const billItemsRef = useRef<HTMLDivElement>(null);

  const totalAmount = total();

  // Scroll focused bill item into view
  useEffect(() => {
    if (focused && focusedBillIndex !== undefined && focusedBillIndex >= 0 && billItemsRef.current) {
      const el = billItemsRef.current.children[focusedBillIndex] as HTMLElement;
      el?.scrollIntoView({ block: 'nearest' });
    }
  }, [focused, focusedBillIndex]);

  const triggerPrint = useCallback(() => {
    setShowReceipt(true);
    setTimeout(() => {
      window.print();
      // Hide receipt after printing
      setTimeout(() => setShowReceipt(false), 500);
    }, 100);
  }, []);

  const handleConfirmOrder = async () => {
    if (!user?.restaurant_id || !user?.id) {
      toast.error('User session error. Please re-login.');
      return;
    }

    setConfirming(true);

    // Get next order number
    const { data: orderNum, error: numError } = await supabase.rpc('get_next_order_number', {
      p_restaurant_id: user.restaurant_id,
    });

    if (numError || !orderNum) {
      toast.error('Failed to generate order number');
      console.error(numError);
      setConfirming(false);
      return;
    }

    // Insert order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        restaurant_id: user.restaurant_id,
        operator_id: user.id,
        order_number: orderNum,
        total_amount: totalAmount,
        status: 'confirmed',
        note: note.trim() || null,
      })
      .select()
      .single();

    if (orderError || !order) {
      toast.error('Failed to save order');
      console.error(orderError);
      setConfirming(false);
      return;
    }

    // Insert order items
    const orderItems = items.map((item) => ({
      order_id: (order as any).id,
      item_variant_id: item.item_variant_id,
      item_name: item.item_name,
      variant_label: item.variant_label,
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.unit_price * item.quantity,
    }));

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems);

    if (itemsError) {
      toast.error('Order saved but items failed to save');
      console.error(itemsError);
    }

    const now = new Date();
    const orderData = {
      orderNumber: orderNum,
      items: [...items],
      total: totalAmount,
      note: note,
      dateTime: now,
    };

    // Set print data and trigger print
    setPrintData(orderData);
    setLastOrder(orderData);
    clear();
    setConfirming(false);
    toast.success(`Order #${orderNum} confirmed`);
    triggerPrint();
  };

  const handleReprint = () => {
    if (lastOrder) {
      setPrintData(lastOrder);
      triggerPrint();
    }
  };

  const receiptData = printData || lastOrder;

  return (
    <div className={cn(
      'w-[320px] bg-bill text-bill-foreground flex flex-col border-l border-bill-border shrink-0 transition-all',
      focused && 'ring-2 ring-primary/60 ring-inset'
    )}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-bill-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-sm">Current Order</h2>
          {items.length > 0 && (
            <span className="text-xs bg-bill-accent text-primary-foreground px-2 py-0.5 rounded-full font-medium">
              {items.length}
            </span>
          )}
        </div>
        {items.length > 0 && (
          <button onClick={clear} className="text-bill-muted hover:text-bill-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Last order */}
      {lastOrderNumber && (
        <div className="px-4 py-2 border-b border-bill-border">
          <p className="text-xs text-bill-muted">Last order: <span className="text-bill-accent font-mono">#{lastOrderNumber}</span></p>
        </div>
      )}

      {/* Items */}
      <div className="flex-1 overflow-auto px-4 py-3 space-y-2" ref={billItemsRef}>
        {items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-bill-muted text-sm">No items added</p>
            <p className="text-bill-muted text-xs mt-1">Click items to add them</p>
          </div>
        ) : (
          items.map((item, index) => (
            <div
              key={item.item_variant_id}
              className={cn(
                'rounded-lg bg-bill-border/50 p-3 animate-scale-in transition-all',
                focused && focusedBillIndex === index && 'ring-2 ring-primary/60 bg-bill-border/80'
              )}
              data-bill-item-index={index}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-tight">{item.item_name}</p>
                  {item.variant_label !== 'Default' && (
                    <p className="text-xs text-bill-muted">{item.variant_label}</p>
                  )}
                  <p className="text-xs text-bill-muted mt-0.5">Rs {item.unit_price}</p>
                </div>
                <button
                  onClick={() => removeItem(item.item_variant_id)}
                  className="text-bill-muted hover:text-destructive transition-colors ml-2 mt-0.5"
                  tabIndex={-1}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.item_variant_id, item.quantity - 1)}
                    className="w-7 h-7 rounded-md bg-bill-border flex items-center justify-center hover:bg-bill-muted/30 transition-colors"
                    tabIndex={-1}
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-sm font-mono w-6 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.item_variant_id, item.quantity + 1)}
                    className="w-7 h-7 rounded-md bg-bill-border flex items-center justify-center hover:bg-bill-muted/30 transition-colors"
                    tabIndex={-1}
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <span className="text-sm font-semibold">Rs {item.unit_price * item.quantity}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Note + Total + Actions */}
      <div className="border-t border-bill-border">
        <div className="px-4 py-2">
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note..."
            className="bg-bill-border/50 border-bill-border text-bill-foreground placeholder:text-bill-muted text-sm h-9"
            tabIndex={-1}
          />
        </div>

        <div className="px-4 py-3 flex items-center justify-between border-t border-bill-border">
          <span className="text-sm text-bill-muted">Total</span>
          <span className="text-xl font-bold text-bill-accent">Rs {totalAmount}</span>
        </div>

        <div className="px-4 pb-4 space-y-2">
          <Button
            className="w-full"
            disabled={items.length === 0 || confirming}
            onClick={handleConfirmOrder}
            data-confirm-order
            tabIndex={-1}
          >
            {confirming && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Confirm Order
          </Button>
          <Button
            variant="outline"
            className="w-full border-bill-border text-bill-foreground hover:bg-bill-border/50 bg-bill-border/30"
            disabled={!lastOrder}
            onClick={handleReprint}
            data-reprint
            tabIndex={-1}
          >
            <Printer className="w-4 h-4 mr-2" />
            Reprint Last Receipt
          </Button>
        </div>
      </div>

      {/* Hidden receipt for printing — only rendered when actively printing */}
      {showReceipt && receiptData && (
        <Receipt
          ref={receiptRef}
          restaurant={restaurant}
          orderNumber={receiptData.orderNumber}
          items={receiptData.items}
          total={receiptData.total}
          note={receiptData.note}
          dateTime={receiptData.dateTime}
        />
      )}
    </div>
  );
}
