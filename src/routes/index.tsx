import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ShieldCheck,
  FlaskConical,
  Stethoscope,
  Wallet,
  Check,
  Phone,
  Mail,
  MapPin,
  Clock3,
  ArrowRight,
  Microscope,
  HeartPulse,
  Pill,
  Sparkles,
  MessageCircle,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { Counter } from "../components/site/Counter";
import { Reveal } from "../components/site/Reveal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { TestimonialsCarousel } from "../components/site/TestimonialsCarousel";
import { ServiceIcon } from "../components/site/ServiceIcon";
import pathwayLabLogo from "../assets/pathway.png";
import clip1 from "../assets/marketing2.mp4";
import clip2 from "../assets/marketing.mp4";
import {
  featuredProducts,
  homeVisitImage,
  partners,
  serviceCategories,
  whyChooseItems,
  deliveryHero,
  perfumeHero,
  skincareHero,
  medicineHero,
  labHero,
  officeHero,
} from "../lib/site-data";
import { formatServicePrice, formatServiceTat, type ServiceItem } from "../lib/services";
import { listServices } from "../lib/services.functions";
import { createBooking } from "../lib/bookings.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nuno Pharmacy | Premium Pharmacy & Laboratory" },
      {
        name: "description",
        content:
          "Nuno Pharmacy offers genuine medicines, certified laboratory testing, skincare, vitamins, perfumes and home healthcare services.",
      },
      { property: "og:title", content: "Nuno Pharmacy | Premium Pharmacy & Laboratory" },
      {
        property: "og:description",
        content:
          "Trusted healthcare, genuine medicines, reliable lab services and home sample collection.",
      },
    ],
  }),
  component: Index,
});

const whyIcons = [ShieldCheck, FlaskConical, Stethoscope, Wallet];
const featureIcons = [Microscope, Pill, HeartPulse, Sparkles];

