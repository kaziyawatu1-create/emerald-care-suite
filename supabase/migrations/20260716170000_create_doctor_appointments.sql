create table if not exists public.doctor_appointments (
  id uuid primary key default gen_random_uuid(),
  appointment_number text not null unique,
  service text not null,
  booking_type text not null default 'office',
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  date_of_birth date,
  gender text not null default 'other',
  appointment_date date not null,
  appointment_time text not null,
  preferred_doctor text,
  notes text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists doctor_appointments_status_idx on public.doctor_appointments(status);
create index if not exists doctor_appointments_created_at_idx on public.doctor_appointments(created_at desc);
