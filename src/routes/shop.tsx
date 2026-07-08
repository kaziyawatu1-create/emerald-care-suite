import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus, Check, ShoppingBag, AlertCircle, Eye, ArrowLeft, ArrowRight } from "lucide-react";
import { PageHeader } from "../components/site/PageHeader";
import { Reveal } from "../components/site/Reveal";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
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

  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [activeProductImageIndex, setActiveProductImageIndex] = useState(0);

  const getProductImages = (product: Product) => {
    const maybeImages = (product as Product & { image_urls?: string[] | null }).image_urls;
    const firstImage = (product as Product & { image_url?: string | null }).image_url;
    const images = maybeImages && maybeImages.length ? maybeImages : firstImage ? [firstImage] : [];
    return images.length > 0 ? images : [productPlaceholder];
  };

  const closeProductDetail = () => {
    setActiveProduct(null);
    setActiveProductImageIndex(0);
  };

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

          {isLoading && products.length === 0 && (
            <div className="mb-14">
              <div className="flex items-baseline gap-3 mb-5">
                <div className="h-8 w-40 rounded bg-muted animate-pulse" />
                <div className="h-4 w-16 rounded bg-muted animate-pulse" />
              </div>
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)}
              </div>
            </div>
          )}
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
                        <img
                          src={getProductImages(p)[0]}
                          alt={p.name}
                          className="mt-5 aspect-[4/3] w-full rounded-[1rem] object-cover border border-border"
                          loading="lazy"
                        />
                        <p className="mt-3 text-sm text-muted-foreground leading-relaxed flex-1 overflow-hidden text-ellipsis line-clamp-1">{p.description}</p>
                        {!p.in_stock ? (
                          <span className="mt-4 inline-flex w-fit rounded-full border border-destructive/20 bg-destructive/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-destructive">
                            Out of stock
                          </span>
                        ) : null}
                        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                          <span className="font-display text-xl font-bold text-primary">{formatKES(price)}</span>
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => {
                                setActiveProduct(p);
                                setActiveProductImageIndex(0);
                              }}
                              className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-2 text-sm font-semibold text-muted-foreground transition hover:border-primary hover:text-primary"
                            >
                              <Eye className="h-4 w-4" /> View
                            </button>
                            <button
                              onClick={() => {
                                if (!p.in_stock) return;
                                add({ id: p.id, name: p.name, price, category: p.category });
                                setJustAdded(p.id);
                                window.setTimeout(() => setJustAdded((v) => (v === p.id ? null : v)), 1200);
                              }}
                              disabled={!p.in_stock}
                              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition ${
                                added ? "bg-primary/10 text-primary" : "btn-gradient"
                              } ${!p.in_stock ? "cursor-not-allowed opacity-60" : ""}`}
                            >
                              {added ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                              {added ? "Added" : p.in_stock ? "Add to cart" : "Out of stock"}
                            </button>
                          </div>
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
          <Dialog open={!!activeProduct} onOpenChange={(open) => { if (!open) closeProductDetail(); }}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>{activeProduct?.name ?? "Product details"}</DialogTitle>
                <DialogDescription>Browse uploaded product images and view product details.</DialogDescription>
              </DialogHeader>
              {activeProduct ? (
                <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
                  <div>
                    <div className="relative overflow-hidden rounded-3xl border border-border bg-background">
                      <img
                        src={getProductImages(activeProduct)[activeProductImageIndex]}
                        alt={activeProduct.name}
                        className="h-[360px] w-full object-cover"
                      />
                      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/60 to-transparent p-3">
                        <button
                          onClick={() => setActiveProductImageIndex((current) => Math.max(current - 1, 0))}
                          disabled={activeProductImageIndex === 0}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <ArrowLeft className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setActiveProductImageIndex((current) => Math.min(current + 1, getProductImages(activeProduct).length - 1))}
                          disabled={activeProductImageIndex >= getProductImages(activeProduct).length - 1}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-4 gap-3">
                      {getProductImages(activeProduct).map((image, idx) => (
                        <button
                          key={`${image}-${idx}`}
                          type="button"
                          onClick={() => setActiveProductImageIndex(idx)}
                          className={`overflow-hidden rounded-3xl border ${idx === activeProductImageIndex ? "border-primary" : "border-border"}`}
                        >
                          <img src={image} alt={`${activeProduct.name} image ${idx + 1}`} className="h-24 w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">{activeProduct.category}</p>
                    <p className="text-3xl font-bold leading-tight">{activeProduct.name}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{activeProduct.description}</p>
                    <div className="rounded-3xl border border-border bg-card p-5">
                      <p className="text-sm text-muted-foreground">Price</p>
                      <p className="mt-2 text-3xl font-bold text-primary">{formatKES(Number(activeProduct.price_kes))}</p>
                      <p className="mt-1 text-sm text-muted-foreground">Per {activeProduct.unit}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {activeProduct.requires_prescription ? (
                        <span className="rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gold">Rx</span>
                      ) : null}
                      {!activeProduct.in_stock ? (
                        <span className="rounded-full bg-destructive/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-destructive">Out of stock</span>
                      ) : null}
                    </div>
                    <DialogFooter className="mt-6 gap-2">
                      <button type="button" onClick={closeProductDetail} className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold">Close</button>
                      <button
                        type="button"
                        onClick={() => {
                          add({ id: activeProduct.id, name: activeProduct.name, price: Number(activeProduct.price_kes), category: activeProduct.category });
                          closeProductDetail();
                        }}
                        disabled={!activeProduct.in_stock}
                        className="rounded-full btn-gradient px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
                      >
                        Add to cart
                      </button>
                    </DialogFooter>
                  </div>
                </div>
              ) : null}
            </DialogContent>
          </Dialog>
        </>
  );
}