function Index() {
  const heroSlides = [
    perfumeHero,
    labHero,
    medicineHero,
    skincareHero,
    homeVisitImage,
    deliveryHero,
  ];
  const marketingVideos = [clip1, clip2];
  const [activeSlide, setActiveSlide] = useState(0);
  const loadServicesFn = useServerFn(listServices);
  const bookServiceFn = useServerFn(createBooking);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [quickBookingOpen, setQuickBookingOpen] = useState(false);
  const [quickBookingMode, setQuickBookingMode] = useState<"call" | "whatsapp">("call");
  const [quickBookingService, setQuickBookingService] = useState("");
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

  const labServices = useMemo(() => services, [services]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroSlides.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [heroSlides.length]);

  useEffect(() => {
    let mounted = true;

    loadServicesFn()
      .then((rows) => {
        if (!mounted) return;
        setServices(Array.isArray(rows) ? (rows as ServiceItem[]) : []);
      })
      .catch(() => {
        // Keep the page usable even if service loading fails.
      });

    return () => {
      mounted = false;
    };
  }, [loadServicesFn]);

  const openQuickBookingDialog = (serviceName: string, mode: "call" | "whatsapp") => {
    setQuickBookingService(serviceName);
    setQuickBookingMode(mode);
    setQuickBookingForm({ customer_name: "", customer_phone: "", customer_email: "" });
    setQuickBookingStatus({ type: "idle", message: "" });
    setQuickBookingOpen(true);
  };

  const resetQuickBookingDialog = () => {
    setQuickBookingOpen(false);
    setQuickBookingService("");
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
          service: quickBookingService,
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
          ? "tel:0111121500"
          : `https://wa.me/254111121500?text=${encodeURIComponent(
              `Hello Nuno Pharmacy, I would like to book the ${quickBookingService} service. My name is ${quickBookingForm.customer_name.trim()} and my phone number is ${quickBookingForm.customer_phone.trim()}.`,
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

  return (
    <>
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
                {quickBookingService || "Selected service"}
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

      <section className="relative overflow-hidden border-b border-border bg-[linear-gradient(180deg,color-mix(in_oklab,var(--primary)_5%,var(--background)),var(--background))]">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,color-mix(in_oklab,var(--foreground)_48%,transparent),color-mix(in_oklab,var(--foreground)_12%,transparent))]" />
        <img
          src={medicineHero}
          alt="Modern pharmacy laboratory interior"
          className="absolute inset-0 h-full w-full object-cover mix-blend-multiply opacity-40"
          width={1600}
          height={800}
        />
        <div className="relative mx-auto grid min-h-[36vh] max-w-7xl items-center gap-8 px-4 py-8 md:min-h-[30vh] md:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:py-10">
          <Reveal className="text-primary-foreground">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#2BB673]/20 bg-[#EAF9F2] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#2BB673]">
              Trusted Pharmacy Care
            </span>
            <h1 className="mt-5 font-display text-4xl font-bold leading-[0.95] text-foreground md:text-6xl text-white">
              Welness Starts Here
            </h1>
            <p className="mt-4 max-w-2xl text-lg font-medium  md:text-xl text-white">
              Genuine medicines, professional pharmaceutical care, laboratory services, skincare
              products, vitamins, and wellness solutions—all in one trusted pharmacy.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/shop"
                  className="rounded-full bg-[#2BB673] px-7 py-3.5 text-sm font-display font-semibold text-white shadow-elegant transition-transform hover:-translate-y-0.5 hover:bg-[#249e63]"
                >
                  Shop Medicines
                </Link>
                <Link
                  to="/services"
                  className="rounded-full border border-[#2BB673]/25 bg-white/90 px-7 py-3.5 text-sm font-display font-semibold text-[#2BB673] backdrop-blur-sm transition-colors hover:bg-white"
                >
                  Book a Lab Test
                </Link>
                <Link
                  to="/contact"
                  className="rounded-full border border-[#2BB673]/25 bg-[#EAF9F2] px-7 py-3.5 text-sm font-display font-semibold text-[#2BB673] transition-colors hover:bg-[#d9f1e7]"
                >
                  Contact Pharmacist
                </Link>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {[
                "Genuine Medicines",
                "Licensed Pharmacists",
                "Certified Laboratory",
                "Fast Prescription Service",
              ].map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-[#2BB673]/15 bg-white px-3 py-2 text-xs font-semibold text-[#2BB673] shadow-sm"
                >
                  {badge}
                </span>
              ))}
            </div>
            <div className="mt-10 grid max-w-2xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[["500+", "Medicines Available"]].map(([value, label]) => (
                <div
                  key={label}
                  className="rounded-[var(--radius-xl)] border border-border bg-muted/20 px-5 py-4 shadow-soft"
                >
                  <div className="text-2xl font-display font-bold text-white/70">{value}</div>
                  <div className="mt-1 text-sm text-muted-white">{label}</div>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={120} className="relative lg:justify-self-end">
            <div className="relative overflow-hidden rounded-[calc(var(--radius-3xl)+8px)] border border-primary-foreground/15 bg-primary-foreground/8 p-3 backdrop-blur-sm shadow-elegant">
              <img
                src={heroSlides[activeSlide]}
                alt="Nuno Pharmacy highlights"
                className="aspect-[5/4] w-full rounded-[calc(var(--radius-3xl))] object-cover transition-all duration-500"
                width={1280}
                height={1600}
              />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/70 to-transparent p-3">
                <button
                  type="button"
                  onClick={() =>
                    setActiveSlide(
                      (current) => (current - 1 + heroSlides.length) % heroSlides.length,
                    )
                  }
                  className="rounded-full border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-white backdrop-blur"
                >
                  Prev
                </button>
                <div className="flex items-center gap-2">
                  {heroSlides.map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setActiveSlide(index)}
                      className={`h-2.5 rounded-full transition-all ${index === activeSlide ? "w-6 bg-white" : "w-2.5 bg-white/60"}`}
                      aria-label={`Show slide ${index + 1}`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSlide((current) => (current + 1) % heroSlides.length)}
                  className="rounded-full border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-white backdrop-blur"
                >
                  Next
                </button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section-pad bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <Reveal>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                  Promotional Video
                </span>
              </div>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {marketingVideos.map((video, index) => (
                <div
                  key={video}
                  className="overflow-hidden rounded-[var(--radius-3xl)] border border-border bg-card shadow-soft"
                >
                  <video
                    className="aspect-video h-56 w-full object-cover md:h-64"
                    src={video}
                    autoPlay
                    muted
                    loop
                    playsInline
                    controls
                  />
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section-pad">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <Reveal>
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                Why Choose Nuno Pharmacy
              </span>
              <h2 className="mt-5 font-display text-3xl font-bold leading-tight tracking-[-0.02em] text-foreground sm:text-4xl md:text-5xl">
                Professional care with premium standards
              </h2>
            </div>
          </Reveal>
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {whyChooseItems.map((item, index) => {
              const Icon = whyIcons[index];
              return (
                <Reveal key={item.title} delay={index * 80}>
                  <Link
                    to={item.href}
                    className="block h-full rounded-[var(--radius-2xl)] border border-border bg-card p-6 shadow-soft card-lift transition-colors hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  >
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="mt-5 font-display text-xl font-semibold">{item.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section-pad bg-muted/45">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <Reveal>
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <span className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-gold">
                  Our Services
                </span>
                <h2 className="mt-5 font-display text-3xl font-bold leading-tight tracking-[-0.02em] text-foreground sm:text-4xl md:text-5xl">
                  Healthcare solutions across every need
                </h2>
              </div>
              <p className="max-w-xl text-muted-foreground">
                Clean processes, professional guidance and carefully curated products for daily
                health and specialist care.
              </p>
            </div>
          </Reveal>

          <Reveal>
            <div className="mt-6 flex flex-wrap items-center gap-4 rounded-[var(--radius-2xl)] border border-primary/20 bg-primary/5 p-4 shadow-soft">
              <img
                src={pathwayLabLogo}
                alt="Pathway Lab logo"
                className="h-14 w-14 rounded-full border border-border bg-white p-1"
              />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  World-class medical laboratory service
                </p>
                <p>
                  For <span className="text-red-600">you</span> and your{" "}
                  <span className="text-red-600">loved</span> ones
                </p>
                <p className="text-sm text-muted-foreground">Inside nuno pharmacy.</p>
              </div>
            </div>
          </Reveal>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {serviceCategories.map((service, index) => (
              <Reveal key={service.title} delay={index * 70}>
                <article
                  className={`overflow-hidden rounded-[var(--radius-2xl)] border border-border bg-card shadow-soft ${index === 0 ? "lg:col-span-2 lg:grid lg:grid-cols-[1.05fr_0.95fr]" : ""}`}
                >
                  <img
                    src={service.image}
                    alt={service.title}
                    className={`w-full object-cover ${index === 0 ? "h-full min-h-[320px]" : "aspect-[16/10]"}`}
                    loading="lazy"
                    width={1280}
                    height={960}
                  />
                  <div className="p-6 md:p-8">
                    <div className="flex items-center gap-3 text-primary">
                      {featureIcons[index]
                        ? (() => {
                            const Icon = featureIcons[index];
                            return <Icon className="h-5 w-5" />;
                          })()
                        : null}
                      <span className="text-sm font-semibold uppercase tracking-wider">
                        Premium service
                      </span>
                    </div>
                    <h3 className="mt-4 font-display text-2xl font-bold">{service.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {service.description.split("\n")[0]}
                    </p>
                    <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                      {service.points.map((point) => (
                        <li key={point} className="flex gap-2 text-sm text-foreground/85">
                          <Check className="mt-0.5 h-4 w-4 text-primary" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                    <Link
                      to={service.href}
                      className="mt-8 inline-flex items-center gap-2 rounded-full btn-gradient px-6 py-3 text-sm font-display font-semibold"
                    >
                      {service.cta}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                   
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad">
        <div className="mx-auto max-w-7xl px-4 md:px-8 grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <Reveal>
            <div className="overflow-hidden rounded-[var(--radius-3xl)] border border-border bg-card p-3 shadow-elegant">
              <img
                src={officeHero}
                alt="Professional laboratory services"
                className="aspect-[4/3] w-full rounded-[calc(var(--radius-3xl)-6px)] object-cover"
                loading="lazy"
                width={1600}
                height={1200}
              />
            </div>
          </Reveal>
          <Reveal delay={80}>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
              Laboratory Services
            </span>
            <h2 className="mt-5 font-display text-3xl font-bold leading-tight tracking-[-0.02em] text-foreground sm:text-4xl md:text-5xl">
              Professional Laboratory Services
            </h2>
            <div className="mt-7 grid gap-6 sm:grid-cols-2">
              {labServices.length === 0 ? (
                <div className="rounded-2xl border border-border bg-muted/40 p-6 text-sm text-muted-foreground">
                  Loading laboratory services from the database...
                </div>
              ) : (
                labServices.map((service) => (
                  <div
                    key={service.id}
                    className="flex h-full flex-col rounded-2xl border border-border bg-muted/40 p-6 text-sm"
                  >
                    <div className="mb-3 flex items-center gap-3 text-primary">
                      <ServiceIcon iconUrl={service.icon_url} alt={service.name} size="sm" />
                      <span className="font-semibold uppercase tracking-wider">{service.name}</span>
                    </div>
                    <p className="text-muted-foreground">
                      {formatServicePrice(service.price_kes)} · TAT {formatServiceTat(service.duration_minutes)}
                    </p>
                  </div>
                ))
              )}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/services"
                className="inline-flex items-center justify-center rounded-full btn-gradient px-7 py-3.5 text-sm font-display font-semibold"
              >
                Book Appointment
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section-pad bg-muted/45">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <Reveal>
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-gold">
                Featured Products
              </span>
              <h2 className="mt-5 font-display text-3xl font-bold leading-tight tracking-[-0.02em] text-foreground sm:text-4xl md:text-5xl">
                Curated essentials for wellness and lifestyle
              </h2>
            </div>
          </Reveal>
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {featuredProducts.map((product, index) => (
              <Reveal key={product.title} delay={index * 70}>
                <article className="overflow-hidden rounded-[var(--radius-2xl)] border border-border bg-card shadow-soft card-lift">
                  <img
                    src={product.image}
                    alt={product.title}
                    className="aspect-[4/3] w-full object-cover"
                    loading="lazy"
                    width={1280}
                    height={960}
                  />
                  <div className="p-6">
                    <h3 className="font-display text-xl font-semibold">{product.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {product.description}
                    </p>
                    <Link
                      to={product.href}
                      className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-2.5 text-sm font-semibold hover:border-primary hover:text-primary"
                    >
                      Shop Now
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <Reveal>
            <div className="grid gap-8 overflow-hidden rounded-[var(--radius-3xl)] border border-border bg-[linear-gradient(135deg,color-mix(in_oklab,var(--primary)_92%,var(--primary-dark)),color-mix(in_oklab,var(--gold)_70%,var(--primary)))] p-8 text-primary-foreground shadow-elegant lg:grid-cols-[1.05fr_0.95fr] lg:items-center md:p-10">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider">
                  Home Sample Collection
                </span>
                <h2 className="mt-5 font-display text-4xl font-bold leading-[1.02] tracking-[-0.02em] text-primary-foreground sm:text-5xl">
                  Can't Visit Us? We Come To You.
                </h2>
                <p className="mt-5 max-w-xl text-base leading-relaxed text-primary-foreground/82 md:text-lg">
                  Professional home and office sample collection services delivered safely and
                  conveniently by trained personnel.
                </p>
                <Link
                  to="/home-services"
                  className="mt-8 inline-flex rounded-full bg-primary-foreground px-7 py-3.5 text-sm font-display font-semibold text-foreground shadow-soft"
                >
                  Schedule Visit
                </Link>
              </div>
              <img
                src={homeVisitImage}
                alt="Medical personnel visiting a patient at home"
                className="aspect-[16/10] w-full rounded-[var(--radius-2xl)] object-cover"
                loading="lazy"
                width={1600}
                height={1024}
              />
            </div>
          </Reveal>
        </div>
      </section>

      <TestimonialsCarousel />

      <section className="section-pad">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {[
              {
                value: (
                  <>
                    <Counter to={10000} suffix="+" />
                  </>
                ),
                label: "Satisfied Customers",
              },
              {
                value: (
                  <>
                    <Counter to={98} suffix="%" />
                  </>
                ),
                label: "Customer Satisfaction",
              },
            ].map((stat, index) => (
              <Reveal key={stat.label} delay={index * 60}>
                <div className="rounded-[var(--radius-2xl)] border border-border bg-card p-7 text-center shadow-soft card-lift">
                  <div className="font-display text-4xl font-bold text-gradient">{stat.value}</div>
                  <div className="mt-3 text-sm font-medium text-muted-foreground">{stat.label}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* <section className="section-pad bg-muted/45">
        <div className="mx-auto max-w-7xl px-4 md:px-8 text-center">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
              Trusted Partners
            </span>
            <h2 className="mt-5 font-display text-3xl font-bold leading-tight tracking-[-0.02em] text-foreground sm:text-4xl md:text-5xl">Recognized suppliers and healthcare partners</h2>
          </Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {partners.map((partner, index) => (
              <Reveal key={partner} delay={index * 50}>
                <div className="rounded-[var(--radius-xl)] border border-border bg-card px-5 py-5 font-display text-lg font-semibold shadow-soft">
                  {partner}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section> */}

      <section className="section-pad">
        <div className="mx-auto max-w-7xl px-4 md:px-8 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <Reveal>
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-gold">
                Contact
              </span>
              <h2 className="mt-5 font-display text-3xl font-bold leading-tight tracking-[-0.02em] text-foreground sm:text-4xl md:text-5xl">
                Visit or speak with our team
              </h2>
              <p className="mt-5 text-muted-foreground leading-relaxed">
                Reach us for laboratory appointments, medicine inquiries, home visits or general
                healthcare support.
              </p>
              <div className="mt-8 grid gap-4">
                {[
                  [Phone, "Phone", "0703244711"],
                  [Mail, "Email", "nunopharmaceutical@gmail.com"],
                  [MapPin, "Location", "Nairobi, South C, off Popo Road, opposite Midad Academy"],
                  [Clock3, "Business Hours(Monday-Saturday)", "Mon–Sun · 08:00 — 22:00"],
                ].map(([Icon, label, value]) => {
                  const Cmp = Icon as typeof Phone;
                  return (
                    <div
                      key={label as string}
                      className="flex gap-4 rounded-[var(--radius-xl)] border border-border bg-card px-5 py-4 shadow-soft"
                    >
                      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                        <Cmp className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-muted-foreground">
                          {label as string}
                        </div>
                        <div className="mt-1 font-medium">{value as string}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div className="overflow-hidden rounded-[var(--radius-3xl)] border border-border bg-card shadow-elegant">
              <iframe
                title="Nuno Pharmacy location"
                src="https://www.google.com/maps?q=Kenya%20Nairobi%20South%20C%20opposite%20Midad%20Academy%20off%20Popo%20Road&z=15&output=embed"
                className="h-[420px] w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
