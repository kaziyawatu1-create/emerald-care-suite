ALTER TABLE public.offers
  ADD COLUMN IF NOT EXISTS product_id UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'offers_product_id_fkey'
  ) THEN
    ALTER TABLE public.offers
      ADD CONSTRAINT offers_product_id_fkey
      FOREIGN KEY (product_id)
      REFERENCES public.products(id)
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_offers_product_id ON public.offers(product_id);
