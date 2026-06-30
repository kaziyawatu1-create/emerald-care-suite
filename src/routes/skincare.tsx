import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "../components/site/PageHeader";
import { Reveal } from "../components/site/Reveal";
import { skincareCollections } from "../lib/site-data";

export const Route = createFileRoute("/skincare")({
  head: () => ({
    meta: [
      { title: "Skincare | Nuno Pharmacy" },
      { name: "description", content: "Shop premium skincare collections including Yusra, CeraVe, face care, body care, sunscreens and acne solutions." },
      { property: "og:title", content: "Nuno Pharmacy Skincare" },
      { property: "og:description", content: "Premium skincare with a clean, trusted retail experience." },
    ],
  }),
  component: SkincarePage,
});

function SkincarePage() {
  return (
    <>
      <PageHeader
        eyebrow="Skincare"
        title="Premium skincare curated for healthy, confident skin"
        subtitle="Discover trusted routines and dermatologist-informed essentials for daily care, protection and targeted treatment."
      />

      <section className="section-pad">
        <div className="mx-auto max-w-7xl px-4 md:px-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {skincareCollections.map((item, index) => (
            <Reveal key={item.name} delay={index * 50}>
              <article className="overflow-hidden rounded-[var(--radius-2xl)] border border-border bg-card shadow-soft card-lift">
                <img src={item.image} alt={item.name} className="aspect-[4/3] w-full object-cover" loading="lazy" width={1280} height={960} />
                <div className="p-6">
                  <h2 className="font-display text-2xl font-bold">{item.name}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                  <button className="mt-6 rounded-full btn-gradient px-5 py-2.5 text-sm font-display font-semibold">Shop Collection</button>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
