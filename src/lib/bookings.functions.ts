import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { normalizeKenyanPhone } from "./mpesa";
import { sendMail } from "./mail";
import type { BookingGender, BookingItem, BookingStatus, BookingType } from "./bookings";

function mapBookingRow(row: any): BookingItem {
  return {
    id: row.id,
    booking_number: row.booking_number,
    service: row.service,
    booking_type: row.booking_type as BookingType,
    customer_name: row.customer_name,
    customer_phone: row.customer_phone,
    customer_email: row.customer_email ?? "",
    date_of_birth: row.date_of_birth,
    gender: row.gender as BookingGender,
    appointment_date: row.appointment_date,
    appointment_time: row.appointment_time,
    notes: row.notes ?? "",
    status: row.status as BookingStatus,
    createdAt: row.created_at,
  };
}

const bookingRequestSchema = z.object({
  service: z.string().min(1).max(160),
  customer_name: z.string().min(2).max(120),
  customer_phone: z.string().min(7).max(20),
  customer_email: z.string().email().max(160).optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  date_of_birth: z.string().min(1).refine((value) => !Number.isNaN(Date.parse(value)), { message: "Invalid date of birth" }),
  gender: z.enum(["male", "female", "other"]).optional().default("other"),
  booking_type: z.enum(["lab", "home", "office"]).optional().default("lab"),
  appointment_date: z.string().min(1).refine((value) => !Number.isNaN(Date.parse(value)), { message: "Invalid appointment date" }),
  appointment_time: z.string().min(1).max(20),
  notes: z.string().max(1000).optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
});

const bookingUpdateSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["pending", "confirmed", "rescheduled", "canceled"]),
  appointment_date: z.string().min(1).optional().refine((value) => !value || !Number.isNaN(Date.parse(value)), { message: "Invalid appointment date" }),
  appointment_time: z.string().min(1).max(20).optional(),
  notes: z.string().max(1000).optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
});

function buildBookingNumber(): string {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = crypto.randomUUID().slice(0, 6).toUpperCase();
  return `BK-${datePart}-${suffix}`;
}

function buildBookingMessage(booking: BookingItem, action: BookingStatus) {
  const base = `Booking number: ${booking.booking_number}\nService: ${booking.service}\nAppointment: ${booking.appointment_date} at ${booking.appointment_time}\n`;
  const detailsHtml = `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:16px 0;">
    <tr>
      <td style="padding:8px 12px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:600;">Booking number</td>
      <td style="padding:8px 12px;border:1px solid #e2e8f0;">${booking.booking_number}</td>
    </tr>
    <tr>
      <td style="padding:8px 12px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:600;">Service</td>
      <td style="padding:8px 12px;border:1px solid #e2e8f0;">${booking.service}</td>
    </tr>
    <tr>
      <td style="padding:8px 12px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:600;">Booking type</td>
      <td style="padding:8px 12px;border:1px solid #e2e8f0;">${booking.booking_type}</td>
    </tr>
    <tr>
      <td style="padding:8px 12px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:600;">Appointment date</td>
      <td style="padding:8px 12px;border:1px solid #e2e8f0;">${booking.appointment_date}</td>
    </tr>
    <tr>
      <td style="padding:8px 12px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:600;">Appointment time</td>
      <td style="padding:8px 12px;border:1px solid #e2e8f0;">${booking.appointment_time}</td>
    </tr>
    <tr>
      <td style="padding:8px 12px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:600;">Customer</td>
      <td style="padding:8px 12px;border:1px solid #e2e8f0;">${booking.customer_name}</td>
    </tr>
    <tr>
      <td style="padding:8px 12px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:600;">Phone</td>
      <td style="padding:8px 12px;border:1px solid #e2e8f0;">${booking.customer_phone}</td>
    </tr>
    <tr>
      <td style="padding:8px 12px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:600;">Email</td>
      <td style="padding:8px 12px;border:1px solid #e2e8f0;">${booking.customer_email ?? "-"}</td>
    </tr>
    <tr>
      <td style="padding:8px 12px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:600;">DOB / Gender</td>
      <td style="padding:8px 12px;border:1px solid #e2e8f0;">${booking.date_of_birth} · ${booking.gender}</td>
    </tr>
    <tr>
      <td style="padding:8px 12px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:600;">Notes</td>
      <td style="padding:8px 12px;border:1px solid #e2e8f0;">${booking.notes ? booking.notes : "None"}</td>
    </tr>
  </table>`;

  if (action === "confirmed") {
    return {
      subject: `Your booking ${booking.booking_number} is confirmed`,
      text: `Hello ${booking.customer_name},\n\nYour booking has been confirmed. ${base}\nWe look forward to seeing you.\n\nThank you,\nNuno Pharmacy`,
      html: `<p>Hello ${booking.customer_name},</p><p>Your booking has been <strong>confirmed</strong>.</p>${detailsHtml}<p>Thank you,<br/>Nuno Pharmacy</p>`,
    };
  }
  if (action === "rescheduled") {
    return {
      subject: `Your booking ${booking.booking_number} has been rescheduled`,
      text: `Hello ${booking.customer_name},\n\nYour booking has been rescheduled. ${base}\nWe will be ready for your new appointment time.\n\nThank you,\nNuno Pharmacy`,
      html: `<p>Hello ${booking.customer_name},</p><p>Your booking has been <strong>rescheduled</strong>.</p>${detailsHtml}<p>Thank you,<br/>Nuno Pharmacy</p>`,
    };
  }
  if (action === "canceled") {
    return {
      subject: `Your booking ${booking.booking_number} has been canceled`,
      text: `Hello ${booking.customer_name},\n\nYour booking has been canceled. ${base}\nIf you want to reschedule, please contact us.\n\nThank you,\nNuno Pharmacy`,
      html: `<p>Hello ${booking.customer_name},</p><p>Your booking has been <strong>canceled</strong>.</p>${detailsHtml}<p>If you want to reschedule, please contact us.</p><p>Thank you,<br/>Nuno Pharmacy</p>`,
    };
  }
  return {
    subject: `Booking update: ${booking.booking_number}`,
    text: `Hello ${booking.customer_name},\n\nYour booking status has changed. ${base}\nThank you,\nNuno Pharmacy`,
    html: `<p>Hello ${booking.customer_name},</p><p>Your booking status has changed.</p>${detailsHtml}<p>Thank you,<br/>Nuno Pharmacy</p>`,
  };
}

