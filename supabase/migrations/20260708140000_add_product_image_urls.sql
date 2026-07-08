-- Add support for multiple product images
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_urls TEXT[];
