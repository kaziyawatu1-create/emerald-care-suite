-- Simplify services: keep name, price, duration, and a single icon
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS icon_url TEXT;

UPDATE public.services
SET icon_url = image_urls[1]
WHERE icon_url IS NULL
  AND image_urls IS NOT NULL
  AND cardinality(image_urls) >= 1;

ALTER TABLE public.services
  DROP COLUMN IF EXISTS image_urls,
  DROP COLUMN IF EXISTS description,
  DROP COLUMN IF EXISTS type,
  DROP COLUMN IF EXISTS location,
  DROP COLUMN IF EXISTS status,
  DROP COLUMN IF EXISTS test_results;
