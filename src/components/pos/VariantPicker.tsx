import { useState, useEffect, useCallback } from 'react';
import { ItemWithVariants, ItemVariant } from '@/types/database';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface VariantPickerProps {
  item: ItemWithVariants;
  onSelect: (variant: ItemVariant) => void;
  onClose: () => void;
}

export function VariantPicker({ item, onSelect, onClose }: VariantPickerProps) {
  const activeVariants = item.variants.filter(v => v.is_active);
  const [focusedIndex, setFocusedIndex] = useState(0);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      e.stopPropagation();
      setFocusedIndex((prev) => Math.min(prev + 1, activeVariants.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();
      setFocusedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      if (focusedIndex >= 0 && focusedIndex < activeVariants.length) {
        onSelect(activeVariants[focusedIndex]);
      }
    } else if (e.key === 'q' || e.key === 'Q') {
      e.preventDefault();
      e.stopPropagation();
      onClose();
    }
  }, [focusedIndex, activeVariants, onSelect, onClose]);

  useEffect(() => {
    // Use capture phase to intercept before the main POS handler
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [handleKeyDown]);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{item.name}</DialogTitle>
          <p className="text-sm text-muted-foreground">Select a variant <span className="text-xs">(↑↓ Enter, Q to close)</span></p>
        </DialogHeader>
        <div className="space-y-2 mt-2">
          {activeVariants.map((variant, index) => (
            <button
              key={variant.id}
              onClick={() => onSelect(variant)}
              className={cn(
                'w-full flex items-center justify-between p-3 rounded-lg border transition-colors text-left',
                index === focusedIndex
                  ? 'border-primary bg-primary/10 ring-2 ring-primary/50'
                  : 'hover:border-primary hover:bg-primary/5'
              )}
            >
              <span className="font-medium text-sm">{variant.label}</span>
              <span className="font-semibold text-primary">Rs {variant.price}</span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
