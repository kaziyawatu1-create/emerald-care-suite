import { createFileRoute, Link } from "@tanstack/react-router";
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
  ChevronLeft,
  ChevronRight,
  Microscope,
  HeartPulse,
  Pill,
  Sparkles,
  ShoppingCart,
} from "lucide-react";
import { Counter } from "../components/site/Counter";
import { Reveal } from "../components/site/Reveal";
import { TestimonialsCarousel } from "../components/site/TestimonialsCarousel";
import pathcareLogo from "../assets/pathcare-logo.svg";
import { useEffect, useState, type FormEvent } from "react";
import {
  featuredProducts,
  homeVisitImage,
  labWideImage,
  partners,
  serviceCategories,
  whyChooseItems,
  shopWideImage
} from "../lib/site-data";
import hero1 from "../assets/medix.png"
import hero3 from "../assets/skincare11.png"
import hero6 from "../assets/perfumes1.png"
import hero from "../assets/hero-pharmacist.jpg"

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
const heroSlides = [
  { image: hero1, title: "All sorts of medication", subtitle: "Clean formulations and everyday wellness for every routine." },
  { image: hero3, title: "Skin care products", subtitle: "Elegant fragrances for every occasion and personal style." },
  { image: hero6, title: "Premium fragrances", subtitle: "Elegant fragrances for every occasion and personal style." },
  {}
];
const heroAccentWords = ["Wellness", "Care", "Balance", "Vitality"];

