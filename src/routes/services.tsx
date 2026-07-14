import { createFileRoute } from "@tanstack/react-router";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Eye, ImageIcon, Phone, MessageCircle } from "lucide-react";
import pathwayLabLogo from "../assets/pathway-lab-logo.svg";
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
import { Badge } from "../components/ui/badge";
import {
  formatServiceLocation,
  formatServiceType,
  readServices,
  type ServiceItem,
  type ServiceStatus,
} from "../lib/services";
import { listServices } from "../lib/services.functions";
import { createBooking } from "../lib/bookings.functions";

type BookingForm = {
  service: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  date_of_birth: string;
  appointment_date: string;
  appointment_time: string;
  notes: string;
};

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services | Nuno Pharmacy" },
      {
        name: "description",
        content: "Explore our in-house and at-home healthcare services at Nuno Pharmacy.",
      },
    ],
  }),
  component: ServicesPage,
});

function ServicesPage() {
  const loadServicesFn = useServerFn(listServices);
  const bookServiceFn = useServerFn(createBooking);
  const [services, setServices] = useState<ServiceItem[]>(() => readServices());
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [bookingStep, setBookingStep] = useState(1);
  const [bookingStatus, setBookingStatus] = useState<{
    type: "idle" | "success" | "error";
    message: string;
  }>({ type: "idle", message: "" });
  const [quickBookingOpen, setQuickBookingOpen] = useState(false);
  const [quickBookingMode, setQuickBookingMode] = useState<"call" | "whatsapp">("call");
  const [quickBookingService, setQuickBookingService] = useState<ServiceItem | null>(null);
  const [quickBookingForm, setQuickBookingForm] = useState({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
  });
  const [quickBookingStatus, setQuickBookingStatus] = useState<{
    type: "idle" | "success" | "error";
    message: string;
  }>({ type: "idle", message: "" });
  const [isSubmittingQuickBooking, setIsSubmittingQuickBooking] = useState(false);
  const [bookingForm, setBookingForm] = useState<BookingForm>({
    service: "",
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    date_of_birth: "",
    appointment_date: "",
    appointment_time: "",
    notes: "",
  });

  useEffect(() => {
    let mounted = true;

    loadServicesFn()
      .then((rows) => {
        if (!mounted) return;
        const nextServices = Array.isArray(rows) ? (rows as ServiceItem[]) : [];
        setServices(nextServices.length > 0 ? nextServices : readServices());
      })
      .catch(() => {
        if (mounted) {
          setServices(readServices());
        }
      });

    return () => {
      mounted = false;
    };
  }, [loadServicesFn]);

  const featuredServices = useMemo(() => services.slice(0, 6), [services]);

  const getStatusVariant = (status: ServiceStatus) => {
    if (status === "pending") return "secondary";
    if (status === "inactive") return "destructive";
    return "default";
  };

  const bookingSteps = [
    { label: "Contact details", description: "Tell us who the booking is for." },
    { label: "Appointment", description: "Choose a date, time, and add notes." },
    { label: "Review", description: "Confirm your booking before submitting." },
  ];

  const isContactStepValid =
    bookingForm.customer_name.trim() !== "" &&
    bookingForm.customer_phone.trim() !== "" &&
    bookingForm.date_of_birth !== "";
  const isAppointmentStepValid =
    bookingForm.appointment_date !== "" && bookingForm.appointment_time !== "";
  const isCurrentStepValid =
    bookingStep === 1 ? isContactStepValid : bookingStep === 2 ? isAppointmentStepValid : true;

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

  const openBookingDialog = (serviceName: string) => {
    setBookingForm((prev) => ({ ...prev, service: serviceName }));
    setBookingStep(1);
    setBookingStatus({ type: "idle", message: "" });
    setBookingDialogOpen(true);
  };

  const resetBookingForm = () => {
    setBookingForm({
      service: "",
      customer_name: "",
      customer_phone: "",
      customer_email: "",
      date_of_birth: "",
      appointment_date: "",
      appointment_time: "",
      notes: "",
    });
    setBookingStep(1);
    setBookingStatus({ type: "idle", message: "" });
    setBookingDialogOpen(false);
  };

  const openQuickBookingDialog = (service: ServiceItem, mode: "call" | "whatsapp") => {
    setQuickBookingService(service);
    setQuickBookingMode(mode);
    setQuickBookingForm({ customer_name: "", customer_phone: "", customer_email: "" });
    setQuickBookingStatus({ type: "idle", message: "" });
    setQuickBookingOpen(true);
  };

  const resetQuickBookingDialog = () => {
    setQuickBookingOpen(false);
    setQuickBookingService(null);
    setQuickBookingForm({ customer_name: "", customer_phone: "", customer_email: "" });
    setQuickBookingStatus({ type: "idle", message: "" });
    setIsSubmittingQuickBooking(false);
  };

  const handleQuickBookingSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!quickBookingService) return;

    setIsSubmittingQuickBooking(true);
    setQuickBookingStatus({ type: "idle", message: "" });

    try {
      const booking = await bookServiceFn({
        data: {
          service: quickBookingService.name,
          customer_name: quickBookingForm.customer_name.trim(),
          customer_phone: quickBookingForm.customer_phone.trim(),
          customer_email: quickBookingForm.customer_email.trim(),
          date_of_birth: new Date().toISOString().slice(0, 10),
          gender: "other",
          booking_type:
            quickBookingService.location === "home-only" ||
            quickBookingService.location === "home-office"
              ? "home"
              : "office",
          appointment_date: new Date().toISOString().slice(0, 10),
          appointment_time: "09:00",
          notes: `Quick booking via ${quickBookingMode === "call" ? "phone call" : "WhatsApp"}.`,
        },
      });

      setQuickBookingStatus({
        type: "success",
        message: `Booking saved. Reference ${booking.booking_number}.`,
      });
      setQuickBookingOpen(false);

      const redirectTarget =
        quickBookingMode === "call"
          ? `tel:0111121500`
          : `https://wa.me/254111121500?text=${encodeURIComponent(
              `Hello Nuno Pharmacy, I would like to book the ${quickBookingService.name} service. My name is ${quickBookingForm.customer_name.trim()} and my phone number is ${quickBookingForm.customer_phone.trim()}.`,
            )}`;

      window.location.href = redirectTarget;
    } catch (error) {
      setQuickBookingStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to save your booking request.",
      });
    } finally {
      setIsSubmittingQuickBooking(false);
    }
  };

  const handleSubmitBooking = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBookingStatus({ type: "idle", message: "" });

    if (bookingStep < bookingSteps.length) {
      goToNextStep();
      return;
    }

    try {
      const booking = await bookServiceFn({ data: bookingForm });
      setBookingStatus({
        type: "success",
        message: `Booking request submitted! Your booking number is ${booking.booking_number}.`,
      });
      setBookingForm((prev) => ({
        ...prev,
        customer_name: "",
        customer_phone: "",
        customer_email: "",
        date_of_birth: "",
        appointment_date: "",
        appointment_time: "",
        notes: "",
      }));
    } catch (error) {
      setBookingStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to submit booking.",
      });
    }
  };

  return (
    <>
      <PageHeader
        compact
        eyebrow="Services"
        title="Flexible healthcare support for every routine"
        subtitle="Choose from in-house care and at-home visits designed around your schedule and comfort."
      />

      <section className="py-8">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <Reveal>
            <div className="mb-4 flex flex-wrap items-center gap-3 rounded-[var(--radius-2xl)] border border-primary/20 bg-primary/5 p-3 shadow-soft">
              <img
                src={pathwayLabLogo}
                alt="Pathway Lab logo"
                className="h-10 w-10 rounded-full border border-border bg-white p-1"
              />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Collaborating with Pathway Lab
                </p>
                <p className="text-sm text-muted-foreground">
                  We partner with Pathway Lab for trusted diagnostics, professional sample handling
                  and coordinated healthcare support.
                </p>
              </div>
            </div>
          </Reveal>
          <div className="grid gap-3 lg:grid-cols-3">
            {featuredServices.map((service, index) => (
              <Reveal key={service.id} delay={index * 50}>
                <article className="rounded-2xl border border-border bg-card p-3 shadow-soft card-lift">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1">
                      <Badge className="uppercase" variant="secondary">
                        {formatServiceType(service.type)}
                      </Badge>
                      <Badge className="uppercase" variant={getStatusVariant(service.status)}>
                        {service.status}
                      </Badge>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedService(service)}
                      className="rounded-full border border-border p-2 text-muted-foreground transition hover:border-primary hover:text-primary"
                      aria-label={`View details for ${service.name}`}
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-3 overflow-hidden rounded-xl border border-border bg-muted/50">
                    {service.image_urls?.[0] ? (
                      <img
                        src={service.image_urls[0]}
                        alt={service.name}
                        className="aspect-[16/10] w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex aspect-[16/10] items-center justify-center text-muted-foreground">
                        <ImageIcon className="h-10 w-10" />
                      </div>
                    )}
                  </div>
                  <h2 className="mt-2 font-display text-lg font-semibold truncate whitespace-nowrap">
                    {service.name}
                  </h2>
                  <p className="mt-1 text-sm leading-snug text-muted-foreground">
                    {service.description.split("\n")[0]}
                  </p>
                  <div className="mt-2 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                    <div>
                      <span className="font-semibold text-foreground">Price:</span> KES{" "}
                      {service.price_kes}
                    </div>
                    <div>
                      <span className="font-semibold text-foreground">Duration:</span>{" "}
                      {service.duration_minutes} min
                    </div>
                    <div>
                      <span className="font-semibold text-foreground">Location:</span>{" "}
                      {formatServiceLocation(service.location)}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openQuickBookingDialog(service, "call")}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-3 py-2 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary"
                    >
                      <Phone className="h-4 w-4" />
                      Call
                    </button>
                    <button
                      type="button"
                      onClick={() => openQuickBookingDialog(service, "whatsapp")}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-2 text-sm font-semibold text-primary transition hover:bg-primary/20"
                    >
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp
                    </button>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <Dialog
        open={Boolean(selectedService)}
        onOpenChange={(open) => !open && setSelectedService(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedService?.name ?? "Service details"}</DialogTitle>
            <DialogDescription>Detailed information about this service offering.</DialogDescription>
          </DialogHeader>
          {selectedService ? (
            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              {selectedService?.image_urls?.length ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {selectedService.image_urls.map((url, index) => (
                    <img
                      key={`${url}-${index}`}
                      src={url}
                      alt={`${selectedService.name} ${index + 1}`}
                      className="h-40 w-full rounded-2xl border border-border object-cover"
                    />
                  ))}
                </div>
              ) : null}
              <div className="rounded-2xl border border-border bg-muted/40 p-4">
                <p className="font-semibold text-foreground">Overview</p>
                <p className="mt-2 leading-snug">{selectedService.description}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="font-semibold text-foreground">Type</p>
                  <p className="mt-1">{formatServiceType(selectedService.type)}</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Location</p>
                  <p className="mt-1">{formatServiceLocation(selectedService.location)}</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Price</p>
                  <p className="mt-1">KES {selectedService.price_kes}</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Duration</p>
                  <p className="mt-1">{selectedService.duration_minutes} min</p>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={quickBookingOpen}
        onOpenChange={(open) => (open ? setQuickBookingOpen(true) : resetQuickBookingDialog())}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {quickBookingMode === "call" ? "Call booking request" : "WhatsApp booking request"}
            </DialogTitle>
            <DialogDescription>
              Share your name and contact details. We’ll save the booking and then connect you{" "}
              {quickBookingMode === "call" ? "by phone" : "on WhatsApp"}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleQuickBookingSubmit} className="mt-4 space-y-4">
            <div className="rounded-2xl border border-border bg-muted/40 p-4">
              <div className="text-sm font-semibold text-foreground">Service</div>
              <p className="mt-1 text-sm text-muted-foreground">
                {quickBookingService?.name ?? "Selected service"}
              </p>
            </div>
            <label className="block text-sm font-medium">
              Full name
              <input
                value={quickBookingForm.customer_name}
                onChange={(event) =>
                  setQuickBookingForm((prev) => ({ ...prev, customer_name: event.target.value }))
                }
                className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3"
                required
              />
            </label>
            <label className="block text-sm font-medium">
              Phone
              <input
                value={quickBookingForm.customer_phone}
                onChange={(event) =>
                  setQuickBookingForm((prev) => ({ ...prev, customer_phone: event.target.value }))
                }
                className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3"
                required
              />
            </label>
            <label className="block text-sm font-medium">
              Email (optional)
              <input
                type="email"
                value={quickBookingForm.customer_email}
                onChange={(event) =>
                  setQuickBookingForm((prev) => ({ ...prev, customer_email: event.target.value }))
                }
                className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3"
              />
            </label>
            {quickBookingStatus.message ? (
              <p
                className={`text-sm ${quickBookingStatus.type === "success" ? "text-emerald-700" : "text-destructive"}`}
              >
                {quickBookingStatus.message}
              </p>
            ) : null}
            <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={resetQuickBookingDialog}
                className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingQuickBooking}
                className="rounded-full btn-gradient px-5 py-2.5 text-sm font-semibold disabled:pointer-events-none disabled:opacity-60"
              >
                {isSubmittingQuickBooking
                  ? "Saving..."
                  : `Continue to ${quickBookingMode === "call" ? "call" : "WhatsApp"}`}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={bookingDialogOpen}
        onOpenChange={(open) => (open ? setBookingDialogOpen(true) : resetBookingForm())}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Book a service</DialogTitle>
            <DialogDescription>
              Enter your appointment details and request a booking for this service.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 rounded-3xl border border-border bg-muted/40 p-4">
            <div className="grid grid-cols-3 gap-3 text-sm">
              {bookingSteps.map((step, index) => {
                const stepIndex = index + 1;
                const active = bookingStep === stepIndex;
                return (
                  <div
                    key={step.label}
                    className={`rounded-2xl border p-3 transition ${active ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground"}`}
                  >
                    <div className="text-xs font-semibold uppercase tracking-[0.25em]">
                      Step {stepIndex}
                    </div>
                    <div className="mt-2 font-medium">{step.label}</div>
                    <p className="mt-1 text-xs leading-snug">{step.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
          <form id="booking-form" onSubmit={handleSubmitBooking} className="mt-4 space-y-4">
            {bookingStep === 1 ? (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm font-medium">
                    Service
                    <input
                      value={bookingForm.service}
                      readOnly
                      className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3"
                    />
                  </label>
                  <label className="block text-sm font-medium">
                    Date of birth
                    <input
                      type="date"
                      value={bookingForm.date_of_birth}
                      onChange={(e) =>
                        setBookingForm((prev) => ({ ...prev, date_of_birth: e.target.value }))
                      }
                      className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3"
                      required
                    />
                  </label>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm font-medium">
                    Customer name
                    <input
                      value={bookingForm.customer_name}
                      onChange={(e) =>
                        setBookingForm((prev) => ({ ...prev, customer_name: e.target.value }))
                      }
                      className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3"
                      required
                    />
                  </label>
                  <label className="block text-sm font-medium">
                    Phone
                    <input
                      value={bookingForm.customer_phone}
                      onChange={(e) =>
                        setBookingForm((prev) => ({ ...prev, customer_phone: e.target.value }))
                      }
                      className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3"
                      required
                    />
                  </label>
                </div>
                <label className="block text-sm font-medium">
                  Email
                  <input
                    type="email"
                    value={bookingForm.customer_email}
                    onChange={(e) =>
                      setBookingForm((prev) => ({ ...prev, customer_email: e.target.value }))
                    }
                    className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3"
                  />
                </label>
              </div>
            ) : bookingStep === 2 ? (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-medium">
                    Appointment date
                    <input
                      type="date"
                      value={bookingForm.appointment_date}
                      onChange={(e) =>
                        setBookingForm((prev) => ({ ...prev, appointment_date: e.target.value }))
                      }
                      className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3"
                      required
                    />
                  </label>
                  <label className="block text-sm font-medium">
                    Appointment time
                    <input
                      type="time"
                      value={bookingForm.appointment_time}
                      onChange={(e) =>
                        setBookingForm((prev) => ({ ...prev, appointment_time: e.target.value }))
                      }
                      className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3"
                      required
                    />
                  </label>
                </div>
                <label className="block text-sm font-medium">
                  Notes
                  <textarea
                    value={bookingForm.notes}
                    onChange={(e) => setBookingForm((prev) => ({ ...prev, notes: e.target.value }))}
                    className="mt-2 min-h-24 w-full rounded-2xl border border-border bg-background px-4 py-3"
                  />
                </label>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl border border-border bg-background p-4">
                  <div className="text-sm font-semibold text-foreground">Service</div>
                  <p className="mt-2 text-sm text-muted-foreground">{bookingForm.service}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border bg-background p-4">
                    <div className="text-sm font-semibold text-foreground">Customer name</div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {bookingForm.customer_name || "Not provided"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border bg-background p-4">
                    <div className="text-sm font-semibold text-foreground">Phone</div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {bookingForm.customer_phone || "Not provided"}
                    </p>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border bg-background p-4">
                    <div className="text-sm font-semibold text-foreground">Email</div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {bookingForm.customer_email || "Not provided"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border bg-background p-4">
                    <div className="text-sm font-semibold text-foreground">Date of birth</div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {bookingForm.date_of_birth || "Not provided"}
                    </p>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border bg-background p-4">
                    <div className="text-sm font-semibold text-foreground">Appointment date</div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {bookingForm.appointment_date || "Not chosen"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border bg-background p-4">
                    <div className="text-sm font-semibold text-foreground">Appointment time</div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {bookingForm.appointment_time || "Not chosen"}
                    </p>
                  </div>
                </div>
                <div className="rounded-2xl border border-border bg-background p-4">
                  <div className="text-sm font-semibold text-foreground">Notes</div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {bookingForm.notes || "No additional notes"}
                  </p>
                </div>
              </div>
            )}

            {bookingStatus.message ? (
              <p
                className={`text-sm ${bookingStatus.type === "success" ? "text-emerald-700" : "text-destructive"}`}
              >
                {bookingStatus.message}
              </p>
            ) : null}
          </form>
          <DialogFooter className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={resetBookingForm}
              className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold"
            >
              Cancel
            </button>
            {bookingStep > 1 ? (
              <button
                type="button"
                onClick={goToPreviousStep}
                className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold"
              >
                Back
              </button>
            ) : null}
            <button
              type="submit"
              form="booking-form"
              disabled={!isCurrentStepValid}
              className={`rounded-full btn-gradient px-5 py-2.5 text-sm font-semibold ${!isCurrentStepValid ? "opacity-60 pointer-events-none" : ""}`}
            >
              {bookingStep < bookingSteps.length ? "Continue" : "Submit booking"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <section className="py-8 bg-muted/45">
        <div className="mx-auto max-w-5xl px-4 md:px-6">
          <Reveal>
            <div className="rounded-3xl border border-border bg-card p-6 shadow-elegant md:p-8">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                Need help choosing?
              </span>
              <h2 className="mt-4 font-display text-3xl md:text-4xl font-bold">
                Speak with our team about the right care option for you.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                From home visits to on-site consultations, our team can help you find the most
                convenient and supportive service for your needs.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <a
                  href="tel:0111121500"
                  className="inline-flex items-center gap-2 rounded-full btn-gradient px-5 py-2.5 text-sm font-semibold"
                >
                  <Phone className="h-4 w-4" />
                  Call 0111121500
                </a>
                <a
                  href="https://wa.me/254111121500"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-5 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary/20"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
