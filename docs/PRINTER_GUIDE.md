# Thermal Printer Guide (QZ Tray + ESC/POS)

## Overview

This POS uses **QZ Tray** to send raw ESC/POS commands directly to a USB/serial thermal printer from the browser. The implementation lives in [`src/components/pos/Receipt.tsx`](../src/components/pos/Receipt.tsx) — the `printReceiptWithQzTray()` function.

---

## Prerequisites

### 1. QZ Tray Desktop App
QZ Tray must be installed and **running** on the machine before printing. It acts as a bridge between the browser and the printer port.

- Download: https://qz.io/download/
- The app runs silently in the system tray. Start it before opening the POS.

### 2. npm Package
```bash
npm install qz-tray
```

### 3. Printer Name
The default printer search string is `"thermal"`. QZ Tray uses `qz.printers.find("thermal")` which finds the first printer whose name contains "thermal" (case-insensitive). Change this in the call site inside `BillPanel.tsx` if your printer has a different name:

```ts
await printReceiptWithQzTray(props, "YourPrinterName");
```

---

## How It Works

### Data Flow

```
Browser (React)
    │
    ▼
printReceiptWithQzTray()   ← builds ESC/POS byte stream
    │
    ▼
qz.print()                 ← sends via WebSocket to QZ Tray desktop app
    │
    ▼
QZ Tray (system tray)      ← writes raw bytes to printer port
    │
    ▼
Thermal Printer (USB/Serial)
```

### Print Data Structure

The data array passed to `qz.print()` has up to 3 elements:

| # | Content | Format |
|---|---------|--------|
| 1 | `ESC @` (init) + `ESC a 1` (center align) | `base64` |
| 2 | Logo image URL *(optional, only if restaurant has a logo)* | `image` |
| 3 | Entire receipt body: header → items → total → footer → feed → cut | `base64` |

---

## Why Base64?

Plain JS strings containing ESC/POS control characters (`\x1B`, `\x1D`, etc.) get mangled by QZ Tray's text pipeline (UTF-8 re-encoding). Using `{ type: 'raw', format: 'base64' }` forces QZ Tray to write the **exact bytes** to the printer port with no interpretation.

```ts
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
```

---

## Receipt Layout

```
┌────────────────────────────────────────────────┐
│               [Logo image, if any]             │  center
│               Restaurant Name                  │  center, bold, 2× size
│               Address                          │  center
│               Tel: Phone                       │  center
│               Receipt Header (custom)          │  center
├────────────────────────────────────────────────┤
│  Order #123                       28/02/2026   │  left
│                                    10:30:00    │  right-aligned time
├────────────────────────────────────────────────┤
│  Item                        Qty   Price  Total│  bold header
│  Item Name                     1     200    200│
│  Long Item Name                               │  wraps to own line
│                                1     300    300│
├────────────────────────────────────────────────┤
│  TOTAL                              Rs 500     │  bold, 2× height
│                                                │
│  Note: customer note (if any)                  │
├────────────────────────────────────────────────┤
│             Thank you for your visit!          │  center (or custom footer)
│  ──────────────────────────────────────────── │
│               Developed by M. Yousuf          │  center
│               https://yousuf-dev.com          │  center
│                                                │
│              [3 line feeds + paper cut]        │
└────────────────────────────────────────────────┘
```

**Column widths** (80mm paper, Font A, 48 chars/line):

| Column | Width |
|--------|-------|
| Item name | 26 chars |
| Qty | 5 chars |
| Unit Price | 8 chars |
| Total | 9 chars |

---

## ESC/POS Command Reference

All commands used in this implementation:

| Constant | Bytes (hex) | Description |
|----------|-------------|-------------|
| `INIT` | `1B 40` | Initialize / reset printer |
| `CENTER` | `1B 61 01` | Center text alignment |
| `LEFT` | `1B 61 00` | Left text alignment |
| `BOLD_ON` | `1B 45 01` | Bold text ON |
| `BOLD_OFF` | `1B 45 00` | Bold text OFF |
| `DOUBLE_SIZE` | `1D 21 11` | Double width + height |
| `DOUBLE_HEIGHT` | `1D 21 01` | Double height only |
| `NORMAL_SIZE` | `1D 21 00` | Normal font size |
| `FEED_AND_CUT` | `1D 56 42 03` | Feed 3 lines then partial cut |
| `FULL_CUT` | `1D 56 00` | Full cut immediately |

---

## Critical: The Cut Command Bug

### ❌ Wrong — `GS V 41` (3-byte, missing parameter)
```
1D 56 41
```
`GS V 65` is the **3-byte + 1 parameter** variant of `GS V`. The printer waits for a 4th byte (lines to feed) that never arrives. The ESC/POS parser **stalls** — everything after TOTAL sits in the printer's internal buffer, unprinted.

**Symptom:** Receipt prints up to TOTAL. On the *next* print job, the footer from the previous receipt prints first, then the new receipt is also incomplete.

### ✅ Correct — `GS V 42 03` (complete 4-byte command)
```
1D 56 42 03
```
`GS V 66 n` — feed `n` lines (3 in our case) then partial cut. This is a **complete, self-contained 4-byte command** that the parser fully consumes, prints, and cuts immediately.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| "Failed to print receipt. Is QZ Tray running?" | QZ Tray desktop app not started | Launch QZ Tray from system tray / applications |
| Receipt prints but no cut | Wrong cut command bytes | Ensure `FEED_AND_CUT = \x1D\x56\x42\x03` (4 bytes) |
| Footer of previous receipt prints before new one | Stalled parser from bad cut command | Same as above |
| Garbled characters / wrong symbols | UTF-8 mangling of ESC/POS bytes | Ensure all commands go through `toBase64()` with `format: 'base64'` |
| Logo not printing | `logo_url` is not a publicly accessible URL | Check the URL is reachable from the machine running QZ Tray |
| Printer not found | Printer name mismatch | Check exact printer name in OS settings, pass it to `printReceiptWithQzTray(props, "ExactName")` |
| Text misaligned / columns wrong | Different paper width | Adjust `RECEIPT_LINE_WIDTH` constant (default: `48` for 80mm paper) |

---

## Changing the Printer

In [`src/components/pos/BillPanel.tsx`](../src/components/pos/BillPanel.tsx), the `triggerPrint` function calls:

```ts
await printReceiptWithQzTray({ restaurant, ...orderData });
```

To target a specific printer, pass its name as the second argument:

```ts
await printReceiptWithQzTray({ restaurant, ...orderData }, "EPSON TM-T88V");
```

To find your printer's exact name, check:
- **Linux:** `lpstat -p` or `system-config-printer`
- **Windows:** Settings → Printers & Scanners
- **macOS:** System Settings → Printers & Scanners