async function notifyCustomer(booking: BookingItem, action: BookingStatus) {
  if (!booking.customer_email) return;
  const contactEmail = process.env.CONTACT_EMAIL ?? "nunopharmaceutical@gmail.com";
  const message = buildBookingMessage(booking, action);
  await sendMail({
    to: booking.customer_email,
    cc: contactEmail,
    subject: message.subject,
    text: message.text,
    html: message.html,
  });
}

export const listBookings = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("bookings")
    .select("id,booking_number,service,booking_type,customer_name,customer_phone,customer_email,date_of_birth,gender,appointment_date,appointment_time,notes,status,created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load bookings", error);
    return [] as BookingItem[];
  }

  return (data ?? []).map(mapBookingRow);
});

export const createBooking = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => bookingRequestSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const phone = normalizeKenyanPhone(data.customer_phone);
    if (!phone) throw new Error("Invalid Kenyan phone number. Use 07XXXXXXXX or +2547XXXXXXXX.");

    const bookingNumber = buildBookingNumber();
    const payload = {
      booking_number: bookingNumber,
      service: data.service,
      booking_type: data.booking_type ?? "lab",
      customer_name: data.customer_name,
      customer_phone: phone,
      customer_email: data.customer_email ?? null,
      date_of_birth: new Date(data.date_of_birth).toISOString().slice(0, 10),
      gender: data.gender ?? "other",
      appointment_date: new Date(data.appointment_date).toISOString().slice(0, 10),
      appointment_time: data.appointment_time,
      notes: data.notes ?? null,
      status: "pending",
    };

    const { data: saved, error } = await supabaseAdmin
      .from("bookings")
      .insert(payload)
      .select("id,booking_number,service,customer_name,customer_phone,customer_email,date_of_birth,gender,appointment_date,appointment_time,notes,status,created_at")
      .single();

    if (error) throw new Error(error.message);
    const booking = mapBookingRow(saved as any);

    if (booking.customer_email) {
      await sendMail({
        to: booking.customer_email,
        cc: process.env.CONTACT_EMAIL ?? "nunopharmaceutical@gmail.com",
        subject: `Booking request received: ${booking.booking_number}`,
        text: `Hello ${booking.customer_name},\n\nYour booking request has been received. Booking number ${booking.booking_number}. We will notify you once the appointment is confirmed.\n\nThank you,\nNuno Pharmacy`,
        html: `<p>Hello ${booking.customer_name},</p><p>Your booking request has been received.</p><p><strong>Booking number:</strong> ${booking.booking_number}</p><p>We will notify you once the appointment is confirmed.</p><p>Thank you,<br/>Nuno Pharmacy</p>`,
      });
    }

    return booking;
  });

export const updateBooking = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => bookingUpdateSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload: {
      status: BookingStatus;
      appointment_date?: string;
      appointment_time?: string;
      notes?: string;
    } = { status: data.status };
    if (data.appointment_date) payload.appointment_date = new Date(data.appointment_date).toISOString().slice(0, 10);
    if (data.appointment_time) payload.appointment_time = data.appointment_time;
    if (data.notes !== undefined) payload.notes = data.notes;

    const { data: saved, error } = await supabaseAdmin
      .from("bookings")
      .update(payload)
      .eq("id", data.id)
      .select("id,booking_number,service,customer_name,customer_phone,customer_email,date_of_birth,gender,appointment_date,appointment_time,notes,status,created_at")
      .single();

    if (error) throw new Error(error.message);

    const booking = mapBookingRow(saved as any);
    if (data.status === "confirmed" || data.status === "rescheduled" || data.status === "canceled") {
      await notifyCustomer(booking, data.status);
    }

    return booking;
  });
