import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Check, ShoppingBag } from "lucide-react";
import { PageHeader } from "../components/site/PageHeader";
import { Reveal } from "../components/site/Reveal";
import { ProductImageCardSkeleton, ProductImage } from "../components/site/ProductSkeleton";
import { listProducts } from "../lib/shop.functions";
import { useCart, formatKES } from "../lib/cart";
import serviceSkincare from "../assets/service-skincare.jpg";


export const Route = createFileRoute("/skincare")({
  head: () => ({
    meta: [
      { title: "Skincare | Nuno Pharmacy" },
      { name: "description", content: "Shop premium skincare — Yusra, CeraVe, serums, sunscreens and acne solutions. Add to cart and pay with M-Pesa or on delivery." },
      { property: "og:title", content: "Nuno Pharmacy Skincare" },
      { property: "og:description", content: "Premium skincare with a clean, trusted retail experience." },
    ],
  }),
  component: SkincarePage,
});

type Product = {
  id: string;
  name: string;
  category: string;
  description: string;
  price_kes: number | string;
  unit: string;
  requires_prescription: boolean;
  in_stock: boolean;
};

function SkincarePage() {
  const { data, isLoading } = useQuery({ queryKey: ["products"], queryFn: () => listProducts() });
  const { add, count } = useCart();
  const [justAdded, setJustAdded] = useState<string | null>(null);

  const products = ((data ?? []) as Product[]).filter((p) => p.category === "Skincare");

  return (
    <>
      <PageHeader
        eyebrow="Skincare"
        title="Premium skincare curated for healthy, confident skin"
        subtitle="Discover trusted routines and dermatologist-informed essentials. Add to cart and check out securely."
      />

      <section className="section-pad">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="mb-8 flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              {isLoading ? "Loading products…" : `${products.length} products available`}
            </p>
            <Link
              to="/cart"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-display font-semibold hover:border-primary hover:text-primary"
            >
              <ShoppingBag className="h-4 w-4" /> Cart ({count})
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {isLoading && products.length === 0 &&
              Array.from({ length: 6 }).map((_, i) => <ProductImageCardSkeleton key={`sk-${i}`} />)}
            {products.map((p, index) => {
              const price = Number(p.price_kes);
              const added = justAdded === p.id;
              return (
                <Reveal key={p.id} delay={index * 40}>
                  <article className="flex h-full flex-col overflow-hidden rounded-[var(--radius-2xl)] border border-border bg-card shadow-soft card-lift">
                    <img
                      src={((p as Product & { image_url?: string | null; image_urls?: string[] | null }).image_urls?.[0] ?? (p as Product & { image_url?: string | null }).image_url) ?? productPlaceholder}
                      alt={p.name}
                      className="aspect-[4/3] w-full object-cover"
                      loading="lazy"
                      width={1280}
                      height={960}
                    />
                    <div className="flex flex-1 flex-col p-6">
                      <h2 className="font-display text-xl font-bold">{p.name}</h2>
                      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground overflow-hidden text-ellipsis line-clamp-1">{p.description}</p>
                      <div className="mt-4 flex items-center justify-between gap-3">
                        <div>
                          <div className="font-display text-lg font-bold text-primary">{formatKES(price)}</div>
                          <div className="text-xs text-muted-foreground">per {p.unit}</div>
                        </div>
                        <button
                          onClick={() => {
                            add({ id: p.id, name: p.name, price, category: p.category });
                            setJustAdded(p.id);
                            setTimeout(() => setJustAdded((v) => (v === p.id ? null : v)), 1200);
                          }}
                          className="inline-flex items-center gap-2 rounded-full btn-gradient px-4 py-2 text-sm font-display font-semibold"
                        >
                          {added ? <><Check className="h-4 w-4" /> Added</> : <><Plus className="h-4 w-4" /> Add</>}
                        </button>
                      </div>
                    </div>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
