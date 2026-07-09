ALTER TABLE public.offers 
  ADD COLUMN IF NOT EXISTS original_price numeric(10,2),
  ADD COLUMN IF NOT EXISTS sale_price numeric(10,2),
  ADD COLUMN IF NOT EXISTS discount_percent integer;