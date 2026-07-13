-- Add hybrid option to service type constraint
ALTER TABLE public.services
  DROP CONSTRAINT IF EXISTS services_type_check;
ALTER TABLE public.services
  ADD CONSTRAINT services_type_check CHECK (type IN ('inhouse', 'at-home', 'hybrid'));
