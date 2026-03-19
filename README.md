<div align="center">

# 🍽️  Restaurant POS

### Modern Point-of-Sale System for Dine-In & Take-Away

[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

---

A streamlined, full-featured POS built for restaurants that handle both **dine-in** and **take-away** orders. Designed for speed, reliability, and a beautiful operator experience.

</div>

---

## Features

### Admin Panel
| Feature | Description |
|---------|-------------|
| **Dashboard Analytics** | Interactive charts - revenue trends, order breakdowns, top-selling items, per-restaurant stats |
| **Restaurant Management** | Add, edit, and manage multiple restaurant locations |
| **User Management** | Role-based access control (Admin / Operator) with restaurant assignment |
| **Menu Management** | Items with multiple variants and pricing, drag-to-sort ordering |
| **Table Management** | Configure dine-in tables per restaurant |
| **Waiter Management** | Track and assign waiters/staff |

### POS Operator Interface
| Feature | Description |
|---------|-------------|
| **Quick Order Entry** | Tap-to-add items with variant selection - built for speed |
| **Dine-In & Take-Away** | Toggle order type, assign tables and waiters for dine-in |
| **Bill Panel** | Live bill with quantity adjustments, notes, and instant total |
| **Thermal Printing** | Native ESC/POS thermal receipt printing via QZ Tray |
| **Browser Printing** | Fallback PDF receipt printing through the browser |
| **Order History** | Browse, search, and reprint past orders |
| **Item Statistics** | Sales analytics per item and variant |

---

## Tech Stack

```
Frontend        React 18 · TypeScript · Vite
Styling         Tailwind CSS · shadcn/ui (Radix primitives)
State           Zustand (global) · React Query (server)
Backend         Supabase (PostgreSQL + Auth + Realtime)
Charts          Recharts
Forms           React Hook Form + Zod validation
Printing        QZ Tray (thermal) · window.print (browser)
```

---

## Getting Started

### Prerequisites

- **Node.js** >= 18
- **npm** or **yarn**
- A [Supabase](https://supabase.com) project with the required schema

### Installation

```bash
# Clone the repository
git clone https://github.com/yousuf-git/restaurant-pos-saas.git
cd pos

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Supabase URL and anon key

# Start development server
npm run dev
```

The app will be available at `http://localhost:8080`.

### Build for Production

```bash
npm run build
npm run preview    # preview the production build
```

---

## Project Structure

```
src/
├── components/
│   ├── ui/              # shadcn/ui primitives (button, input, dialog…)
│   ├── layouts/         # AdminLayout & PosLayout (sidebar navigation)
│   └── pos/             # POS-specific components (BillPanel, Receipt…)
├── pages/
│   ├── admin/           # Dashboard, Restaurants, Users, Items, Tables, Waiters
│   └── pos/             # Orders, Menu, Summary, OrderHistory, ItemStats
├── hooks/               # useAuth and custom hooks
├── stores/              # Zustand stores (auth, bill/cart)
├── integrations/
│   └── supabase/        # Client init & generated TypeScript types
├── types/               # Shared type definitions
└── lib/                 # Utility helpers
```

---

## Roles & Access

| Role | Access | Default Route |
|------|--------|---------------|
| **Admin** | Full platform management - restaurants, users, menu, tables, waiters, analytics | `/admin/dashboard` |
| **Operator** | POS terminal - take orders, manage bills, print receipts | `/pos/orders` |

---

## Printing Modes

Configure via the `VITE_PRINT_MODE` environment variable:

| Mode | How it works |
|------|-------------|
| `thermal` | Sends ESC/POS commands to a connected thermal printer via **QZ Tray** |
| `browser` | Opens the browser print dialog with a formatted 80mm receipt layout |

---

## Database Schema

```
restaurants ─┬─ users (role, restaurant_id)
             ├─ items ── item_variants (label, price)
             ├─ orders ── order_items
             ├─ tables
             └─ waiters

dine_ins (order_id → orders, table_id → tables, waiter_id → waiters)
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Production build |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Vitest test suite |
| `npm run test:watch` | Run tests in watch mode |

---

<div align="center">

Built for the restaurant industry

</div>
