import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus, Check, ShoppingBag, AlertCircle } from "lucide-react";
import { PageHeader } from "../components/site/PageHeader";
import { Reveal } from "../components/site/Reveal";
import { listProducts } from "../lib/shop.functions";
import { useCart, formatKES } from "../lib/cart";
import { readCatalogCategories, readCatalogProducts, type CatalogCategory, type CatalogProduct } from "../lib/catalog";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Shop Medicine | Nuno Pharmacy" },
      { name: "description", content: "Browse our catalogue of genuine medicines by category and add to cart. Pay with M-Pesa or on delivery." },
      { property: "og:title", content: "Shop Medicine — Nuno Pharmacy" },
      { property: "og:description", content: "Genuine medicines delivered. Pay with M-Pesa or cash on delivery." },
    ],
  }),
  component: ShopPage,
});

type Product = CatalogProduct;

function ShopPage() {
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [catalogProducts, setCatalogProducts] = useState<Product[]>(() => readCatalogProducts());
  const [catalogCategories, setCatalogCategories] = useState<CatalogCategory[]>(() => readCatalogCategories());
  const { data, isLoading, error } = useQuery({
    queryKey: ["products"],
    queryFn: () => listProducts(),
  });
  const { add, count } = useCart();
  const [justAdded, setJustAdded] = useState<string | null>(null);

  useEffect(() => {
    const storedProducts = readCatalogProducts();
    const storedCategories = readCatalogCategories();

    if (storedProducts.length > 0) {
      setCatalogProducts(storedProducts);
    } else if (data && data.length > 0) {
      setCatalogProducts(data as Product[]);
    }

    if (storedCategories.length > 0) {
      setCatalogCategories(storedCategories);
    } else if (data && data.length > 0) {
      const derivedCategories = Array.from(new Set((data as Product[]).map((p) => p.category))).map((name) => ({ id: name, name, description: "" }));
      setCatalogCategories(derivedCategories);
    }
  }, [data]);

  const products = catalogProducts.length > 0 ? catalogProducts : ((data ?? []) as Product[]);
  const categories = useMemo(() => {
    if (catalogCategories.length > 0) return catalogCategories.map((category) => category.name);
    return Array.from(new Set(products.map((p) => p.category)));
  }, [catalogCategories, products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (activeCat && p.category !== activeCat) return false;
      if (!q) return true;
      return `${p.name} ${p.category} ${p.description}`.toLowerCase().includes(q);
    });
  }, [products, query, activeCat]);

  const grouped = useMemo(() => {
    const g: Record<string, Product[]> = {};
    for (const p of filtered) (g[p.category] ??= []).push(p);
    return g;
  }, [filtered]);

  return (
    <>

      <section className="section-pad">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="flex flex-wrap items-center gap-3 justify-between mb-6">
            <label className="flex items-center gap-3 rounded-full border border-border bg-card px-5 py-3 shadow-soft flex-1 min-w-[260px]">
              <Search className="h-5 w-5 text-primary" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search medicines (e.g. Panadol, cough, diabetes)"
                aria-label="Search medicines"
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </label>
            <Link
              to="/cart"
              className="inline-flex items-center gap-2 rounded-full btn-gradient px-5 py-3 text-sm font-semibold font-display"
            >
              <ShoppingBag className="h-4 w-4" />
              View Cart {count > 0 && <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">{count}</span>}
            </Link>
          </div>

          <div className="flex flex-wrap gap-2 mb-8">
            <button
              onClick={() => setActiveCat(null)}
              className={`rounded-full px-4 py-2 text-sm font-medium border transition ${
                activeCat === null ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary"
              }`}
            >
              All categories
            </button>
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setActiveCat(c === activeCat ? null : c)}
                className={`rounded-full px-4 py-2 text-sm font-medium border transition ${
                  activeCat === c ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {isLoading && <p className="text-muted-foreground">Loading catalogue…</p>}
          {error && (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive flex items-center gap-3">
              <AlertCircle className="h-5 w-5" /> Could not load products. Please refresh.
            </div>
          )}

          {!isLoading && Object.keys(grouped).length === 0 && (
            <p className="text-muted-foreground">No medicines match your search.</p>
          )}

          {Object.entries(grouped).map(([cat, list]) => (
            <div key={cat} className="mb-14">
              <div className="flex items-baseline gap-3 mb-5">
                <h2 className="font-display text-2xl md:text-3xl font-bold">{cat}</h2>
                <span className="text-sm text-muted-foreground">{list.length} items</span>
              </div>
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {list.map((p, index) => {
                  const price = Number(p.price_kes);
                  const added = justAdded === p.id;
                  return (
                    <Reveal key={p.id} delay={index * 30}>
                      <article className="h-full flex flex-col rounded-[var(--radius-2xl)] border border-border bg-card p-6 shadow-soft card-lift">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-display text-lg font-bold leading-snug">{p.name}</h3>
                            <p className="text-xs text-muted-foreground mt-1">per {p.unit}</p>
                          </div>
                          {p.requires_prescription && (
                            <span className="rounded-full bg-gold/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[color:var(--gold)]">
                              Rx
                            </span>
                          )}
                        </div>
                        <p className="mt-3 text-sm text-muted-foreground leading-relaxed flex-1">{p.description}</p>
                        <div className="mt-5 flex items-center justify-between gap-3">
                          <span className="font-display text-xl font-bold text-primary">{formatKES(price)}</span>
                          <button
                            onClick={() => {
                              add({ id: p.id, name: p.name, price, category: p.category });
                              setJustAdded(p.id);
                              window.setTimeout(() => setJustAdded((v) => (v === p.id ? null : v)), 1200);
                            }}
                            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition ${
                              added ? "bg-primary/10 text-primary" : "btn-gradient"
                            }`}
                          >
                            {added ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                            {added ? "Added" : "Add to cart"}
                          </button>
                        </div>
                      </article>
                    </Reveal>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
