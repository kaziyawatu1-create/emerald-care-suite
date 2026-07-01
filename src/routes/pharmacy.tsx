import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, ShoppingBag } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader } from "../components/site/PageHeader";
import { Reveal } from "../components/site/Reveal";
import { pharmacyCategories } from "../lib/site-data";

export const Route = createFileRoute("/pharmacy")({
  head: () => ({
    meta: [
      { title: "Pharmacy | Nuno Pharmacy" },
      { name: "description", content: "Browse prescription medicines, pain relief, diabetes care, heart health, supplements and family wellness essentials." },
      { property: "og:title", content: "Nuno Pharmacy" },
      { property: "og:description", content: "Genuine medicines, prescription support and live category search." },
    ],
  }),
  component: PharmacyPage,
});

function PharmacyPage() {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pharmacyCategories;
    return pharmacyCategories.filter((item) =>
      `${item.name} ${item.description} ${item.tag}`.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <>
      <PageHeader
        eyebrow="Pharmacy"
        title="Genuine medicines with clear, professional guidance"
        subtitle="Search across trusted categories and discover carefully sourced products for routine care, chronic conditions and everyday wellness."
      />

      <section className="section-pad">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <Reveal>
            <div className="flex flex-wrap items-center gap-3 justify-between">
              <label className="flex items-center gap-3 rounded-full border border-border bg-card px-5 py-3 shadow-soft flex-1 min-w-[260px]">
                <Search className="h-5 w-5 text-primary" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search medicine categories"
                  aria-label="Search medicine categories"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </label>
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 rounded-full btn-gradient px-6 py-3 text-sm font-semibold font-display"
              >
                <ShoppingBag className="h-4 w-4" />
                Shop Medicine
              </Link>
            </div>
          </Reveal>

          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((item, index) => (
              <Reveal key={item.name} delay={index * 50}>
                <article className="h-full rounded-[var(--radius-2xl)] border border-border bg-card p-7 shadow-soft card-lift">
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                    {item.tag}
                  </span>
                  <h2 className="mt-5 font-display text-2xl font-bold">{item.name}</h2>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                  <button className="mt-6 rounded-full border border-border bg-background px-5 py-2.5 text-sm font-semibold hover:border-primary hover:text-primary">
                    Explore Category
                  </button>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
