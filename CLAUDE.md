# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Restaurant POS (Point-of-Sale) system supporting dine-in and take-away orders. Two user roles: **Admin** (manages restaurants, users, menu, tables, waiters, analytics at `/admin/*`) and **Operator** (takes orders, prints receipts at `/pos/*`).

## Commands

```bash
npm run dev          # Start dev server at http://localhost:8080
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Vitest (single run)
npm run test:watch   # Vitest (watch mode)
```

## Tech Stack

- **React 18 + TypeScript + Vite** (SWC plugin) — frontend SPA
- **Tailwind CSS + shadcn/ui** (Radix primitives, `default` style, CSS variables for theming)
- **Supabase** — PostgreSQL backend, auth, realtime
- **Zustand** — client state (`authStore`, `billStore`)
- **React Query (@tanstack/react-query)** — server state / data fetching
- **React Router v6** — routing with `RoleGuard` for access control
- **React Hook Form + Zod** — form handling and validation
- **Recharts** — dashboard analytics charts
- **QZ Tray** — thermal receipt printing (ESC/POS)

## Architecture

### Path alias
`@/` maps to `./src/` (configured in tsconfig.json and vite.config.ts).

### Routing & Auth
- `App.tsx` defines all routes. Every route is wrapped in `<RoleGuard allowedRoles={[...]}>` which checks the auth store.
- `AuthProvider` (`src/components/AuthProvider.tsx`) listens to Supabase auth state and populates `useAuthStore`.
- Admin routes use `<AdminLayout>`, POS routes use `<PosLayout>` — both provide sidebar navigation.

### State Management
- **`authStore`** (Zustand): holds `UserProfile | null` and loading state. Set by `AuthProvider`.
- **`billStore`** (Zustand): manages the current order cart — items, note, order type (`take_away` | `dine_in`), selected table/waiter, and last completed order. `clear()` resets to take-away defaults.

### Supabase Integration
- Client initialized in `src/integrations/supabase/client.ts` using `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` env vars.
- Generated DB types in `src/integrations/supabase/types.ts`.
- App-level types in `src/types/database.ts` — these are the primary types used throughout components.

### Database Schema (key relations)
```
restaurants → users (role, restaurant_id)
restaurants → items → item_variants (label, price)
restaurants → orders → order_items
restaurants → tables
restaurants → waiters
dine_ins (order_id → orders, table_id → tables, waiter_id → waiters)
```

### POS Components (`src/components/pos/`)
- `BillPanel` — live bill/cart sidebar with quantity controls
- `ItemCard` — menu item display with tap-to-add
- `VariantPicker` — variant selection dialog for multi-variant items
- `Receipt` — receipt layout for both thermal and browser printing

### Printing
Controlled by `VITE_PRINT_MODE` env var: `thermal` (QZ Tray ESC/POS) or `browser` (window.print).

## TypeScript Config Notes
- `strictNullChecks: false` and `noImplicitAny: false` — the codebase does not enforce strict null checking
- `allowJs: true` is enabled

## Testing
- Vitest with jsdom environment
- Setup file at `src/test/setup.ts`
- Test files: `src/**/*.{test,spec}.{ts,tsx}`

## Adding shadcn/ui Components
Use `npx shadcn-ui@latest add <component>`. Components go to `src/components/ui/`. Config in `components.json`.