function Index() {
  const [bookingForm, setBookingForm] = useState({
    name: "",
    locationType: "In House",
    preferredDate: "",
    contact: "",
    pinLocation: "",
    testType: "Rapid HIV Testing",
  });
  const [bookingStatus, setBookingStatus] = useState<{ type: "idle" | "success" | "error"; message: string }>({
    type: "idle",
    message: "",
  });
  const [isBookingSubmitting, setIsBookingSubmitting] = useState(false);
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);
  const [activeHeroWord, setActiveHeroWord] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveHeroSlide((current) => (current + 1) % heroSlides.length);
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveHeroWord((current) => (current + 1) % heroAccentWords.length);
    }, 2600);

    return () => window.clearInterval(intervalId);
  }, []);

  const goToNextSlide = () => {
    setActiveHeroSlide((current) => (current + 1) % heroSlides.length);
  };

  const goToPreviousSlide = () => {
    setActiveHeroSlide((current) => (current - 1 + heroSlides.length) % heroSlides.length);
  };

  const handleBookingSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!bookingForm.name || !bookingForm.contact || !bookingForm.preferredDate || !bookingForm.pinLocation) {
      setBookingStatus({ type: "error", message: "Please complete all required fields to request a booking." });
      return;
    }

    setIsBookingSubmitting(true);
    setBookingStatus({ type: "idle", message: "" });

    try {
      const response = await fetch("/api/public/book-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingForm),
      });

      const data = await response.json().catch(() => ({ success: false, message: "Unable to send your booking request right now." }));

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to send your booking request right now.");
      }

      setBookingStatus({
        type: "success",
        message: `Thank you ${bookingForm.name}. We have sent your booking request and will contact you shortly.`,
      });
      setBookingForm({
        name: "",
        locationType: "In House",
        preferredDate: "",
        contact: "",
        pinLocation: "",
        testType: "Rapid HIV Testing",
      });
    } catch (error) {
      setBookingStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to send your booking request right now.",
      });
    } finally {
      setIsBookingSubmitting(false);
    }
  };

  return (
    <>
      <section className="w-screen bg-slate-50">
        <div className="relative w-full overflow-hidden">
          <div className="mx-auto grid w-full grid-cols-1 overflow-hidden border border-border/60 bg-card shadow-elegant lg:grid-cols-[0.95fr_1.05fr]">
            <div className="flex h-full flex-col justify-center bg-gradient-to-br from-primary/10 via-background to-gold/10 p-8 md:p-10 lg:p-12">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                Wellness starts here
              </span>
              <h1 className="mt-6 font-display text-3xl font-bold leading-tight text-foreground md:text-4xl lg:text-5xl">
                <span key={heroAccentWords[activeHeroWord]} className="block text-primary transition-all duration-700 ease-out">
                  {heroAccentWords[activeHeroWord]}
                </span>
                <span className="mt-2 block text-foreground/90">for every visit, every routine, and every moment of care.</span>
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
                Discover trusted medicines, professional lab support, skincare essentials, and home care delivered with premium care.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/shop"
                  className="group inline-flex items-center gap-2 rounded-full bg-[#0f2a4a] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(15,42,74,0.28)] transition-all duration-300 hover:-translate-y-1 hover:scale-[1.03] hover:bg-[#132f5a]"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Shop Now
                </Link>
                <Link to="/#book-a-test" className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[0_10px_30px_rgba(16,185,129,0.28)] transition-colors duration-300 hover:bg-primary/90">
                  <Stethoscope className="h-4 w-4" />
                  Book a Test
                </Link>
              </div>
            </div>

            <div className="relative h-96 w-full md:h-[400px] lg:h-full">
              {[
                { img: hero1, alt: "Premium skincare essentials" },
                { img: hero3, alt: "Premium skincare essentials" },
                { img: hero6, alt: "Premium fragrances" },
              ].map((item, index) => (
                <img
                  key={index}
                  src={item.img}
                  alt={item.alt}
                  className={`absolute inset-0 h-full w-full object-cover object-center bg-slate-100 transition-all duration-700 ease-out ${
                    index === activeHeroSlide ? "opacity-100 scale-100" : "opacity-0 scale-105"
                  }`}
                  loading="lazy"
                  width={1000}
                  height={400}
                />
              ))}

              <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-3 sm:px-4">
                <button
                  type="button"
                  onClick={goToPreviousSlide}
                  className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-slate-950/70 text-white shadow-lg backdrop-blur-sm transition hover:scale-105 hover:bg-slate-950/85"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={goToNextSlide}
                  className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-slate-950/70 text-white shadow-lg backdrop-blur-sm transition hover:scale-105 hover:bg-slate-950/85"
                  aria-label="Next slide"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
                {[
                  { img: hero1, alt: "Trusted pharmacy care" },
                  { img: hero3, alt: "Premium skincare essentials" },
                  { img: hero6, alt: "Premium fragrances" },
                ].map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveHeroSlide(index)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === activeHeroSlide ? "w-8 bg-white" : "w-2 bg-white/50 hover:bg-white/75"
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-pad">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <Reveal>
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                Why Choose Nuno Pharmacy
              </span>
              <h2 className="mt-5 font-display text-3xl md:text-5xl font-bold">Professional care with premium standards</h2>
            </div>
          </Reveal>
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {whyChooseItems.map((item, index) => {
              const Icon = whyIcons[index];
              return (
                <Reveal key={item.title} delay={index * 80}>
                  <article className="h-full rounded-[var(--radius-2xl)] border border-border bg-card p-6 shadow-soft card-lift">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="mt-5 font-display text-xl font-semibold">{item.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                  </article>
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
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-gold">
                    Our Services
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                    <img src={pathcareLogo} alt="PathCare" className="h-4 w-4 object-contain" loading="lazy" />
                    Collaboration with PathCare Lab Services
                  </span>
                </div>
                <h2 className="mt-5 font-display text-3xl md:text-5xl font-bold">Healthcare solutions across every need</h2>
              </div>
              <p className="max-w-xl text-muted-foreground">
                Clean processes, professional guidance and carefully curated products for daily health and specialist care.
              </p>
            </div>
          </Reveal>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {serviceCategories.map((service, index) => (
              <Reveal key={service.title} delay={index * 70}>
                <article className={`overflow-hidden rounded-[var(--radius-2xl)] border border-border bg-card shadow-soft ${index === 0 ? "lg:col-span-2 lg:grid lg:grid-cols-[1.05fr_0.95fr]" : ""}`}>
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
                      {featureIcons[index] ? (() => {
                        const Icon = featureIcons[index];
                        return <Icon className="h-5 w-5" />;
                      })() : null}
                      <span className="text-sm font-semibold uppercase tracking-wider">Premium service</span>
                    </div>
                    {service.title === "Laboratory Services" ? (
                      <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                        <img src={pathcareLogo} alt="PathCare" className="h-4 w-4 object-contain" loading="lazy" />
                        <span>PathCare collaborator</span>
                      </div>
                    ) : null}
                    <h3 className="mt-4 font-display text-2xl font-bold">{service.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{service.description}</p>
                    {service.title === "Laboratory Services" ? (
                      <p className="mt-3 text-sm text-primary/90">
                        These services are coordinated through our PathCare partnership and are not directly offered by Nuno Pharmacy.
                      </p>
                    ) : null}
                    <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                      {service.points.map((point) => (
                        <li key={point} className="flex gap-2 text-sm text-foreground/85">
                          <Check className="mt-0.5 h-4 w-4 text-primary" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                    <Link to={service.href} className="mt-8 inline-flex items-center gap-2 rounded-full btn-gradient px-6 py-3 text-sm font-display font-semibold">
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

      <section id="book-a-test" className="section-pad">
        <div className="mx-auto max-w-7xl px-4 md:px-8 grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <Reveal>
            <div className="rounded-[var(--radius-3xl)] border border-border bg-card p-8 shadow-elegant">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                Book a Test
              </span>
              <h2 className="mt-5 font-display text-3xl md:text-4xl font-bold">Request your lab test in minutes</h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Choose your preferred location, date, and test type. We will confirm your booking and share the next steps.
              </p>
              <form onSubmit={handleBookingSubmit} className="mt-6 grid gap-4">
                <input
                  value={bookingForm.name}
                  onChange={(event) => setBookingForm((current) => ({ ...current, name: event.target.value }))}
                  className="rounded-[var(--radius-xl)] border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                  placeholder="Full name"
                  aria-label="Full name"
                  required
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <select
                    value={bookingForm.locationType}
                    onChange={(event) => setBookingForm((current) => ({ ...current, locationType: event.target.value }))}
                    className="rounded-[var(--radius-xl)] border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                    aria-label="Service location"
                  >
                    <option>In House</option>
                    <option>Home</option>
                    <option>Office</option>
                  </select>
                  <input
                    type="date"
                    value={bookingForm.preferredDate}
                    onChange={(event) => setBookingForm((current) => ({ ...current, preferredDate: event.target.value }))}
                    className="rounded-[var(--radius-xl)] border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                    aria-label="Preferred date"
                    required
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    value={bookingForm.contact}
                    onChange={(event) => setBookingForm((current) => ({ ...current, contact: event.target.value }))}
                    className="rounded-[var(--radius-xl)] border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                    placeholder="Phone or email"
                    aria-label="Contact"
                    required
                  />
                  <select
                    value={bookingForm.testType}
                    onChange={(event) => setBookingForm((current) => ({ ...current, testType: event.target.value }))}
                    className="rounded-[var(--radius-xl)] border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                    aria-label="Type of test"
                  >
                    <option>Rapid HIV Testing</option>
                    <option>Blood Sugar Test</option>
                    <option>Malaria Testing</option>
                    <option>H. pylori Test</option>
                    <option>Blood Grouping</option>
                    <option>Home Sample Collection</option>
                    <option>Office Sample Collection</option>
                  </select>
                </div>
                <textarea
                  value={bookingForm.pinLocation}
                  onChange={(event) => setBookingForm((current) => ({ ...current, pinLocation: event.target.value }))}
                  className="min-h-24 rounded-[var(--radius-xl)] border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                  placeholder="Pin or location details"
                  aria-label="Pin or location details"
                  required
                />
                {bookingStatus.message ? (
                  <p className={`text-sm ${bookingStatus.type === "success" ? "text-emerald-600" : "text-red-600"}`}>
                    {bookingStatus.message}
                  </p>
                ) : null}
                <button
                  type="submit"
                  disabled={isBookingSubmitting}
                  className="inline-flex w-fit items-center gap-2 rounded-full btn-gradient px-6 py-3 text-sm font-display font-semibold disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isBookingSubmitting ? "Submitting..." : "Request Booking"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <div className="overflow-hidden rounded-[var(--radius-3xl)] border border-border bg-card p-3 shadow-elegant">
              <img
                src={labWideImage}
                alt="Professional laboratory services"
                className="aspect-[4/3] w-full rounded-[calc(var(--radius-3xl)-6px)] object-cover"
                loading="lazy"
                width={1600}
                height={1200}
              />
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section-pad">
        <div className="mx-auto max-w-7xl px-4 md:px-8 grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <Reveal>
            <div className="overflow-hidden rounded-[var(--radius-3xl)] border border-border bg-card p-3 shadow-elegant">
              <img
                src={labWideImage}
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
            <h2 className="mt-5 font-display text-3xl md:text-5xl font-bold">Professional Laboratory Services</h2>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {[
                "Rapid HIV Testing",
                "Blood Sugar Test",
                "Malaria Testing",
                "H. pylori Test",
                "Blood Grouping",
                "Home Sample Collection",
                "Office Sample Collection",
                "Home Healthcare",
              ].map((item) => (
                <div key={item} className="flex gap-2 rounded-2xl border border-border bg-muted/40 px-4 py-3 text-sm font-medium">
                  <Check className="mt-0.5 h-4 w-4 text-primary" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <a href="#book-a-test" className="mt-8 inline-flex rounded-full btn-gradient px-7 py-3.5 text-sm font-display font-semibold">
              Book a Test
            </a>
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
              <h2 className="mt-5 font-display text-3xl md:text-5xl font-bold">Curated essentials for wellness and lifestyle</h2>
            </div>
          </Reveal>
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {featuredProducts.map((product, index) => (
              <Reveal key={product.title} delay={index * 70}>
                <article className="overflow-hidden rounded-[var(--radius-2xl)] border border-border bg-card shadow-soft card-lift">
                  <img src={product.image} alt={product.title} className="aspect-[4/3] w-full object-cover" loading="lazy" width={1280} height={960} />
                  <div className="p-6">
                    <h3 className="font-display text-xl font-semibold">{product.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{product.description}</p>
                    <Link to={product.href} className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-2.5 text-sm font-semibold hover:border-primary hover:text-primary">
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
                <h2 className="mt-5 font-display text-4xl md:text-5xl font-bold leading-[1.02]">Can't Visit Us? We Come To You.</h2>
                <p className="mt-5 max-w-xl text-base leading-relaxed text-primary-foreground/82 md:text-lg">
                  Professional home and office sample collection services delivered safely and conveniently by trained personnel.
                </p>
                <Link to="/home-services" className="mt-8 inline-flex rounded-full bg-primary-foreground px-7 py-3.5 text-sm font-display font-semibold text-foreground shadow-soft">
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
              { value: <><Counter to={15} suffix="+" /></>, label: "Years Experience" },
              { value: <><Counter to={10000} suffix="+" /></>, label: "Satisfied Customers" },
              { value: <><Counter to={98} suffix="%" /></>, label: "Customer Satisfaction" },
              { value: "24/7", label: "Customer Support" },
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

      <section className="section-pad bg-muted/45">
        <div className="mx-auto max-w-7xl px-4 md:px-8 text-center">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
              Trusted Partners
            </span>
            <h2 className="mt-5 font-display text-3xl md:text-5xl font-bold">Recognized suppliers and healthcare partners</h2>
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
      </section>

      <section className="section-pad">
        <div className="mx-auto max-w-7xl px-4 md:px-8 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <Reveal>
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-gold">
                Contact
              </span>
              <h2 className="mt-5 font-display text-3xl md:text-5xl font-bold">Visit or speak with our team</h2>
              <p className="mt-5 text-muted-foreground leading-relaxed">
                Reach us for laboratory appointments, medicine inquiries, home visits or general healthcare support.
              </p>
              <div className="mt-8 grid gap-4">
                {[
                  [Phone, "Phone", "0703244711"],
                  [Mail, "Email", "mmuthamacollins90@gmail.com"],
                  [MapPin, "Location", "Nairobi, South C, off Popo Road, opposite Midad Academy"],
                  [Clock3, "Business Hours", "Mon–Sun · 7:00 — 22:00"],
                ].map(([Icon, label, value]) => {
                  const Cmp = Icon as typeof Phone;
                  return (
                    <div key={label as string} className="flex gap-4 rounded-[var(--radius-xl)] border border-border bg-card px-5 py-4 shadow-soft">
                      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                        <Cmp className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-muted-foreground">{label as string}</div>
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
