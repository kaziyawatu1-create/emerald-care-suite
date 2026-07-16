-- Track preferred doctor for appointment bookings
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS preferred_doctor TEXT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'bookings_preferred_doctor_check'
  ) THEN
    ALTER TABLE public.bookings
      ADD CONSTRAINT bookings_preferred_doctor_check
      CHECK (
        preferred_doctor IS NULL
        OR preferred_doctor IN (
          'General Doctor',
          'Orthopedic',
          'Neurosurgeon',
          'Cardiothoracic Surgeon',
          'Pediatrician'
        )
      );
  END IF;
END $$;
