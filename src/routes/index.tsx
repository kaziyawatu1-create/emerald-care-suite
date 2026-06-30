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
  Microscope,
  HeartPulse,
  Pill,
  Sparkles,
} from "lucide-react";
import { Counter } from "../components/site/Counter";
import { Reveal } from "../components/site/Reveal";
import { TestimonialsCarousel } from "../components/site/TestimonialsCarousel";
import {
  featuredProducts,
  heroImage,
  homeVisitImage,
  labWideImage,
  partners,
  serviceCategories,
  whyChooseItems,
} from "../lib/site-data";

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
  return (
    <>
      <section className="relative overflow-hidden border-b border-border bg-[linear-gradient(180deg,color-mix(in_oklab,var(--primary)_5%,var(--background)),var(--background))]">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,color-mix(in_oklab,var(--foreground)_72%,transparent),color-mix(in_oklab,var(--foreground)_18%,transparent))]" />
        <img
          src={labWideImage}
          alt="Modern pharmacy laboratory interior"
          className="absolute inset-0 h-full w-full object-cover mix-blend-multiply opacity-20"
          width={1600}
          height={1200}
        />
        <div className="relative mx-auto grid min-h-[calc(100vh-4.5rem)] max-w-7xl items-center gap-14 px-4 py-14 md:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
          <Reveal className="text-primary-foreground">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/8 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em]">
              Premium Medical + Modern Luxury
            </span>
            <h1 className="mt-6 font-display text-5xl font-bold leading-[0.95] md:text-7xl">
              Your Trusted Healthcare Partner
            </h1>
            <p className="mt-6 max-w-2xl text-lg md:text-2xl font-medium text-primary-foreground/90">
              Quality Medicines. Reliable Laboratory Services. Professional Healthcare Solutions.
            </p>
            <p className="mt-6 max-w-2xl text-base md:text-lg leading-relaxed text-primary-foreground/78">
              Providing genuine medicines, accurate laboratory testing, skincare products, vitamins,
              perfumes, and professional pharmaceutical care for individuals, families, and businesses.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link to="/laboratory" className="rounded-full bg-primary-foreground px-7 py-3.5 text-sm font-display font-semibold text-foreground shadow-elegant transition-transform hover:-translate-y-0.5">
                Book Lab Test
              </Link>
              <Link to="/pharmacy" className="rounded-full border border-primary-foreground/25 bg-primary-foreground/8 px-7 py-3.5 text-sm font-display font-semibold text-primary-foreground backdrop-blur-sm transition-colors hover:bg-primary-foreground/14">
                Shop Medicines
              </Link>
            </div>
            <div className="mt-10 grid max-w-2xl gap-4 sm:grid-cols-3">
              {[
                ["15+", "Years Experience"],
                ["10,000+", "Satisfied Customers"],
                ["24/7", "Customer Support"],
              ].map(([value, label]) => (
                <div key={label} className="rounded-[var(--radius-xl)] border border-primary-foreground/15 bg-primary-foreground/8 px-5 py-4 backdrop-blur-sm">
                  <div className="text-2xl font-display font-bold">{value}</div>
                  <div className="mt-1 text-sm text-primary-foreground/72">{label}</div>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={120} className="relative lg:justify-self-end">
            <div className="relative overflow-hidden rounded-[calc(var(--radius-3xl)+8px)] border border-primary-foreground/15 bg-primary-foreground/8 p-3 backdrop-blur-sm shadow-elegant">
              <img
                src={heroImage}
                alt="Professional pharmacist in a modern pharmacy"
                className="aspect-[4/5] w-full rounded-[calc(var(--radius-3xl))] object-cover"
                width={1280}
                height={1600}
              />
            </div>
            <div className="absolute -left-4 bottom-6 rounded-[var(--radius-xl)] border border-border bg-card px-4 py-4 shadow-soft sm:-left-10">
              <div className="text-sm font-semibold text-muted-foreground">Trusted service</div>
              <div className="mt-1 font-display text-xl font-bold">Certified lab & pharmacy</div>
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
                <span className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-gold">
                  Our Services
                </span>
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
                    <h3 className="mt-4 font-display text-2xl font-bold">{service.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{service.description}</p>
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
            <Link to="/laboratory" className="mt-8 inline-flex rounded-full btn-gradient px-7 py-3.5 text-sm font-display font-semibold">
              Book Appointment
            </Link>
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
                  [Phone, "Phone", "+256 700 000 000"],
                  [Mail, "Email", "hello@nunopharmacy.com"],
                  [MapPin, "Location", "Plot 42, Main Street, Kampala"],
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
                src="https://www.google.com/maps?q=Kampala%20Uganda&z=13&output=embed"
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
