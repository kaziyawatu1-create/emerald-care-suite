import { createFileRoute, Link } from "@tanstack/react-router";
import productPlaceholder from "../assets/product-placeholder.svg";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Check, ShoppingBag } from "lucide-react";
import { PageHeader } from "../components/site/PageHeader";
import { Reveal } from "../components/site/Reveal";
import { ProductImageCardSkeleton, ProductImage } from "../components/site/ProductSkeleton";
import { listProducts } from "../lib/shop.functions";
import { useCart, formatKES } from "../lib/cart";
import servicePerfumes from "../assets/service-perfumes.jpg";


export const Route = createFileRoute("/perfumes")({
  head: () => ({
    meta: [
      { title: "Dubai Perfumes | Nuno Pharmacy" },
      { name: "description", content: "Shop luxury Dubai perfumes for men, women and unisex wear. Add to cart and pay with M-Pesa or on delivery." },
      { property: "og:title", content: "Nuno Pharmacy Dubai Perfumes" },
      { property: "og:description", content: "Luxury fragrance collections with elegant filtering by category." },
    ],
  }),
  component: PerfumesPage,
});

const filters = ["All", "Men", "Women", "Unisex"] as const;

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

function detectGender(name: string): (typeof filters)[number] {
  const n = name.toLowerCase();
  if (n.includes("(men)")) return "Men";
  if (n.includes("(women)")) return "Women";
  if (n.includes("(unisex)")) return "Unisex";
  return "Unisex";
}

function PerfumesPage() {
  const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]>("All");
  const { data, isLoading } = useQuery({ queryKey: ["products"], queryFn: () => listProducts() });
  const { add, count } = useCart();
  const [justAdded, setJustAdded] = useState<string | null>(null);

  const perfumes = useMemo(
    () =>
      ((data ?? []) as Product[])
        .filter((p) => p.category === "Perfumes")
        .map((p) => ({ ...p, gender: detectGender(p.name) })),
    [data],
  );
  const filtered = perfumes.filter((p) => activeFilter === "All" || p.gender === activeFilter);

  return (
    <>
      <PageHeader
        eyebrow="Dubai Perfumes"
        title="Luxury fragrance collections with modern presentation"
        subtitle="Explore premium scents for men, women and unisex wear. Add to cart and check out securely."
      />

      <section className="section-pad">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
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
            <Link
              to="/cart"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-display font-semibold hover:border-primary hover:text-primary"
            >
              <ShoppingBag className="h-4 w-4" /> Cart ({count})
            </Link>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {isLoading && filtered.length === 0 &&
              Array.from({ length: 6 }).map((_, i) => <ProductImageCardSkeleton key={`pf-${i}`} />)}
            {filtered.map((p, index) => {
              const price = Number(p.price_kes);
              const added = justAdded === p.id;
              const displayName = p.name.replace(/\s*\((Men|Women|Unisex)\)\s*$/i, "");
              return (
                <Reveal key={p.id} delay={index * 40}>
                  <article className="flex h-full flex-col overflow-hidden rounded-[var(--radius-2xl)] border border-border bg-card shadow-soft card-lift">
                    <img
                      src={((p as Product & { image_url?: string | null; image_urls?: string[] | null }).image_urls?.[0] ?? (p as Product & { image_url?: string | null }).image_url) ?? productPlaceholder}
                      alt={displayName}
                      className="aspect-[4/3] w-full object-cover"
                      loading="lazy"
                      width={1280}
                      height={960}
                    />
                    <div className="flex flex-1 flex-col p-6">
                      <div className="flex items-center justify-between gap-3">
                        <h2 className="font-display text-xl font-bold">{displayName}</h2>
                        <span className="rounded-full bg-gold/12 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gold">{p.gender}</span>
                      </div>
                      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground overflow-hidden text-ellipsis line-clamp-1">{p.description}</p>
                      <div className="mt-4 flex items-center justify-between gap-3">
                        <div>
                          <div className="font-display text-lg font-bold text-primary">{formatKES(price)}</div>
                          <div className="text-xs text-muted-foreground">per {p.unit}</div>
                        </div>
                        <button
                          onClick={() => {
                            add({ id: p.id, name: displayName, price, category: p.category });
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
