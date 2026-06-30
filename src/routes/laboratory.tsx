import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, ArrowRight } from "lucide-react";
import { PageHeader } from "../components/site/PageHeader";
import { Reveal } from "../components/site/Reveal";
import { laboratoryTests } from "../lib/site-data";

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
  return (
    <>
      <PageHeader
        eyebrow="Laboratory"
        title="Reliable laboratory diagnostics with professional care"
        subtitle="Every test is handled with speed, precision and clear communication — from in-house diagnostics to home and office sample collection."
      >
        <Link to="/contact" className="inline-flex rounded-full btn-gradient px-7 py-3.5 text-sm font-display font-semibold">
          Book Test
        </Link>
      </PageHeader>

      <section className="section-pad">
        <div className="mx-auto max-w-7xl px-4 md:px-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {laboratoryTests.map((test, index) => (
            <Reveal key={test.name} delay={index * 50}>
              <article className="overflow-hidden rounded-[var(--radius-2xl)] border border-border bg-card shadow-soft card-lift">
                <img src={test.image} alt={test.name} className="aspect-[4/3] w-full object-cover" loading="lazy" width={1280} height={960} />
                <div className="p-6">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="font-display text-xl font-semibold">{test.name}</h2>
                    <span className="rounded-full bg-gold/12 px-3 py-1 text-sm font-semibold text-gold">{test.price}</span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{test.description}</p>
                  <Link to="/contact" className="mt-6 inline-flex items-center gap-2 rounded-full btn-gradient px-5 py-2.5 text-sm font-display font-semibold">
                    Book Test
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
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
            {[
              "Rapid HIV Testing",
              "Blood Sugar Test",
              "Malaria Testing",
              "H. pylori Test",
              "Blood Grouping",
              "Home Sample Collection",
              "Office Sample Collection",
              "Home Healthcare",
            ].map((service, index) => (
              <Reveal key={service} delay={index * 40}>
                <div className="flex items-start gap-3 rounded-[var(--radius-xl)] border border-border bg-card px-5 py-4 text-left shadow-soft">
                  <Check className="mt-0.5 h-5 w-5 text-primary" />
                  <span className="font-medium">{service}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
