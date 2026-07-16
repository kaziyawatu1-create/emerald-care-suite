import { createServerFn } from "@tanstack/react-start";
import type { BookingGender, BookingItem, BookingStatus, BookingType } from "./bookings";

function mapAppointmentRow(row: any): BookingItem {
  return {
    id: row.id,
    booking_number: row.appointment_number ?? row.booking_number,
    service: row.service,
    booking_type: (row.booking_type ?? "office") as BookingType,
    customer_name: row.customer_name,
    customer_phone: row.customer_phone,
    customer_email: row.customer_email ?? "",
    date_of_birth: row.date_of_birth ?? "",
    gender: (row.gender ?? "other") as BookingGender,
    appointment_date: row.appointment_date,
    appointment_time: row.appointment_time,
    preferred_doctor: typeof row.preferred_doctor === "string" ? row.preferred_doctor : undefined,
    notes: row.notes ?? "",
    status: row.status as BookingStatus,
    createdAt: row.created_at,
  };
}

export const listDoctorAppointments = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("doctor_appointments")
    .select("id,appointment_number,service,booking_type,customer_name,customer_phone,customer_email,date_of_birth,gender,appointment_date,appointment_time,preferred_doctor,notes,status,created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load doctor appointments", error);
    return [] as BookingItem[];
  }

  return (data ?? []).map((row) => mapAppointmentRow(row as any));
});
