-- Ecommerce migration for estore-q-template
-- Compatible with PostgreSQL and Supabase

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- CUSTOMERS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  name text NOT NULL,
  phone text,
  email_verified boolean NOT NULL DEFAULT false,
  phone_verified boolean NOT NULL DEFAULT false,
  default_shipping_address jsonb,
  default_billing_address jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customer_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('email','phone')),
  value text NOT NULL,
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.address_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  address_type text NOT NULL CHECK (address_type IN ('shipping','billing')),
  address_json jsonb NOT NULL,
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- CATALOG
-- ============================================================

CREATE TABLE IF NOT EXISTS public.brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  logo_id uuid REFERENCES public.media(id) ON DELETE SET NULL,
  description text,
  website text,
  active boolean NOT NULL DEFAULT true,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES public.product_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  image_id uuid REFERENCES public.media(id) ON DELETE SET NULL,
  order_index integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  sku text,
  brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL,
  description text NOT NULL DEFAULT '',
  price numeric(10,2) NOT NULL,
  compare_at_price numeric(10,2),
  cost numeric(10,2),
  weight numeric,
  dimensions jsonb,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  featured boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  media_id uuid REFERENCES public.media(id) ON DELETE SET NULL,
  image_url text,
  alt_text text NOT NULL DEFAULT '',
  order_index integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_product_images_order_index CHECK (order_index BETWEEN 1 AND 5),
  CONSTRAINT uq_product_images_product_order UNIQUE (product_id, order_index)
);

CREATE TABLE IF NOT EXISTS public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  sku text,
  price numeric(10,2),
  inventory_quantity integer NOT NULL DEFAULT 0,
  weight numeric,
  dimensions jsonb,
  options jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.product_spec_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('text','textarea','number','select','multiselect','date','boolean')),
  options jsonb,
  unit text,
  active boolean NOT NULL DEFAULT true,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.product_spec_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  spec_definition_id uuid NOT NULL REFERENCES public.product_spec_definitions(id) ON DELETE CASCADE,
  value_text text,
  value_number numeric,
  value_date timestamptz,
  value_boolean boolean,
  value_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_product_spec_product_def UNIQUE (product_id, spec_definition_id)
);

-- ============================================================
-- ENGAGEMENT
-- ============================================================

CREATE TABLE IF NOT EXISTS public.product_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE,
  session_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_product_likes_owner CHECK (
    (customer_id IS NOT NULL AND session_id IS NULL) OR
    (customer_id IS NULL AND session_id IS NOT NULL)
  )
);

CREATE TABLE IF NOT EXISTS public.product_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- CART
-- ============================================================

CREATE TABLE IF NOT EXISTS public.carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text,
  customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_cart_owner CHECK (
    (customer_id IS NOT NULL AND session_id IS NULL) OR
    (customer_id IS NULL AND session_id IS NOT NULL)
  )
);

CREATE TABLE IF NOT EXISTS public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id uuid NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric(10,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_cart_items_cart_product_variant UNIQUE (cart_id, product_id, variant_id)
);

