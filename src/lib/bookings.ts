export type BookingStatus = "pending" | "confirmed" | "rescheduled" | "canceled";
export type BookingGender = "male" | "female" | "other";
export type BookingType = "lab" | "home" | "office";

export interface BookingItem {
  id: string;
  booking_number: string;
  service: string;
  booking_type: BookingType;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  date_of_birth: string;
  gender: BookingGender;
  appointment_date: string;
  appointment_time: string;
  preferred_doctor?: string;
  notes: string;
  status: BookingStatus;
  createdAt: string;
}
