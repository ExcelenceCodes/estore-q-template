-- Fix missing columns and tables for image uploads and category assignments

-- Products: add primary image_url column used by shop listings and ProductCard
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url text;

-- Shipping methods: add estimated_days referenced in admin and checkout
ALTER TABLE public.shipping_methods ADD COLUMN IF NOT EXISTS estimated_days integer NOT NULL DEFAULT 3;

-- Many-to-many relationship between products and categories
CREATE TABLE IF NOT EXISTS public.product_category_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.product_categories(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_product_category UNIQUE (product_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_product_category_assignments_product ON public.product_category_assignments(product_id);
CREATE INDEX IF NOT EXISTS idx_product_category_assignments_category ON public.product_category_assignments(category_id);

GRANT ALL ON public.product_category_assignments TO service_role;
ALTER TABLE public.product_category_assignments ENABLE ROW LEVEL SECURITY;
