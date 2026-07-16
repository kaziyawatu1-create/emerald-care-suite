import { createFileRoute } from "@tanstack/react-router";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  Headset,
  Package,
  Phone,
  MessageCircle,
  Search,
} from "lucide-react";
import pathwayLabLogo from "../assets/pathway.png";
import { PageHeader } from "../components/site/PageHeader";
import { Reveal } from "../components/site/Reveal";
import { ServiceIcon } from "../components/site/ServiceIcon";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import { formatServicePrice, formatServiceTat, readServices, type ServiceItem } from "../lib/services";
import { listServiceCategories, listServices, type ServiceCategoryItem } from "../lib/services.functions";
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
  const loadServiceCategoriesFn = useServerFn(listServiceCategories);
  const bookServiceFn = useServerFn(createBooking);
  const [services, setServices] = useState<ServiceItem[]>(() => readServices());
  const [serviceCategories, setServiceCategories] = useState<ServiceCategoryItem[]>([]);
  const [serviceSearchQuery, setServiceSearchQuery] = useState("");
  const [activeCategoryTab, setActiveCategoryTab] = useState("all");
  const [servicesPage, setServicesPage] = useState(1);
  const servicesPerPage = 6;
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

    loadServiceCategoriesFn()
      .then((rows) => {
        if (!mounted) return;
        setServiceCategories(Array.isArray(rows) ? (rows as ServiceCategoryItem[]) : []);
      })
      .catch(() => {
        if (mounted) {
          setServiceCategories([]);
        }
      });

    return () => {
      mounted = false;
    };
  }, [loadServiceCategoriesFn, loadServicesFn]);

  useEffect(() => {
    setServicesPage(1);
  }, [serviceSearchQuery, activeCategoryTab]);

  const categoryTabs = useMemo(() => {
    const tabs = [{ id: "all", name: "All services" }];

    for (const category of serviceCategories) {
      tabs.push({ id: category.id, name: category.name });
    }

    return tabs;
  }, [serviceCategories]);

  const filteredServices = useMemo(() => {
    const query = serviceSearchQuery.trim().toLowerCase();

    return services.filter((service) => {
      const matchesSearch = !query || service.name.toLowerCase().includes(query);
      const matchesCategory =
        activeCategoryTab === "all"
          ? service.service_category_id != null
          : service.service_category_id === activeCategoryTab;

      return matchesSearch && matchesCategory;
    });
  }, [activeCategoryTab, serviceSearchQuery, services]);

  const totalPages = Math.max(1, Math.ceil(filteredServices.length / servicesPerPage));
  const paginatedServices = useMemo(() => {
    const startIndex = (servicesPage - 1) * servicesPerPage;
    return filteredServices.slice(startIndex, startIndex + servicesPerPage);
  }, [filteredServices, servicesPage]);

  const groupedServices = useMemo(() => {
    const grouped = new Map<string, ServiceItem[]>();

    for (const service of paginatedServices) {
      const categoryName =
        serviceCategories.find((category) => category.id === service.service_category_id)?.name ??
        "Uncategorized";
      const nextGroup = grouped.get(categoryName) ?? [];
      nextGroup.push(service);
      grouped.set(categoryName, nextGroup);
    }

    return Array.from(grouped.entries()).sort(([left], [right]) => left.localeCompare(right));
  }, [paginatedServices, serviceCategories]);

  const hasMorePages = servicesPage < totalPages;

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
          booking_type: "office",
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
        title="Reliable laboratory diagnostics with professional care"
        subtitle="Committed to providing accurate and affordable medical laboratory services at your comfort zone-from in house diagnostics to home and office sample collection and delivery."
      />

      <section className="py-8">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="mb-6 grid gap-4 md:grid-cols-2">
            <Reveal>
              <article className="flex h-full items-center gap-4 rounded-[var(--radius-2xl)] border border-primary/20 bg-primary/5 p-5 shadow-soft card-lift">
                <img
                  src={pathwayLabLogo}
                  alt="Pathway Lab logo"
                  className="h-16 w-16 shrink-0 rounded-2xl border border-border bg-white object-contain p-1.5"
                />
                <div>
                  <p className="font-display text-lg font-semibold text-foreground">
                    Collaborating with Pathway Lab
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    Trusted diagnostics, professional sample handling and coordinated laboratory
                    support inside Nuno Pharmacy.
                  </p>
                </div>
              </article>
            </Reveal>
            <Reveal delay={80}>
              <article className="flex h-full items-center gap-4 rounded-[var(--radius-2xl)] border border-[#2BB673]/25 bg-[#EAF9F2] p-5 shadow-soft card-lift">
                <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-[#2BB673]/15 text-[#2BB673]">
                  <Headset className="h-8 w-8" />
                </div>
                <div>
                  <p className="font-display text-lg font-semibold text-foreground">24/7 Support</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    Our care team is available around the clock for bookings, guidance and urgent
                    pharmacy inquiries.
                  </p>
                  <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-[#2BB673]">
                    <Clock3 className="h-4 w-4" />
                    Always available · Call 0703244711
                  </p>
                </div>
              </article>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="pb-8">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={serviceSearchQuery}
                onChange={(event) => setServiceSearchQuery(event.target.value)}
                placeholder="Search services by name"
                aria-label="Search services by name"
                className="w-full rounded-full border border-border bg-background py-2.5 pl-9 pr-4 text-sm outline-none transition focus:border-primary"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Showing {filteredServices.length} service{filteredServices.length === 1 ? "" : "s"}
            </p>
          </div>

          <Tabs
            value={activeCategoryTab}
            onValueChange={(value) => setActiveCategoryTab(value)}
            className="mb-6"
          >
            <TabsList className="flex h-auto flex-wrap justify-start gap-2 rounded-[var(--radius-2xl)] bg-background p-2">
              {categoryTabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="rounded-full px-4 py-2 text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  {tab.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {groupedServices.length === 0 ? (
            <div className="rounded-[var(--radius-2xl)] border border-dashed border-border bg-card px-6 py-10 text-center text-sm text-muted-foreground">
              No services match your search.
            </div>
          ) : (
            groupedServices.map(([categoryName, categoryServices]) => (
              <div key={categoryName} className="mb-8">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h3 className="font-display text-xl font-semibold text-foreground">{categoryName}</h3>
                  <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    {categoryServices.length} service{categoryServices.length === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="grid gap-3 lg:grid-cols-3">
                  {categoryServices.map((service, index) => (
                    <Reveal key={service.id} delay={index * 35}>
                      <article className="rounded-2xl border border-border bg-card p-4 shadow-soft card-lift">
                        <div className="flex items-start justify-between gap-3">
                          <ServiceIcon iconUrl={service.icon_url} alt={service.name} />
                          <button
                            type="button"
                            onClick={() => setSelectedService(service)}
                            className="rounded-full border border-border p-2 text-muted-foreground transition hover:border-primary hover:text-primary"
                            aria-label={`View details for ${service.name}`}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                        <h2 className="mt-4 font-display text-lg font-semibold">{service.name}</h2>
                        <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                          <div>
                            <span className="font-semibold text-foreground">Price:</span>{" "}
                            {formatServicePrice(service.price_kes)}
                          </div>
                          <div>
                            <span className="font-semibold text-foreground">TAT:</span>{" "}
                            {formatServiceTat(service.duration_minutes)}
                          </div>
                        </div>
                        <div className="mt-4 flex flex-wrap items-center gap-2">
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
            ))
          )}

          <div className="mt-6 flex flex-col gap-3 rounded-[var(--radius-2xl)] border border-border bg-card px-4 py-4 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-muted-foreground">
              Page {servicesPage} of {totalPages}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setServicesPage((current) => Math.max(current - 1, 1))}
                disabled={servicesPage === 1}
                className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-2 text-sm font-semibold text-foreground transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              <button
                type="button"
                onClick={() => setServicesPage((current) => Math.min(current + 1, totalPages))}
                disabled={!hasMorePages}
                className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-3 py-2 text-sm font-semibold text-primary transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                Load more
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-8">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <Reveal>
            <article className="rounded-[var(--radius-3xl)] border border-border bg-card p-6 shadow-soft card-lift md:p-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="flex gap-4">
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                    <Package className="h-7 w-7" />
                  </div>
                  <div className="max-w-2xl">
                    <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                      Wellness Packages
                    </span>
                    <h2 className="mt-3 font-display text-2xl font-bold text-foreground md:text-3xl">
                      We also offer various service packages
                    </h2>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
                      Explore comprehensive wellness and health check packages designed for early
                      detection and proactive care — from full body checks to specialized panels for
                      every stage of life.
                    </p>
                  </div>
                </div>
                <a
                  href="https://www.pathcarekenya.com/wellness-packages/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full btn-gradient px-6 py-3 text-sm font-display font-semibold"
                >
                  Read more
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </article>
          </Reveal>
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
            <div className="mt-4 space-y-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                <ServiceIcon iconUrl={selectedService.icon_url} alt={selectedService.name} size="lg" />
                <div>
                  <p className="font-semibold text-foreground">{selectedService.name}</p>
                  <p className="mt-1">{formatServicePrice(selectedService.price_kes)} · TAT {formatServiceTat(selectedService.duration_minutes)}</p>
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
