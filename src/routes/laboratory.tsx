import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Check, ArrowRight } from "lucide-react";
import { PageHeader } from "../components/site/PageHeader";
import { Reveal } from "../components/site/Reveal";
import { createBooking } from "../lib/bookings.functions";
import { listServices } from "../lib/services.functions";
import type { ServiceItem } from "../lib/services";

export const Route = createFileRoute("/laboratory")({
  head: () => ({
    meta: [
      { title: "Laboratory Services | Nuno Pharmacy" },
      { name: "description", content: "Modern laboratory testing including HIV, blood sugar, malaria, H. pylori, blood grouping and sample collection." },
      { property: "og:title", content: "Nuno Pharmacy Laboratory Services" },
      { property: "og:description", content: "Reliable diagnostic services with home and office sample collection." },
    ],
  }),
  component: LaboratoryPage,
});

function LaboratoryPage() {
  const loadServicesFn = useServerFn(listServices);
  const bookTestFn = useServerFn(createBooking);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [form, setForm] = useState<{
    customer_name: string;
    customer_phone: string;
    customer_email: string;
    service: string;
    booking_type: "lab" | "home" | "office";
    gender: "male" | "female" | "other";
    date_of_birth: string;
    appointment_date: string;
    appointment_time: string;
    notes: string;
  }>({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    service: "",
    booking_type: "lab",
    gender: "male",
    date_of_birth: "",
    appointment_date: "",
    appointment_time: "",
    notes: "",
  });
  const [status, setStatus] = useState<{ type: "idle" | "success" | "error"; message: string }>({ type: "idle", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingStep, setBookingStep] = useState(1);

  useEffect(() => {
    let mounted = true;

    loadServicesFn()
      .then((rows) => {
        if (!mounted) return;
        const nextServices = Array.isArray(rows) ? (rows as ServiceItem[]) : [];
        setServices(nextServices);
        if (nextServices.length && !form.service) {
          setForm((current) => ({ ...current, service: nextServices[0].name }));
        }
      })
      .catch(() => {
        // ignore failures; the page can still render and show no service options
      });

    return () => {
      mounted = false;
    };
  }, [loadServicesFn, form.service]);

  const laboratoryServices = useMemo(() => services, [services]);

  const bookingSteps = [
    { label: "Contact details", description: "Provide patient information and contact details." },
    { label: "Service details", description: "Select your test, location and patient gender." },
    { label: "Appointment", description: "Choose a time, add notes, and review before booking." },
  ];

  const isContactStepValid = form.customer_name.trim() !== "" && form.customer_phone.trim() !== "";
  const isServiceStepValid = form.service.trim() !== "" && form.booking_type.trim() !== "" && form.gender.trim() !== "";
  const isAppointmentStepValid = form.appointment_date !== "" && form.appointment_time !== "";
  const isCurrentStepValid = bookingStep === 1 ? isContactStepValid : bookingStep === 2 ? isServiceStepValid : bookingStep === 3 ? isAppointmentStepValid : true;

  const goToNextStep = () => {
    if (bookingStep < bookingSteps.length) {
      setBookingStep((current) => current + 1);
    }
  };

  const goToPreviousStep = () => {
    if (bookingStep > 1) {
      setBookingStep((current) => current - 1);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus({ type: "idle", message: "" });

    if (bookingStep < bookingSteps.length) {
      goToNextStep();
      return;
    }

    setIsSubmitting(true);
    try {
      const booking = await bookTestFn({ data: form });
      setStatus({ type: "success", message: `Booking request submitted! Your booking number is ${booking.booking_number}.` });
      setForm((current) => ({ ...current, customer_name: "", customer_phone: "", customer_email: "", date_of_birth: "", appointment_date: "", appointment_time: "", notes: "", service: services[0]?.name ?? "" }));
      setBookingStep(1);
    } catch (error) {
      setStatus({ type: "error", message: error instanceof Error ? error.message : "Unable to submit your booking request." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Laboratory"
        title="Reliable laboratory diagnostics with professional care"
        subtitle="Every test is handled with speed, precision and clear communication — from in-house diagnostics to home and office sample collection."
      >
        <a href="#book-test" className="inline-flex rounded-full btn-gradient px-7 py-3.5 text-sm font-display font-semibold">
          Book Test
        </a>
      </PageHeader>

      <section className="section-pad">
        <div className="mx-auto max-w-7xl px-4 md:px-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {laboratoryServices.map((service, index) => (
            <Reveal key={service.id} delay={index * 50}>
              <article className="rounded-[var(--radius-2xl)] border border-border bg-card p-6 shadow-soft card-lift">
                <div>
                  <h2 className="font-display text-xl font-semibold">{service.name}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{service.description}</p>
                </div>
                <div className="mt-6 grid gap-3 text-sm text-muted-foreground">
                  <div>
                    <span className="font-semibold text-foreground">Price:</span> KES {service.price_kes}
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">Duration:</span> {service.duration_minutes} min
                  </div>
                </div>
                <a
                  href="#book-test"
                  onClick={() => {
                    setForm((current) => ({ ...current, service: service.name }));
                    setBookingStep(1);
                  }}
                  className="mt-6 inline-flex items-center gap-2 rounded-full btn-gradient px-5 py-2.5 text-sm font-display font-semibold"
                >
                  Book Test
                  <ArrowRight className="h-4 w-4" />
                </a>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section-pad bg-muted/45">
        <div className="mx-auto max-w-5xl px-4 md:px-8 text-center">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
              Included Services
            </span>
            <h2 className="mt-5 font-display text-3xl md:text-5xl font-bold">Testing designed for convenience</h2>
          </Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {laboratoryServices.map((service, index) => (
              <Reveal key={service.id} delay={index * 40}>
                <div className="flex items-start gap-3 rounded-[var(--radius-xl)] border border-border bg-card px-5 py-4 text-left shadow-soft">
                  <Check className="mt-0.5 h-5 w-5 text-primary" />
                  <span className="font-medium">{service.name}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="book-test" className="section-pad">
        <div className="mx-auto max-w-5xl px-4 md:px-8">
          <Reveal>
            <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                  Laboratory booking
                </span>
                <h2 className="mt-5 font-display text-3xl md:text-4xl font-bold">Book your test appointment</h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">
                  Share the patient details, test type, appointment preference and we’ll contact you to confirm the booking.
                </p>
              </div>
              <form onSubmit={handleSubmit} className="rounded-[var(--radius-3xl)] border border-border bg-card p-8 shadow-soft">
                <div className="rounded-3xl border border-border bg-muted/40 p-4 mb-6">
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    {bookingSteps.map((step, index) => {
                      const stepIndex = index + 1;
                      const active = bookingStep === stepIndex;
                      return (
                        <div key={step.label} className={`rounded-2xl border p-3 transition ${active ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground"}`}>
                          <div className="text-xs font-semibold uppercase tracking-[0.25em]">Step {stepIndex}</div>
                          <div className="mt-2 font-medium">{step.label}</div>
                          <p className="mt-1 text-xs leading-snug">{step.description}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {bookingStep === 1 ? (
                  <div className="grid gap-4">
                    <label className="block text-sm font-medium">
                      Customer name <span className="ml-1 text-destructive">*</span>
                      <input
                        name="customer_name"
                        value={form.customer_name}
                        onChange={(event) => setForm((current) => ({ ...current, customer_name: event.target.value }))}
                        className="mt-2 w-full rounded-[var(--radius-xl)] border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                        placeholder="Customer full name"
                        aria-label="Customer full name"
                        required
                      />
                    </label>
                    <label className="block text-sm font-medium">
                      Customer email
                      <input
                        type="email"
                        name="customer_email"
                        value={form.customer_email}
                        onChange={(event) => setForm((current) => ({ ...current, customer_email: event.target.value }))}
                        className="mt-2 w-full rounded-[var(--radius-xl)] border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                        placeholder="Email address"
                        aria-label="Email address"
                      />
                    </label>
                    <label className="block text-sm font-medium">
                      Phone <span className="ml-1 text-destructive">*</span>
                      <input
                        name="customer_phone"
                        value={form.customer_phone}
                        onChange={(event) => setForm((current) => ({ ...current, customer_phone: event.target.value }))}
                        className="mt-2 w-full rounded-[var(--radius-xl)] border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                        placeholder="Phone number"
                        aria-label="Phone number"
                        required
                      />
                    </label>
                    <label className="block text-sm font-medium">
                      Date of birth
                      <input
                        type="date"
                        name="date_of_birth"
                        value={form.date_of_birth}
                        onChange={(event) => setForm((current) => ({ ...current, date_of_birth: event.target.value }))}
                        className="mt-2 w-full rounded-[var(--radius-xl)] border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                        aria-label="Date of birth"
                      />
                    </label>
                  </div>
                ) : bookingStep === 2 ? (
                  <div className="grid gap-4">
                    <label className="block text-sm font-medium">
                      Service <span className="ml-1 text-destructive">*</span>
                      <select
                        name="service"
                        value={form.service}
                        onChange={(event) => setForm((current) => ({ ...current, service: event.target.value }))}
                        className="mt-2 w-full rounded-[var(--radius-xl)] border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                        required
                      >
                        {laboratoryServices.length === 0 ? (
                          <option value="" disabled>
                            Loading services...
                          </option>
                        ) : (
                          laboratoryServices.map((service) => (
                            <option key={service.id} value={service.name}>
                              {service.name}
                            </option>
                          ))
                        )}
                      </select>
                    </label>
                    <label className="block text-sm font-medium">
                      Type <span className="ml-1 text-destructive">*</span>
                      <select
                        name="booking_type"
                        value={form.booking_type}
                        onChange={(event) => setForm((current) => ({ ...current, booking_type: event.target.value as "lab" | "home" | "office" }))}
                        className="mt-2 w-full rounded-[var(--radius-xl)] border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                        required
                      >
                        <option value="lab">Lab</option>
                        <option value="home">Home</option>
                        <option value="office">Office</option>
                      </select>
                    </label>
                    <label className="block text-sm font-medium">
                      Gender <span className="ml-1 text-destructive">*</span>
                      <select
                        name="gender"
                        value={form.gender}
                        onChange={(event) => setForm((current) => ({ ...current, gender: event.target.value as "male" | "female" | "other" }))}
                        className="mt-2 w-full rounded-[var(--radius-xl)] border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                        required
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </label>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block text-sm font-medium">
                        Appointment date <span className="ml-1 text-destructive">*</span>
                        <input
                          type="date"
                          name="appointment_date"
                          value={form.appointment_date}
                          onChange={(event) => setForm((current) => ({ ...current, appointment_date: event.target.value }))}
                          className="mt-2 w-full rounded-[var(--radius-xl)] border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                          aria-label="Preferred appointment date"
                          min={new Date().toISOString().split("T")[0]}
                          required
                        />
                      </label>
                      <label className="block text-sm font-medium">
                        Appointment time <span className="ml-1 text-destructive">*</span>
                        <input
                          type="time"
                          name="appointment_time"
                          value={form.appointment_time}
                          onChange={(event) => setForm((current) => ({ ...current, appointment_time: event.target.value }))}
                          className="mt-2 w-full rounded-[var(--radius-xl)] border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                          aria-label="Preferred appointment time"
                          required
                        />
                      </label>
                    </div>
                    <label className="block text-sm font-medium">
                      Notes
                      <textarea
                        name="notes"
                        value={form.notes}
                        onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                        className="mt-2 min-h-32 w-full rounded-[var(--radius-xl)] border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                        placeholder="Additional notes or instructions"
                        aria-label="Additional notes or instructions"
                      />
                    </label>
                    <div className="rounded-2xl border border-border bg-background p-4">
                      <div className="text-sm font-semibold text-foreground">Review your booking</div>
                      <div className="mt-3 grid gap-3 text-sm text-muted-foreground">
                        <div>
                          <span className="font-semibold text-foreground">Test:</span> {form.service}
                        </div>
                        <div>
                          <span className="font-semibold text-foreground">Type:</span> {form.booking_type}
                        </div>
                        <div>
                          <span className="font-semibold text-foreground">Gender:</span> {form.gender}
                        </div>
                        <div>
                          <span className="font-semibold text-foreground">Appointment:</span> {form.appointment_date || "-"} at {form.appointment_time || "-"}
                        </div>
                        <div>
                          <span className="font-semibold text-foreground">Notes:</span> {form.notes || "None"}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {status.message ? (
                  <p className={`text-sm ${status.type === "success" ? "text-emerald-600" : "text-red-600"}`}>{status.message}</p>
                ) : null}

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
                  {bookingStep > 1 ? (
                    <button type="button" onClick={goToPreviousStep} className="rounded-full border border-border px-5 py-3 text-sm font-semibold">
                      Back
                    </button>
                  ) : null}
                  <button
                    type="submit"
                    disabled={!isCurrentStepValid || isSubmitting}
                    className="rounded-full btn-gradient px-7 py-3.5 text-sm font-display font-semibold disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {bookingStep < bookingSteps.length ? "Continue" : isSubmitting ? "Submitting..." : "Submit Booking"}
                  </button>
                </div>
              </form>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
