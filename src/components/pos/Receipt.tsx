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

// ─── QZ-Tray Thermal Printing (ESC/POS) ──────────────────────────────
import qz from "qz-tray";

const RECEIPT_LINE_WIDTH = 48; // 80mm thermal printer, Font A

const ESC = "\x1B";
const GS = "\x1D";

const CMD = {
  INIT: ESC + "\x40",                // Initialize printer
  CENTER: ESC + "\x61\x01",           // Center align
  LEFT: ESC + "\x61\x00",             // Left align
  BOLD_ON: ESC + "\x45\x01",          // Bold ON
  BOLD_OFF: ESC + "\x45\x00",         // Bold OFF
  DOUBLE_SIZE: GS + "\x21\x11",       // Double width + height
  DOUBLE_HEIGHT: GS + "\x21\x01",     // Double height only
  NORMAL_SIZE: GS + "\x21\x00",       // Normal size
  FEED_AND_CUT: GS + "\x56\x42\x03", // GS V 66 3 — feed 3 lines then partial cut (complete 4-byte command)
  FULL_CUT: GS + "\x56\x00",          // GS V 0 — full cut immediately (complete 2-byte command)
} as const;

function leftRight(left: string, right: string, width = RECEIPT_LINE_WIDTH): string {
  const gap = Math.max(1, width - left.length - right.length);
  return left + " ".repeat(gap) + right;
}

function dashedLine(width = RECEIPT_LINE_WIDTH): string {
  return "-".repeat(width);
}

/**
 * Convert a raw ESC/POS string (chars 0x00-0xFF) into a base64-encoded string.
 * Sending as base64 via `{ type:'raw', format:'base64' }` ensures QZ Tray
 * writes the exact bytes to the printer with no UTF-8 encoding mangling,
 * and in a single atomic write — preventing buffer overflow / truncation.
 */
function toBase64(raw: string): string {
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    bytes[i] = raw.charCodeAt(i) & 0xFF;
  }
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Build ESC/POS raw commands from receipt data and send to a thermal printer
 * via QZ Tray.  Requires the QZ Tray desktop app to be running.
 *
 * All text + ESC/POS commands are encoded as base64 and sent in a single
 * `qz.print()` call. This ensures exact byte delivery with no encoding
 * issues, no buffer overflow, and no artificial delays.
 *
 * @param props   Same data the visual <Receipt /> component uses.
 * @param printerName  Printer search string passed to `qz.printers.find()`.
 */
export async function printReceiptWithQzTray(
  props: ReceiptProps,
  printerName = "thermal"
) {
  const { restaurant, orderNumber, items, total, note, dateTime } = props;

  // Single array for one qz.print() call — no delays needed.
  // Logo image is a separate element (QZ processes it specially),
  // everything else is one base64-encoded binary blob.
  const printData: unknown[] = [];

  // ── Logo (if available) ────────────────────────────────────────────
  // Init + center must be sent before the image element
  printData.push({
    type: "raw",
    format: "base64",
    data: toBase64(CMD.INIT + CMD.CENTER),
  });

  if (restaurant?.logo_url) {
    printData.push({
      type: "raw",
      format: "image",
      data: restaurant.logo_url,
      options: { language: "ESCPOS", dotDensity: "double" },
    });
  }

  // ── Build the entire receipt as one raw string ─────────────────────
  let raw = "";

  // Re-assert center (image printing may reset state)
  raw += CMD.CENTER;

  // Restaurant name — bold, double size
  raw += CMD.BOLD_ON + CMD.DOUBLE_SIZE;
  raw += (restaurant?.name || "Restaurant") + "\n";
  raw += CMD.NORMAL_SIZE + CMD.BOLD_OFF;

  if (restaurant?.address) {
    raw += restaurant.address + "\n";
  }
  if (restaurant?.phone) {
    raw += "Tel: " + restaurant.phone + "\n";
  }
  if (restaurant?.receipt_header) {
    raw += restaurant.receipt_header + "\n";
  }

  // ── Left-aligned body ──────────────────────────────────────────────
  raw += CMD.LEFT;
  raw += dashedLine() + "\n";

  raw += leftRight(`Order #${orderNumber}`, dateTime.toLocaleDateString()) + "\n";
  raw += leftRight("", dateTime.toLocaleTimeString()) + "\n";
  raw += dashedLine() + "\n";

  // Column widths: Item(26) Qty(5) Price(8) Total(9) = 48
  const colQty = 5;
  const colPrice = 8;
  const colTotal = 9;
  const colItem = RECEIPT_LINE_WIDTH - colQty - colPrice - colTotal;

  raw += CMD.BOLD_ON;
  raw += "Item".padEnd(colItem)
    + "Qty".padStart(colQty)
    + "Price".padStart(colPrice)
    + "Total".padStart(colTotal)
    + "\n";
  raw += CMD.BOLD_OFF;

  for (const item of items) {
    const name =
      item.item_name +
      (item.variant_label !== "Default" ? ` (${item.variant_label})` : "");
    const qty = String(item.quantity).padStart(colQty);
    const price = String(item.unit_price).padStart(colPrice);
    const subtotal = String(item.unit_price * item.quantity).padStart(colTotal);

    if (name.length > colItem) {
      raw += name + "\n";
      raw += " ".repeat(colItem) + qty + price + subtotal + "\n";
    } else {
      raw += name.padEnd(colItem) + qty + price + subtotal + "\n";
    }
  }

  raw += dashedLine() + "\n";

  // Total — bold, double height
  raw += CMD.BOLD_ON + CMD.DOUBLE_HEIGHT;
  raw += leftRight("TOTAL", `Rs ${total}`) + "\n";
  raw += CMD.NORMAL_SIZE + CMD.BOLD_OFF;

  if (note) {
    raw += "\n" + "Note: " + note + "\n";
  }

  raw += dashedLine() + "\n";

  // ── Center-aligned footer ──────────────────────────────────────────
  raw += CMD.CENTER;

  if (restaurant?.receipt_footer) {
    raw += restaurant.receipt_footer + "\n";
  } else {
    raw += "Thank you for your visit!\n";
  }

  raw += dashedLine() + "\n";
  raw += "Developed by M. Yousuf\n";
  raw += "https://yousuf-dev.com\n";

  // Feed paper + cut
  raw += "\n\n\n";
  raw += CMD.FEED_AND_CUT;

  // Encode entire receipt body as one base64 blob
  printData.push({
    type: "raw",
    format: "base64",
    data: toBase64(raw),
  });

  // ── Send everything in one print call ──────────────────────────────
  if (!qz.websocket.isActive()) {
    await qz.websocket.connect();
  }

  const printer = await qz.printers.find(printerName);
  const config = qz.configs.create(printer);
  await qz.print(config, printData as Parameters<typeof qz.print>[1]);

  await qz.websocket.disconnect();
}
