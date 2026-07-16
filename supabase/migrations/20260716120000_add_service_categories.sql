-- Service category taxonomy for admin-managed services
CREATE TABLE IF NOT EXISTS public.service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.service_categories TO anon, authenticated;
GRANT ALL ON public.service_categories TO service_role;
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view service categories" ON public.service_categories FOR SELECT USING (true);

ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS service_category_id UUID NULL REFERENCES public.service_categories(id) ON DELETE SET NULL;

GRANT SELECT ON public.services TO anon, authenticated;
GRANT ALL ON public.services TO service_role;
