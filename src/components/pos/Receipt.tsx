import { forwardRef } from 'react';
import { BillItem, Restaurant } from '@/types/database';

interface ReceiptProps {
  restaurant: Restaurant | null;
  orderNumber: number;
  items: BillItem[];
  total: number;
  note?: string;
  dateTime: Date;
}

export const Receipt = forwardRef<HTMLDivElement, ReceiptProps>(
  ({ restaurant, orderNumber, items, total, note, dateTime }, ref) => {
    return (
      <div ref={ref} className="receipt-print">
        <div style={{ width: '80mm', fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', padding: '4mm' }}>
          {/* Logo */}
          {restaurant?.logo_url && (
            <div style={{ textAlign: 'center', marginBottom: '4px' }}>
              <img
                src={restaurant.logo_url}
                alt={restaurant.name}
                style={{ height: '40px', margin: '0 auto', display: 'block', objectFit: 'contain' }}
              />
            </div>
          )}

          {/* Restaurant Name */}
          <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '16px', marginBottom: '2px' }}>
            {restaurant?.name || 'Restaurant'}
          </div>

          {/* Address */}
          {restaurant?.address && (
            <div style={{ textAlign: 'center', fontSize: '10px', marginBottom: '2px' }}>
              {restaurant.address}
            </div>
          )}

          {/* Phone */}
          {restaurant?.phone && (
            <div style={{ textAlign: 'center', fontSize: '10px', marginBottom: '4px' }}>
              Tel: {restaurant.phone}
            </div>
          )}

          {/* Receipt Header */}
          {restaurant?.receipt_header && (
            <div style={{ textAlign: 'center', fontSize: '10px', marginBottom: '4px', whiteSpace: 'pre-wrap' }}>
              {restaurant.receipt_header}
            </div>
          )}

          {/* Separator */}
          <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />

          {/* Date/Time + Order Number */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '2px' }}>
            <span>Order #{orderNumber}</span>
            <span>{dateTime.toLocaleDateString()}</span>
          </div>
          <div style={{ fontSize: '10px', marginBottom: '4px', textAlign: 'right' }}>
            {dateTime.toLocaleTimeString()}
          </div>

          {/* Separator */}
          <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />

          {/* Column Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 'bold', marginBottom: '4px' }}>
            <span style={{ flex: 1 }}>Item</span>
            <span style={{ width: '30px', textAlign: 'center' }}>Qty</span>
            <span style={{ width: '50px', textAlign: 'right' }}>Unit Price</span>
            <span style={{ width: '60px', textAlign: 'right' }}>Total</span>
          </div>

          {/* Items */}
          {items.map((item, i) => (
            <div key={i} style={{ marginBottom: '3px' }}>
              <div style={{ display: 'flex', fontSize: '11px' }}>
                <span style={{ flex: 1, wordBreak: 'break-word' }}>
                  {item.item_name}
                  {item.variant_label !== 'Default' ? ` (${item.variant_label})` : ''}
                </span>
                <span style={{ width: '30px', textAlign: 'center', flexShrink: 0 }}>{item.quantity}</span>
                <span style={{ width: '50px', textAlign: 'right', flexShrink: 0 }}>{item.unit_price}</span>
                <span style={{ width: '60px', textAlign: 'right', flexShrink: 0 }}>{item.unit_price * item.quantity}</span>
              </div>
            </div>
          ))}

          {/* Separator */}
          <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />

          {/* Total */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>
            <span>TOTAL</span>
            <span>Rs {total}</span>
          </div>

          {/* Note */}
          {note && (
            <div style={{ fontSize: '10px', marginTop: '4px', fontStyle: 'italic' }}>
              Note: {note}
            </div>
          )}

          {/* Separator */}
          <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />

          {/* Receipt Footer */}
          {restaurant?.receipt_footer && (
            <div style={{ textAlign: 'center', fontSize: '10px', whiteSpace: 'pre-wrap' }}>
              {restaurant.receipt_footer}
            </div>
          )}

          {/* Default footer */}
          {!restaurant?.receipt_footer && (
            <div style={{ textAlign: 'center', fontSize: '10px' }}>
              Thank you for your visit!
            </div>
          )}

          {/* Separator */}
          <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />

          {/* Developer branding */}
          <div style={{ textAlign: 'center', fontSize: '8px', color: '#666' }}>
            <div>Developed by M. Yousuf</div>
            <a
              href="https://yousuf-dev.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'inherit', textDecoration: 'none' }}
            >
              <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              focusable="false"
              >
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              <div>https://yousuf-dev.com</div>
            </a>
          </div>
        </div>
      </div>
    );
  }
);

Receipt.displayName = 'Receipt';
