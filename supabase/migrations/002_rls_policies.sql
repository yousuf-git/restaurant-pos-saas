-- ============================================================
-- Row Level Security (RLS) Policies
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Helper: get current user's role from public.users
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

-- Helper: get current user's restaurant_id (returns int)
CREATE OR REPLACE FUNCTION public.get_my_restaurant_id()
RETURNS int
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT restaurant_id FROM public.users WHERE id = auth.uid();
$$;

-- ============================================================
-- restaurants
-- ============================================================

-- Admin: full access
CREATE POLICY "admin_all_restaurants" ON restaurants
  FOR ALL
  TO authenticated
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- Operator: read own restaurant only
CREATE POLICY "operator_read_own_restaurant" ON restaurants
  FOR SELECT
  TO authenticated
  USING (
    public.get_my_role() = 'operator'
    AND id = public.get_my_restaurant_id()
  );

-- ============================================================
-- users
-- ============================================================

-- Admin: full access
CREATE POLICY "admin_all_users" ON users
  FOR ALL
  TO authenticated
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- Operator: read own profile
CREATE POLICY "operator_read_own_profile" ON users
  FOR SELECT
  TO authenticated
  USING (
    public.get_my_role() = 'operator'
    AND id = auth.uid()
  );

-- ============================================================
-- items
-- ============================================================

-- Admin: full access
CREATE POLICY "admin_all_items" ON items
  FOR ALL
  TO authenticated
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- Operator: read items for own restaurant
CREATE POLICY "operator_read_items" ON items
  FOR SELECT
  TO authenticated
  USING (
    public.get_my_role() = 'operator'
    AND restaurant_id = public.get_my_restaurant_id()
  );

-- ============================================================
-- item_variants
-- ============================================================

-- Admin: full access
CREATE POLICY "admin_all_variants" ON item_variants
  FOR ALL
  TO authenticated
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- Operator: read variants for own restaurant's items
CREATE POLICY "operator_read_variants" ON item_variants
  FOR SELECT
  TO authenticated
  USING (
    public.get_my_role() = 'operator'
    AND item_id IN (
      SELECT id FROM items WHERE restaurant_id = public.get_my_restaurant_id()
    )
  );

-- Operator: update variant price for own restaurant's items
CREATE POLICY "operator_update_variant_price" ON item_variants
  FOR UPDATE
  TO authenticated
  USING (
    public.get_my_role() = 'operator'
    AND item_id IN (
      SELECT id FROM items WHERE restaurant_id = public.get_my_restaurant_id()
    )
  )
  WITH CHECK (
    public.get_my_role() = 'operator'
    AND item_id IN (
      SELECT id FROM items WHERE restaurant_id = public.get_my_restaurant_id()
    )
  );

-- ============================================================
-- orders
-- ============================================================

-- Admin: full access
CREATE POLICY "admin_all_orders" ON orders
  FOR ALL
  TO authenticated
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- Operator: read/write orders for own restaurant
CREATE POLICY "operator_read_orders" ON orders
  FOR SELECT
  TO authenticated
  USING (
    public.get_my_role() = 'operator'
    AND restaurant_id = public.get_my_restaurant_id()
  );

CREATE POLICY "operator_insert_orders" ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_my_role() = 'operator'
    AND restaurant_id = public.get_my_restaurant_id()
    AND operator_id = auth.uid()
  );

CREATE POLICY "operator_update_orders" ON orders
  FOR UPDATE
  TO authenticated
  USING (
    public.get_my_role() = 'operator'
    AND restaurant_id = public.get_my_restaurant_id()
  )
  WITH CHECK (
    public.get_my_role() = 'operator'
    AND restaurant_id = public.get_my_restaurant_id()
  );

-- ============================================================
-- order_items
-- ============================================================

-- Admin: full access
CREATE POLICY "admin_all_order_items" ON order_items
  FOR ALL
  TO authenticated
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- Operator: read/insert order items for own restaurant's orders
CREATE POLICY "operator_read_order_items" ON order_items
  FOR SELECT
  TO authenticated
  USING (
    public.get_my_role() = 'operator'
    AND order_id IN (
      SELECT id FROM orders WHERE restaurant_id = public.get_my_restaurant_id()
    )
  );

CREATE POLICY "operator_insert_order_items" ON order_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_my_role() = 'operator'
    AND order_id IN (
      SELECT id FROM orders WHERE restaurant_id = public.get_my_restaurant_id()
    )
  );
