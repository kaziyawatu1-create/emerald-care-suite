import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "../components/site/PageHeader";
import { Reveal } from "../components/site/Reveal";

const offers = [
  {
    title: "Weekend Wellness Bundle",
    description: "Get 15% off essential vitamins and wellness packs when you order before Sunday.",
    badge: "Limited time",
  },
  {
    title: "Home Test Collection Discount",
    description: "Book a home sample collection and enjoy reduced pricing on selected lab packages.",
    badge: "New",
  },
  {
    title: "Family Care Offer",
    description: "Save on multi-person consultations and routine prescription refills for families.",
    badge: "Popular",
  },
];

export const Route = createFileRoute("/offers")({
  head: () => ({
    meta: [
      { title: "Offers | Nuno Pharmacy" },
      { name: "description", content: "Explore current offers and promotions available at Nuno Pharmacy." },
    ],
  }),
  component: OffersPage,
});

function OffersPage() {
  return (
    <>
      <PageHeader
        eyebrow="Offers"
        title="Special deals made for your wellness routine"
        subtitle="Browse current promotions on consultations, lab services, and everyday essentials."
      />

      <section className="section-pad">
        <div className="mx-auto max-w-7xl px-4 md:px-8 grid gap-6 lg:grid-cols-3">
          {offers.map((offer, index) => (
            <Reveal key={offer.title} delay={index * 60}>
              <article className="rounded-[var(--radius-2xl)] border border-border bg-card p-6 shadow-soft card-lift">
                <span className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  {offer.badge}
                </span>
                <h2 className="mt-4 font-display text-2xl font-semibold">{offer.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{offer.description}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
