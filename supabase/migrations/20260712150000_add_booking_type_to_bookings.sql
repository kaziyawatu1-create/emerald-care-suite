-- Add booking type to service booking records
ALTER TABLE public.bookings
  ADD COLUMN booking_type TEXT NOT NULL DEFAULT 'lab';

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_booking_type_check CHECK (booking_type IN ('lab', 'home', 'office'));

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
