-- Add location support for services so offerings can be lab-only, office, or home-based.
ALTER TABLE public.services
  ADD COLUMN location TEXT NOT NULL DEFAULT 'lab-only' CHECK (location IN ('lab-only', 'office', 'home'));
