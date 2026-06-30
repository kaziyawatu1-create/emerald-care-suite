import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "../components/site/PageHeader";
import { Reveal } from "../components/site/Reveal";
import { perfumeProducts } from "../lib/site-data";

export const Route = createFileRoute("/perfumes")({
  head: () => ({
    meta: [
      { title: "Dubai Perfumes | Nuno Pharmacy" },
      { name: "description", content: "Luxury Dubai perfume collections for men, women and unisex wear with premium presentation and gift options." },
      { property: "og:title", content: "Nuno Pharmacy Dubai Perfumes" },
      { property: "og:description", content: "Luxury fragrance collections with elegant filtering by category." },
    ],
  }),
  component: PerfumesPage,
});

const filters = ["All", "Men", "Women", "Unisex"] as const;

function PerfumesPage() {
  const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]>("All");
  const filtered = useMemo(
    () => perfumeProducts.filter((item) => activeFilter === "All" || item.category === activeFilter),
    [activeFilter],
  );

  return (
    <>
      <PageHeader
        eyebrow="Dubai Perfumes"
        title="Luxury fragrance collections with modern presentation"
        subtitle="Explore premium scents for men, women and unisex wear, curated for signature presence and gift-worthy elegance."
      />

      <section className="section-pad">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <Reveal>
            <div className="flex flex-wrap gap-3">
              {filters.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${activeFilter === filter ? "bg-primary text-primary-foreground" : "border border-border bg-card hover:border-primary hover:text-primary"}`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </Reveal>

          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((item, index) => (
              <Reveal key={item.name} delay={index * 50}>
                <article className="overflow-hidden rounded-[var(--radius-2xl)] border border-border bg-card shadow-soft card-lift">
                  <img src={item.image} alt={item.name} className="aspect-[4/3] w-full object-cover" loading="lazy" width={1280} height={960} />
                  <div className="p-6">
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="font-display text-2xl font-bold">{item.name}</h2>
                      <span className="rounded-full bg-gold/12 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gold">{item.category}</span>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                    <button className="mt-6 rounded-full btn-gradient px-5 py-2.5 text-sm font-display font-semibold">Shop Fragrance</button>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