-- ============================================================
-- SHIPPING + ORDERS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.shipping_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL,
  free_threshold numeric(10,2),
  active boolean NOT NULL DEFAULT true,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  guest_email text,
  guest_name text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','shipped','delivered','cancelled')),
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','failed','refunded')),
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  tax numeric(10,2) NOT NULL DEFAULT 0,
  shipping numeric(10,2) NOT NULL DEFAULT 0,
  discount numeric(10,2) NOT NULL DEFAULT 0,
  total numeric(10,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  shipping_method_id uuid REFERENCES public.shipping_methods(id) ON DELETE SET NULL,
  tracking_number text,
  tracking_url text,
  carrier text,
  shipping_address jsonb NOT NULL,
  billing_address jsonb NOT NULL,
  notes text,
  placed_at timestamptz NOT NULL DEFAULT now(),
  fulfilled_at timestamptz,
  cancelled_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
  title text NOT NULL,
  sku text,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric(10,2) NOT NULL,
  total numeric(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status text NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- MARKETING
-- ============================================================

CREATE TABLE IF NOT EXISTS public.promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  image_id uuid REFERENCES public.media(id) ON DELETE SET NULL,
  link_url text NOT NULL DEFAULT '',
  link_label text NOT NULL DEFAULT 'Shop Now',
  active boolean NOT NULL DEFAULT true,
  starts_at timestamptz,
  ends_at timestamptz,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  type text NOT NULL CHECK (type IN ('percentage','fixed')),
  value numeric(10,2) NOT NULL,
  min_purchase numeric(10,2),
  max_uses integer,
  used_count integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Catalog
CREATE INDEX IF NOT EXISTS idx_brands_slug ON public.brands(slug) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_brands_order ON public.brands(active, order_index) WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_categories_parent ON public.product_categories(parent_id, active, order_index) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.product_categories(slug) WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_products_status_published ON public.products(status, published_at DESC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(featured, status) WHERE featured = true AND status = 'published';
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products(brand_id, status) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);

CREATE INDEX IF NOT EXISTS idx_product_images_product_order ON public.product_images(product_id, order_index);
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_spec_values_product ON public.product_spec_values(product_id);
CREATE INDEX IF NOT EXISTS idx_product_spec_values_def_number ON public.product_spec_values(spec_definition_id) WHERE value_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_product_spec_values_def_text ON public.product_spec_values(spec_definition_id) WHERE value_text IS NOT NULL;

-- Engagement
CREATE INDEX IF NOT EXISTS idx_product_likes_product ON public.product_likes(product_id);
CREATE INDEX IF NOT EXISTS uq_product_likes_customer ON public.product_likes(product_id) WHERE customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS uq_product_likes_session ON public.product_likes(product_id) WHERE session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_product_views_product_time ON public.product_views(product_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_views_session ON public.product_views(session_id);

-- Cart
CREATE INDEX IF NOT EXISTS idx_carts_session ON public.carts(session_id);
CREATE INDEX IF NOT EXISTS idx_carts_customer ON public.carts(customer_id) WHERE customer_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_carts_customer ON public.carts(customer_id) WHERE customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON public.cart_items(cart_id);

-- Orders
CREATE INDEX IF NOT EXISTS idx_orders_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_customer_placed ON public.orders(customer_id, placed_at DESC) WHERE customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status, placed_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_time ON public.order_status_history(order_id, created_at);

-- Marketing
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);
CREATE INDEX IF NOT EXISTS idx_promotions_active_order ON public.promotions(active, order_index) WHERE active = true;

-- Verifications
CREATE INDEX IF NOT EXISTS idx_customer_verifications_customer ON public.customer_verifications(customer_id);
CREATE INDEX IF NOT EXISTS idx_address_verifications_customer ON public.address_verifications(customer_id);

-- ============================================================
-- RLS + GRANTS
-- ============================================================

GRANT ALL ON public.customers, public.customer_verifications, public.address_verifications,
  public.brands, public.product_categories, public.products, public.product_images,
  public.product_variants, public.product_spec_definitions, public.product_spec_values,
  public.product_likes, public.product_views, public.carts, public.cart_items,
  public.shipping_methods, public.orders, public.order_items, public.order_status_history,
  public.promotions, public.coupons
  TO service_role;

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.address_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_spec_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_spec_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- SEED: basic settings, categories, shipping methods
-- ============================================================

INSERT INTO public.shipping_methods (name, description, price, free_threshold, active, order_index)
VALUES
  ('Standard Delivery', 'Delivered within 3-5 business days', 9.99, 100.00, true, 1),
  ('Express Delivery', 'Delivered within 1-2 business days', 19.99, null, true, 2),
  ('Same Day Delivery', 'Order by noon for same-day delivery', 29.99, null, true, 3),
  ('Free Pickup', 'Pick up from our store', 0.00, 0.00, true, 4)
ON CONFLICT DO NOTHING;
