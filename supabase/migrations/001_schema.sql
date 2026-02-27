-- ============================================================
-- RestoPOS Database Schema
-- Migration 001: Core tables, enums, and relationships
--
-- PK strategy: int4 GENERATED ALWAYS AS IDENTITY on all tables
-- EXCEPT users which uses UUID to map to auth.users.id
-- ============================================================

-- Enums
CREATE TYPE user_role AS ENUM ('admin', 'operator');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'cancelled');

-- ============================================================
-- restaurants
-- ============================================================
CREATE TABLE restaurants (
  id              int PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name            text NOT NULL,
  logo_url        text,
  phone           text,
  address         text,
  receipt_header  text,
  receipt_footer  text,
  created_by      uuid,  -- FK added after users table exists
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- users  (UUID PK — maps 1:1 to auth.users.id)
-- ============================================================
CREATE TABLE users (
  id              uuid PRIMARY KEY,  -- maps to auth.users.id
  email           text UNIQUE NOT NULL,
  full_name       text NOT NULL,
  role            user_role NOT NULL,
  restaurant_id   int REFERENCES restaurants(id) ON DELETE SET NULL,
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Now add FK from restaurants.created_by → users.id
ALTER TABLE restaurants
  ADD CONSTRAINT fk_restaurants_created_by
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- ============================================================
-- items
-- ============================================================
CREATE TABLE items (
  id              int PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  restaurant_id   int NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name            text NOT NULL,
  image_url       text,
  is_active       boolean NOT NULL DEFAULT true,
  sort_order      int NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  UNIQUE (restaurant_id, name)
);

-- ============================================================
-- item_variants
-- ============================================================
CREATE TABLE item_variants (
  id          int PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  item_id     int NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  label       text NOT NULL,
  price       numeric(10,2) NOT NULL,
  is_active   boolean NOT NULL DEFAULT true,
  sort_order  int NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),

  UNIQUE (item_id, label)
);

-- ============================================================
-- orders
-- ============================================================
CREATE TABLE orders (
  id              int PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  restaurant_id   int NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  operator_id     uuid NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  order_number    int NOT NULL,
  total_amount    numeric(10,2) NOT NULL DEFAULT 0,
  status          order_status NOT NULL DEFAULT 'pending',
  note            text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_orders_restaurant_date ON orders (restaurant_id, created_at DESC);

-- ============================================================
-- order_items
-- ============================================================
CREATE TABLE order_items (
  id                int PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  order_id          int NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_variant_id   int REFERENCES item_variants(id) ON DELETE SET NULL,
  item_name         text NOT NULL,
  variant_label     text NOT NULL,
  quantity          int NOT NULL CHECK (quantity >= 1),
  unit_price        numeric(10,2) NOT NULL,
  subtotal          numeric(10,2) NOT NULL
);

CREATE INDEX idx_order_items_order ON order_items (order_id);

-- ============================================================
-- Helper function: get_next_order_number
-- Returns next sequential order number per restaurant per day.
-- ============================================================
CREATE OR REPLACE FUNCTION get_next_order_number(p_restaurant_id int)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_num int;
BEGIN
  SELECT COALESCE(MAX(order_number), 0) + 1
  INTO next_num
  FROM orders
  WHERE restaurant_id = p_restaurant_id
    AND created_at >= date_trunc('day', now())
    AND created_at < date_trunc('day', now()) + interval '1 day';

  RETURN next_num;
END;
$$;

-- ============================================================
-- updated_at trigger function
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply updated_at triggers
CREATE TRIGGER trg_restaurants_updated_at
  BEFORE UPDATE ON restaurants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_items_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_item_variants_updated_at
  BEFORE UPDATE ON item_variants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
