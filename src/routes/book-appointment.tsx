import { createFileRoute } from "@tanstack/react-router";
import { FormEvent, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Clock3, MessageCircle, Phone, Stethoscope } from "lucide-react";
import { PageHeader } from "../components/site/PageHeader";
import { Reveal } from "../components/site/Reveal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { createBooking } from "../lib/bookings.functions";

export const Route = createFileRoute("/book-appointment")({
  head: () => ({
    meta: [
      { title: "Book Doctor Appointment | Nuno Pharmacy" },
      {
        name: "description",
        content:
          "Book a doctor appointment with Nuno Pharmacy by phone call or WhatsApp. Share your contact details and we’ll confirm your visit.",
      },
      { property: "og:title", content: "Book a Doctor Appointment" },
      {
        property: "og:description",
        content: "Schedule affordable healthcare appointments by call or WhatsApp.",
      },
    ],
  }),
  component: BookAppointmentPage,
});

const DOCTOR_PHONE_DISPLAY = "0111121500";
const DOCTOR_PHONE_TEL = "0111121500";
const DOCTOR_WHATSAPP = "254111121500";
const DOCTOR_SERVICE_NAME = "Doctor Appointment";

function BookAppointmentPage() {
  const bookAppointmentFn = useServerFn(createBooking);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingMode, setBookingMode] = useState<"call" | "whatsapp">("call");
  const [form, setForm] = useState({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
  });
  const [status, setStatus] = useState<{
    type: "idle" | "success" | "error";
    message: string;
  }>({ type: "idle", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openBookingDialog = (mode: "call" | "whatsapp") => {
    setBookingMode(mode);
    setForm({ customer_name: "", customer_phone: "", customer_email: "" });
    setStatus({ type: "idle", message: "" });
    setBookingOpen(true);
  };

  const resetBookingDialog = () => {
    setBookingOpen(false);
    setForm({ customer_name: "", customer_phone: "", customer_email: "" });
    setStatus({ type: "idle", message: "" });
    setIsSubmitting(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus({ type: "idle", message: "" });

    try {
      const booking = await bookAppointmentFn({
        data: {
          service: DOCTOR_SERVICE_NAME,
          customer_name: form.customer_name.trim(),
          customer_phone: form.customer_phone.trim(),
          customer_email: form.customer_email.trim(),
          date_of_birth: new Date().toISOString().slice(0, 10),
          gender: "other",
          booking_type: "office",
          appointment_date: new Date().toISOString().slice(0, 10),
          appointment_time: "09:00",
          notes: `Doctor appointment request via ${bookingMode === "call" ? "phone call" : "WhatsApp"}.`,
        },
      });

      setStatus({
        type: "success",
        message: `Booking saved. Reference ${booking.booking_number}.`,
      });
      setBookingOpen(false);

      const redirectTarget =
        bookingMode === "call"
          ? `tel:${DOCTOR_PHONE_TEL}`
          : `https://wa.me/${DOCTOR_WHATSAPP}?text=${encodeURIComponent(
              `Hello Nuno Pharmacy, I would like to book a doctor appointment. My name is ${form.customer_name.trim()} and my phone number is ${form.customer_phone.trim()}.`,
            )}`;

      window.location.href = redirectTarget;
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to save your booking request.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Affordable Healthcare"
        title="Book a doctor appointment"
        subtitle="Choose call or WhatsApp to schedule your visit. We’ll save your contact details and connect you right away."
      />

      <section className="section-pad">
        <div className="mx-auto max-w-4xl px-4 md:px-8">
          <Reveal>
            <article className="rounded-[var(--radius-3xl)] border border-border bg-card p-8 shadow-elegant md:p-10">
              <div className="flex flex-col gap-6 md:flex-row md:items-start">
                <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Stethoscope className="h-8 w-8" />
                </div>
                <div className="flex-1">
                  <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">
                    Doctor consultation booking
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
                    Get professional medical care at accessible prices. Share your name and phone
                    number, then continue by call or WhatsApp on {DOCTOR_PHONE_DISPLAY}.
                  </p>
                  <p className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#2BB673]">
                    <Clock3 className="h-4 w-4" />
                    Available for appointments · {DOCTOR_PHONE_DISPLAY}
                  </p>
                </div>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => openBookingDialog("call")}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-background px-6 py-3.5 text-sm font-display font-semibold text-foreground transition hover:border-primary hover:text-primary"
                >
                  <Phone className="h-4 w-4" />
                  Call {DOCTOR_PHONE_DISPLAY}
                </button>
                <button
                  type="button"
                  onClick={() => openBookingDialog("whatsapp")}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-6 py-3.5 text-sm font-display font-semibold text-primary transition hover:bg-primary/20"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp {DOCTOR_PHONE_DISPLAY}
                </button>
              </div>
            </article>
          </Reveal>
        </div>
      </section>

      <Dialog
        open={bookingOpen}
        onOpenChange={(open) => (open ? setBookingOpen(true) : resetBookingDialog())}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {bookingMode === "call" ? "Call booking request" : "WhatsApp booking request"}
            </DialogTitle>
            <DialogDescription>
              Share your name and contact details. We’ll save the booking and then connect you{" "}
              {bookingMode === "call" ? "by phone" : "on WhatsApp"}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="rounded-2xl border border-border bg-muted/40 p-4">
              <div className="text-sm font-semibold text-foreground">Service</div>
              <p className="mt-1 text-sm text-muted-foreground">{DOCTOR_SERVICE_NAME}</p>
            </div>
            <label className="block text-sm font-medium">
              Full name
              <input
                value={form.customer_name}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, customer_name: event.target.value }))
                }
                className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3"
                required
              />
            </label>
            <label className="block text-sm font-medium">
              Phone
              <input
                value={form.customer_phone}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, customer_phone: event.target.value }))
                }
                className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3"
                required
              />
            </label>
            <label className="block text-sm font-medium">
              Email (optional)
              <input
                type="email"
                value={form.customer_email}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, customer_email: event.target.value }))
                }
                className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3"
              />
            </label>
            {status.message ? (
              <p
                className={`text-sm ${status.type === "success" ? "text-emerald-700" : "text-destructive"}`}
              >
                {status.message}
              </p>
            ) : null}
            <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={resetBookingDialog}
                className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-full btn-gradient px-5 py-2.5 text-sm font-semibold disabled:pointer-events-none disabled:opacity-60"
              >
                {isSubmitting
                  ? "Saving..."
                  : `Continue to ${bookingMode === "call" ? "call" : "WhatsApp"}`}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
