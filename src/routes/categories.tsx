import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, FlaskConical, ShieldCheck, Stethoscope, Wallet } from "lucide-react";
import { PageHeader } from "../components/site/PageHeader";
import { Reveal } from "../components/site/Reveal";
import { whyChooseItems } from "../lib/site-data";

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "Care Categories | Nuno Pharmacy" },
      {
        name: "description",
        content:
          "Explore Nuno Pharmacy care categories: genuine medicines, certified laboratory, qualified pharmacists and affordable healthcare.",
      },
      { property: "og:title", content: "Nuno Pharmacy Care Categories" },
      {
        property: "og:description",
        content:
          "Browse genuine medicines, certified lab services, pharmacist support and affordable healthcare appointments.",
      },
    ],
  }),
  component: CategoriesPage,
});

const categoryIcons = [ShieldCheck, FlaskConical, Stethoscope, Wallet] as const;

const categoryDetails = [
  {
    points: [
      "Sourced from recognized pharmaceutical suppliers",
      "Prescription and over-the-counter options",
      "Vitamins, supplements and daily essentials",
    ],
    cta: "Shop medicines",
  },
  {
    points: [
      "Accurate diagnostics and rapid testing",
      "In-house laboratory support",
      "Home and office sample collection",
    ],
    cta: "Book a lab test",
  },
  {
    points: [
      "Professional medication counseling",
      "Accurate prescription dispensing",
      "Guidance for ongoing treatment plans",
    ],
    cta: "Speak with a pharmacist",
  },
  {
    points: [
      "Accessible pricing for everyday care",
      "Doctor and clinic appointment booking",
      "Flexible healthcare support options",
    ],
    cta: "Book an appointment",
  },
] as const;

function CategoriesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Care Categories"
        title="Four pillars of trusted pharmacy care"
        subtitle="Choose the care you need — genuine medicines, certified laboratory services, pharmacist guidance and affordable healthcare appointments."
      />

      <section className="section-pad">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="grid gap-6 md:grid-cols-2">
            {whyChooseItems.map((item, index) => {
              const Icon = categoryIcons[index];
              const details = categoryDetails[index];

              return (
                <Reveal key={item.title} delay={index * 80}>
                  <Link
                    to={item.href}
                    className="group flex h-full flex-col rounded-[var(--radius-2xl)] border border-border bg-card p-7 shadow-soft card-lift transition-colors hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  >
                    <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <Icon className="h-7 w-7" />
                    </div>
                    <h2 className="mt-6 font-display text-2xl font-bold text-foreground">{item.title}</h2>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                    <ul className="mt-5 space-y-2.5">
                      {details.points.map((point) => (
                        <li key={point} className="flex items-start gap-2.5 text-sm text-foreground/80">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2BB673]" />
                          {point}
                        </li>
                      ))}
                    </ul>
                    <span className="mt-auto inline-flex items-center gap-2 pt-7 text-sm font-display font-semibold text-primary">
                      {details.cta}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
