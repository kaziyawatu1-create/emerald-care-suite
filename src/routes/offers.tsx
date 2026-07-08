import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "../components/site/PageHeader";
import { Reveal } from "../components/site/Reveal";
import { VideoClips } from "../components/site/VideoClips";
import Countdown from "../components/site/Countdown";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listOffers } from "../lib/offers.functions";

const defaultOffers = [
  {
    title: "Weekend Wellness Bundle",
    description: "Get 15% off essential vitamins and wellness packs when you order before Sunday.",
    badge: "Limited time",
    discount: "15%",
    image: "/assets/hero-pharmacist.jpg",
  },
  {
    title: "Home Test Collection Discount",
    description: "Book a home sample collection and enjoy reduced pricing on selected lab packages.",
    badge: "New",
    discount: "20%",
    image: "/assets/lab-wide.jpg",
  },
  {
    title: "Family Care Offer",
    description: "Save on multi-person consultations and routine prescription refills for families.",
    badge: "Popular",
    discount: "10%",
    image: "/assets/hero.jpg",
  },
];


const videoClips = [
  {
    src: "/assets/videos/clip1.mp4",
    title: "Shop essentials at unbeatable prices",
  },
  {
    src: "/assets/videos/clip2.mp4",
    title: "See our newest wellness arrivals",
  },
  {
    src: "/assets/videos/clip3.mp4",
    title: "Fast, reliable home care support",
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
  const [offers, setOffers] = useState<any[]>(defaultOffers);
  const loadOffers = useServerFn(listOffers);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await loadOffers();
        if (!mounted) return;
        if (Array.isArray(data) && data.length) setOffers(data as any[]);
      } catch (err) {
        // fallback to defaults
      }
    })();
    return () => {
      mounted = false;
    };
  }, [loadOffers]);

  return (
    <>
      <PageHeader
        eyebrow="Offers"
        title="Special deals made for your wellness routine"
        subtitle="Browse current promotions on consultations, lab services, and everyday essentials."
      />

      <section className="section-pad">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Featured offers</p>
            <h2 className="mt-2 font-display text-3xl font-bold md:text-4xl">Discounted essentials with real savings</h2>
            <p className="mt-3 text-muted-foreground">Browse our current promotions and grab the best value on everyday care products and services.</p>
            <div className="mt-6 text-sm text-muted-foreground">
              Offer updates are managed from the admin dashboard.
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {offers.map((offer, index) => (
              <Reveal key={offer.title + index} delay={index * 70}>
                <article className="group relative overflow-hidden rounded-[var(--radius-2xl)] border border-border bg-card shadow-soft card-lift">
                  {offer.badge && (
                    <div className="absolute right-4 top-4 z-10 rounded-full border border-white/30 bg-primary px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground shadow-lg">
                      {offer.badge}
                    </div>
                  )}
                  {offer.discount && (
                    <div className="absolute left-4 top-4 z-10 rounded-full bg-background/90 px-3 py-1 text-sm font-semibold text-primary shadow-sm">
                      Save {offer.discount}
                    </div>
                  )}
                  <div className="h-40 w-full bg-gradient-to-br from-primary/20 via-background to-muted/60" />
                  <div className="p-6">
                    <h3 className="font-display text-2xl font-semibold">{offer.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{offer.description}</p>
                    {offer.expiresAt && (
                      <div className="mt-3">
                        <Countdown expiresAt={offer.expiresAt} />
                      </div>
                    )}
                    <button className="mt-5 inline-flex rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground">
                      Claim offer
                    </button>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <VideoClips videos={videoClips} />
    </>
  );
}
