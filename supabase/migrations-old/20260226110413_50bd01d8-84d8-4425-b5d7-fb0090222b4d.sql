
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'operator');

-- Create order status enum
CREATE TYPE public.order_status AS ENUM ('pending', 'confirmed', 'cancelled');

-- Updated at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Restaurants table
CREATE TABLE public.restaurants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  phone TEXT,
  address TEXT,
  receipt_header TEXT,
  receipt_footer TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_restaurants_updated_at
  BEFORE UPDATE ON public.restaurants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Users table (profiles)
CREATE TABLE public.users (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- User roles table (separate from users for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Get user role function
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Items table
CREATE TABLE public.items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (restaurant_id, name)
);

ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_items_updated_at
  BEFORE UPDATE ON public.items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Item variants table
CREATE TABLE public.item_variants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'Default',
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (item_id, label)
);

ALTER TABLE public.item_variants ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_item_variants_updated_at
  BEFORE UPDATE ON public.item_variants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  operator_id UUID NOT NULL REFERENCES auth.users(id),
  order_number INT NOT NULL DEFAULT 0,
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  status order_status NOT NULL DEFAULT 'pending',
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Order items table
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  item_variant_id UUID REFERENCES public.item_variants(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL,
  variant_label TEXT NOT NULL DEFAULT 'Default',
  quantity INT NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES

-- Restaurants: admin full access, operators can read their own
CREATE POLICY "Admins full access restaurants"
  ON public.restaurants FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Operators read own restaurant"
  ON public.restaurants FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT restaurant_id FROM public.users WHERE id = auth.uid()
    )
  );

-- Users: admin full access, users read own
CREATE POLICY "Admins full access users"
  ON public.users FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users read own profile"
  ON public.users FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- User roles: admin full access, users read own
CREATE POLICY "Admins full access user_roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users read own role"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Items: admin full access, operators read their restaurant's items
CREATE POLICY "Admins full access items"
  ON public.items FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Operators read own restaurant items"
  ON public.items FOR SELECT
  TO authenticated
  USING (
    restaurant_id IN (
      SELECT restaurant_id FROM public.users WHERE id = auth.uid()
    )
  );

-- Item variants: admin full, operators read
CREATE POLICY "Admins full access item_variants"
  ON public.item_variants FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Operators read own restaurant variants"
  ON public.item_variants FOR SELECT
  TO authenticated
  USING (
    item_id IN (
      SELECT i.id FROM public.items i
      JOIN public.users u ON u.restaurant_id = i.restaurant_id
      WHERE u.id = auth.uid()
    )
  );

-- Orders: admin full, operators CRUD their restaurant's orders
CREATE POLICY "Admins full access orders"
  ON public.orders FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Operators manage own restaurant orders"
  ON public.orders FOR ALL
  TO authenticated
  USING (
    restaurant_id IN (
      SELECT restaurant_id FROM public.users WHERE id = auth.uid()
    )
  );

-- Order items: admin full, operators CRUD
CREATE POLICY "Admins full access order_items"
  ON public.order_items FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Operators manage own restaurant order_items"
  ON public.order_items FOR ALL
  TO authenticated
  USING (
    order_id IN (
      SELECT o.id FROM public.orders o
      JOIN public.users u ON u.restaurant_id = o.restaurant_id
      WHERE u.id = auth.uid()
    )
  );

-- Daily order number function
CREATE OR REPLACE FUNCTION public.get_next_order_number(_restaurant_id UUID)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_num INT;
BEGIN
  SELECT COALESCE(MAX(order_number), 0) + 1
  INTO next_num
  FROM public.orders
  WHERE restaurant_id = _restaurant_id
    AND created_at::date = CURRENT_DATE;
  RETURN next_num;
END;
$$;

-- Storage bucket for images
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true);

CREATE POLICY "Public read images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'images');

CREATE POLICY "Authenticated upload images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'images');

CREATE POLICY "Authenticated update images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'images');

CREATE POLICY "Authenticated delete images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'images');
