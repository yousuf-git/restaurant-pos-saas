import { ItemWithVariants } from '@/types/database';
import { UtensilsCrossed } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ItemCardProps {
  item: ItemWithVariants;
  onClick: () => void;
  focused?: boolean;
}

export function ItemCard({ item, onClick, focused }: ItemCardProps) {
  const activeVariants = item.variants.filter(v => v.is_active);
  const priceDisplay = activeVariants.length === 1
    ? `Rs ${activeVariants[0].price}`
    : activeVariants.length > 0
      ? `Rs ${Math.min(...activeVariants.map(v => v.price))} - ${Math.max(...activeVariants.map(v => v.price))}`
      : 'N/A';

  return (
    <button
      onClick={onClick}
      className={cn(
        'group flex flex-col items-center rounded-xl border bg-card p-3 text-center transition-all hover:border-primary hover:shadow-md hover:shadow-primary/5 active:scale-[0.97]',
        focused && 'border-primary ring-2 ring-primary/50 shadow-md shadow-primary/10'
      )}
    >
      {/* Image placeholder */}
      <div className="w-full aspect-square rounded-lg bg-muted flex items-center justify-center mb-2 overflow-hidden">
        {item.image_url ? (
          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <UtensilsCrossed className="w-8 h-8 text-muted-foreground/40" />
        )}
      </div>

      <span className="text-sm font-semibold leading-tight line-clamp-2 mb-1">{item.name}</span>
      <span className="text-xs text-primary font-medium">{priceDisplay}</span>
    </button>
  );
}
