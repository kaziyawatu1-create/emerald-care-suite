import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState, type FormEvent } from "react";
import { Eye, Heart } from "lucide-react";
import { useCart } from "../lib/cart";
import { PageHeader } from "../components/site/PageHeader";
import { Reveal } from "../components/site/Reveal";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { toast } from "sonner";
import productPlaceholder from "../assets/product-placeholder.svg";
import { listOffers, upsertOffer } from "../lib/offers.functions";
import { filterOfferProducts } from "../lib/offer-product-search";
import { listProducts } from "../lib/shop.functions";

type OfferItem = {
  id: string;
  title: string;
  description: string | null;
  badge: string | null;
  discount_percent?: number | null;
  original_price?: number | null;
  sale_price?: number | null;
  product_id?: string | null;
  expires_at: string | null;
  image: string | null;
  created_at?: string;
};

type ProductOption = {
  id: string;
  name: string;
  price_kes: number;
  image_urls?: string[] | null;
};

const fallbackOffers: OfferItem[] = [
  {
    id: "fallback-1",
    title: "Weekend Wellness Bundle",
    description: "Get 15% off essential vitamins and wellness packs when you order before Sunday.",
    badge: "Discounted",
    discount_percent: 15,
    original_price: 2000,
    sale_price: 1700,
    expires_at: null,
    image: null,
  },
  {
    id: "fallback-2",
    title: "Flash Sale: Home Test Collection",
    description: "Book a home sample collection today only at reduced pricing.",
    badge: "Flash Sale",
    discount_percent: 20,
    original_price: 3500,
    sale_price: 2800,
    expires_at: null,
    image: null,
  },
  {
    id: "fallback-3",
    title: "Family Care BOGO",
    description: "Buy one consultation, get one free for family members.",
    badge: "BOGO",
    discount_percent: 50,
    original_price: null,
    sale_price: null,
    expires_at: null,
    image: null,
  },
];

const BADGE_OPTIONS = [
   "BOGO", 
   "New Arrival",
   "Discounted", 
   "Flash Sale",
   "Limited Time", 
   "Popular"] as const;

function badgeClasses(badge: string | null | undefined) {
  const key = (badge ?? "").toLowerCase();
  if (key.includes("flash")) return "bg-red-600 text-white border-red-700";
  if (key.includes("bogo")) return "bg-amber-500 text-white border-amber-600";
  if (key.includes("new")) return "bg-emerald-600 text-white border-emerald-700";
  if (key.includes("discount")) return "bg-primary text-primary-foreground border-primary";
  return "bg-primary/10 text-primary border-primary/20";
}

function formatPrice(v: number | null | undefined) {
  if (v == null || Number.isNaN(Number(v))) return "";
  return `KES ${Number(v).toLocaleString()}`;
}


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
  const loadOffersFn = useServerFn(listOffers);
  const loadProductsFn = useServerFn(listProducts);
  const saveOfferFn = useServerFn(upsertOffer);
  const { add } = useCart();
  const [offers, setOffers] = useState<OfferItem[]>(fallbackOffers);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<OfferItem | null>(null);
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  const [savingOffer, setSavingOffer] = useState(false);
  const [offerForm, setOfferForm] = useState({
    title: "",
    description: "",
    badge: "",
    discount: "",
    original_price: "",
    sale_price: "",
    expires_at: "",
    image: "",
  });

  const [offerProductSearch, setOfferProductSearch] = useState("");
  const [offerSelectedProductId, setOfferSelectedProductId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    loadOffersFn()
      .then((rows) => {
        if (!mounted) return;
        const nextOffers = Array.isArray(rows) ? (rows as unknown as OfferItem[]) : [];
        setOffers(nextOffers.length > 0 ? nextOffers : fallbackOffers);
      })
      .catch(() => {
        if (mounted) {
          setOffers(fallbackOffers);
        }
      });

    return () => {
      mounted = false;
    };
  }, [loadOffersFn]);

  useEffect(() => {
    let mounted = true;

    loadProductsFn()
      .then((rows) => {
        if (!mounted) return;
        const nextProducts = Array.isArray(rows) ? (rows as ProductOption[]) : [];
        setProducts(nextProducts);
      })
      .catch(() => {
        if (mounted) {
          setProducts([]);
        }
      });

    return () => {
      mounted = false;
    };
  }, [loadProductsFn]);

  function formatOfferExpiryValue(value: string | null | undefined) {
    if (!value) return "";
    const normalized = value.split(" ")[0];
    return normalized.includes("T") ? normalized.split("T")[0] : normalized;
  }

  function resetOfferForm() {
    setEditingOfferId(null);
    setOfferForm({ title: "", description: "", badge: "", discount: "", original_price: "", sale_price: "", expires_at: "", image: "" });
    setOfferProductSearch("");
    setOfferSelectedProductId(null);
  }

  function parseDiscountPercent(value: string) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 && parsed <= 100 ? parsed : null;
  }

  function calculateSalePrice(originalPrice: number | null, discountPercent: number | null) {
    if (originalPrice == null || discountPercent == null) return null;
    return Math.max(0, Math.round(originalPrice * (100 - discountPercent) / 100));
  }

  function handleOfferProductSelection(productId: string) {
    if (!productId) {
      setOfferSelectedProductId(null);
      setOfferProductSearch("");
      setOfferForm((prev) => ({ ...prev, image: "", original_price: "", sale_price: "" }));
      return;
    }

    const selectedProduct = products.find((product) => product.id === productId);
    if (!selectedProduct) return;

    setOfferSelectedProductId(selectedProduct.id);
    setOfferProductSearch(selectedProduct.name);
    const firstImage = Array.isArray(selectedProduct.image_urls)
      ? selectedProduct.image_urls.find((url): url is string => typeof url === "string" && Boolean(url)) ?? ""
      : "";
    const discountPercent = parseDiscountPercent(offerForm.discount);
    const computedSale = calculateSalePrice(selectedProduct.price_kes, discountPercent);

    setOfferForm((prev) => ({
      ...prev,
      image: firstImage,
      original_price: String(selectedProduct.price_kes),
      sale_price: computedSale != null ? String(computedSale) : prev.sale_price,
    }));
  }

  function handleOfferProductSearchChange(value: string) {
    setOfferProductSearch(value);

    if (!value.trim()) {
      return;
    }

    const selectedProduct = offerSelectedProductId
      ? products.find((product) => product.id === offerSelectedProductId) ?? null
      : null;

    if (selectedProduct && selectedProduct.name.toLowerCase() === value.trim().toLowerCase()) {
      return;
    }
  }

  useEffect(() => {
    const originalPrice = Number(offerForm.original_price);
    const discountPercent = parseDiscountPercent(offerForm.discount);
    const salePrice = offerForm.sale_price.trim() ? Number(offerForm.sale_price) : null;
    const badgeKey = offerForm.badge.trim().toLowerCase();

    if (badgeKey === "bogo" && originalPrice > 0) {
      setOfferForm((prev) => ({
        ...prev,
        sale_price: String(Math.round(originalPrice)),
        discount: prev.discount || "50",
      }));
      return;
    }

    if (originalPrice > 0 && salePrice != null && salePrice > 0 && salePrice < originalPrice) {
      const derivedDiscount = Math.round(((originalPrice - salePrice) / originalPrice) * 100);
      if (derivedDiscount >= 0 && derivedDiscount <= 100) {
        setOfferForm((prev) => (prev.discount === String(derivedDiscount) ? prev : { ...prev, discount: String(derivedDiscount) }));
      }
      return;
    }

    if (originalPrice > 0 && discountPercent != null) {
      const computed = calculateSalePrice(originalPrice, discountPercent);
      if (computed != null) {
        setOfferForm((prev) => (prev.sale_price === String(computed) ? prev : { ...prev, sale_price: String(computed) }));
      }
    }
  }, [offerForm.original_price, offerForm.discount, offerForm.sale_price, offerForm.badge]);

  async function handleSaveOffer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!offerForm.title.trim()) {
      toast.error("Offer title is required.");
      return;
    }

    const badge = offerForm.badge.trim();
    const isFlash = badge.toLowerCase() === "flash sale";
    const isBogo = badge.toLowerCase() === "bogo";

    const selectedProduct = offerSelectedProductId ? products.find((product) => product.id === offerSelectedProductId) ?? null : null;
    let origPrice = offerForm.original_price.trim() ? Number(offerForm.original_price) : selectedProduct?.price_kes ?? null;
    let salePrice = offerForm.sale_price.trim() ? Number(offerForm.sale_price) : null;
    let discountPct = offerForm.discount.trim() ? Number(offerForm.discount) : null;
    if (discountPct != null && (!Number.isFinite(discountPct) || discountPct < 0 || discountPct > 100)) {
      discountPct = null;
    }
    if (discountPct == null && origPrice != null && salePrice != null && salePrice > 0 && salePrice < origPrice) {
      discountPct = Math.round(((origPrice - salePrice) / origPrice) * 100);
    }
    let discountLabel = discountPct != null ? `${discountPct}% off` : "";
    let expiresAt = offerForm.expires_at.trim() || null;

    if (isBogo && origPrice != null) {
      salePrice = origPrice;
      discountPct = 50;
      if (!discountLabel) discountLabel = "Buy 1 Get 1 Free";
    }

    if (!isFlash && !isBogo && salePrice == null && origPrice != null && discountPct != null) {
      salePrice = calculateSalePrice(origPrice, discountPct);
    }

    if (isFlash) {
      if (!origPrice || !salePrice || salePrice >= origPrice) {
        toast.error("Flash Sale needs an original price and a lower sale price.");
        return;
      }
      if (!expiresAt) {
        toast.error("Flash Sale needs an expiry date to create urgency.");
        return;
      }
      if (discountPct == null) {
        discountPct = Math.round(((origPrice - salePrice) / origPrice) * 100);
      }
      if (!discountLabel) discountLabel = `Flash: ${discountPct}% off`;
    }

    setSavingOffer(true);
    try {
      const selectedProduct = offerSelectedProductId ? products.find((product) => product.id === offerSelectedProductId) ?? null : null;
      const resolvedImage = selectedProduct
        ? (Array.isArray(selectedProduct.image_urls) ? selectedProduct.image_urls.find((url): url is string => typeof url === "string" && Boolean(url)) ?? "" : "")
        : offerForm.image.trim();

      const savedOfferResponse = await saveOfferFn({
        data: {
          id: editingOfferId ?? undefined,
          title: offerForm.title.trim(),
          description: offerForm.description.trim(),
          badge,
          discount_percent: discountPct,
          original_price: origPrice,
          sale_price: salePrice,
          product_id: offerSelectedProductId ?? null,
          expires_at: expiresAt,
          image: resolvedImage || null,
        },
      });
      const savedOffer = savedOfferResponse as unknown as OfferItem;

      setOffers((current) => {
        if (editingOfferId) {
          return current.map((offer) => (offer.id === editingOfferId ? savedOffer : offer));
        }
        return [savedOffer, ...current];
      });

      toast.success(editingOfferId ? "Offer updated." : "Offer created.");
      setOfferDialogOpen(false);
      resetOfferForm();
    } catch (error) {
      console.error("Failed to save offer", error);
      toast.error("Unable to save offer right now.");
    } finally {
      setSavingOffer(false);
    }
  }

  function openOfferDialog() {
    resetOfferForm();
    setOfferDialogOpen(true);
  }

  function openOfferDetails(offer: OfferItem) {
    setSelectedOffer(offer);
  }

  function closeOfferDetails() {
    setSelectedOffer(null);
  }

  return (
    <>
      <Dialog open={!!selectedOffer} onOpenChange={(open) => (open ? null : closeOfferDetails())}>
        <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedOffer?.title ?? "Offer details"}</DialogTitle>
            <DialogDescription>View the full promotion details, pricing and availability.</DialogDescription>
          </DialogHeader>
          {selectedOffer ? (
            <div className="space-y-5 py-2">
              <div className="overflow-hidden rounded-[1.25rem] border border-border">
                <img src={selectedOffer.image || productPlaceholder} alt={selectedOffer.title} className="h-56 w-full object-cover" />
              </div>
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] ${badgeClasses(selectedOffer.badge)}`}>
                    {selectedOffer.badge ?? "Offer"}
                  </span>
                  {selectedOffer.expires_at ? (
                    <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                      Expires {formatOfferExpiryValue(selectedOffer.expires_at)}
                    </span>
                  ) : null}
                </div>
                <p className="text-base leading-relaxed text-muted-foreground">{selectedOffer.description ?? "More details available soon."}</p>
                <div className="rounded-[1rem] border border-border bg-card p-4">
                  <p className="text-sm text-muted-foreground">Pricing</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    {selectedOffer.original_price != null && selectedOffer.sale_price != null && selectedOffer.original_price > selectedOffer.sale_price ? (
                      <>
                        <span className="text-sm text-muted-foreground line-through">{formatPrice(selectedOffer.original_price)}</span>
                        <span className="text-2xl font-semibold text-foreground">{formatPrice(selectedOffer.sale_price)}</span>
                      </>
                    ) : selectedOffer.sale_price != null ? (
                      <span className="text-2xl font-semibold text-foreground">{formatPrice(selectedOffer.sale_price)}</span>
                    ) : selectedOffer.original_price != null ? (
                      <span className="text-2xl font-semibold text-foreground">{formatPrice(selectedOffer.original_price)}</span>
                    ) : null}
                  </div>
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={closeOfferDetails}>Close</Button>
                <Button type="button" onClick={() => {
                  add({ id: `offer-${selectedOffer.id}`, name: selectedOffer.title, price: Number(selectedOffer.sale_price ?? selectedOffer.original_price ?? 0), category: "Offer" }, 1);
                  closeOfferDetails();
                }}>
                  Add to cart
                </Button>
              </DialogFooter>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
      <Dialog open={offerDialogOpen} onOpenChange={(open) => (open ? setOfferDialogOpen(true) : setOfferDialogOpen(false))}>
        <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingOfferId ? "Edit offer" : "Create new offer"}</DialogTitle>
            <DialogDescription>Use the offers table fields to create a new promotion.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveOffer} className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="offer-title">Title</Label>
              <Input
                id="offer-title"
                value={offerForm.title}
                onChange={(event) => setOfferForm((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="e.g. Weekend Wellness Bundle"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="offer-description">Description</Label>
              <Textarea
                id="offer-description"
                rows={4}
                value={offerForm.description}
                onChange={(event) => setOfferForm((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="Describe the promotion and benefits"
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="offer-badge">Badge</Label>
                <Select value={offerForm.badge} onValueChange={(value) => setOfferForm((prev) => ({ ...prev, badge: value }))}>
                  <SelectTrigger id="offer-badge">
                    <SelectValue placeholder="Select badge" />
                  </SelectTrigger>
                  <SelectContent>
                    {BADGE_OPTIONS.map((b) => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="offer-expires">Expire date</Label>
                <Input
                  id="offer-expires"
                  type="date"
                  value={offerForm.expires_at}
                  onChange={(event) => setOfferForm((prev) => ({ ...prev, expires_at: event.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="offer-product">Product on offer</Label>
                <div className="space-y-2">
                  <Input
                    id="offer-product"
                    value={offerProductSearch}
                    onChange={(event) => handleOfferProductSearchChange(event.target.value)}
                    placeholder="Search products by name or category"
                  />
                  {offerProductSearch.trim() ? (
                    <div className="max-h-48 overflow-auto rounded-lg border border-border bg-background p-2 shadow-sm">
                      {filterOfferProducts(products, offerProductSearch).length > 0 ? (
                        filterOfferProducts(products, offerProductSearch).map((product) => (
                          <button
                            key={product.id}
                            type="button"
                            className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition hover:bg-muted"
                            onClick={() => handleOfferProductSelection(product.id)}
                          >
                            <span>
                              <span className="font-medium">{product.name}</span>
                              <span className="ml-2 text-xs text-muted-foreground">{product.category ?? "Product"}</span>
                            </span>
                            <span className="text-xs font-semibold text-primary">KES {Number(product.price_kes).toLocaleString()}</span>
                          </button>
                        ))
                      ) : (
                        <p className="px-3 py-2 text-sm text-muted-foreground">No matching products found.</p>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="offer-original-price">Original price (KES)</Label>
                <Input
                  id="offer-original-price"
                  type="number"
                  value={offerForm.original_price}
                  readOnly
                  placeholder="Auto-filled from product"
                  className="bg-muted/50"
                />
                <p className="text-xs text-muted-foreground">Taken from the selected product.</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="offer-sale-price">Sale price (KES)</Label>
                <Input
                  id="offer-sale-price"
                  type="number"
                  value={offerForm.sale_price}
                  readOnly
                  placeholder="Auto-calculated"
                  className="bg-muted/50"
                />
                <p className="text-xs text-muted-foreground">Original − (Discount % × Original).</p>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Product image</Label>
              <p className="text-xs text-muted-foreground">The offer card image uses the selected product's image.</p>
            </div>
            <div className="overflow-hidden rounded-2xl border border-border">
              <img src={offerForm.image || productPlaceholder} alt="Offer preview" className="h-40 w-full object-cover" />
            </div>
            <DialogFooter className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setOfferDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={savingOffer}>
                {savingOffer ? "Saving…" : editingOfferId ? "Update offer" : "Save offer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <section className="section-pad">
        <div className="mx-auto max-w-7xl px-4 md:px-8 grid gap-6 lg:grid-cols-3">
          {offers.map((offer, index) => {
            const badgeKey = (offer.badge ?? "").toLowerCase();
            const isFlash = badgeKey.includes("flash");
            const isBogo = badgeKey.includes("bogo");
            const pct = offer.discount_percent ?? (offer.original_price && offer.sale_price && offer.original_price > offer.sale_price
              ? Math.round(((offer.original_price - offer.sale_price) / offer.original_price) * 100)
              : null);
            const effectiveSalePrice = offer.sale_price ?? (offer.original_price != null && pct != null
              ? Math.max(0, Math.round(offer.original_price * (100 - pct) / 100))
              : null);
            const discountAmount = offer.original_price != null && effectiveSalePrice != null
              ? Math.max(0, offer.original_price - effectiveSalePrice)
              : null;
            const hasPriceComparison = offer.original_price != null && effectiveSalePrice != null && offer.original_price > effectiveSalePrice;
            const discountBadge = discountAmount != null && discountAmount > 0
              ? `Save KES ${discountAmount.toLocaleString()}`
              : pct && pct > 0
                ? `-${pct}%`
                : null;
            return (
            <Reveal key={offer.id} delay={index * 60}>
              <article className={`group overflow-hidden rounded-[1.25rem] border border-border bg-card shadow-soft card-lift transition hover:-translate-y-1 hover:shadow-xl ${isFlash ? "border-red-500 ring-1 ring-red-500/30" : ""}`}>
                <div className="relative overflow-hidden">
                  <img src={offer.image || productPlaceholder} alt={offer.title} className="h-44 w-full object-cover transition duration-500 group-hover:scale-105 sm:h-48" />
                  <div className="absolute inset-x-0 top-4 flex items-start justify-between px-4">
                    <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] ${badgeClasses(offer.badge)}`}>
                      {offer.badge ?? "Offer"}
                    </span>
                    <div className="flex items-center gap-2">
                      <button type="button" aria-label="View offer" onClick={() => openOfferDetails(offer)} className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-sm transition hover:bg-white">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button type="button" aria-label="Save offer" className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-sm transition hover:bg-white">
                        <Heart className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {discountBadge ? (
                    <div className="absolute left-4 bottom-4 rounded-full bg-red-600 px-3 py-2 text-sm font-bold text-white shadow-lg ring-2 ring-white/80">
                      {discountBadge}
                    </div>
                  ) : null}
                </div>

                <div className="p-4 sm:p-5">
                  <h2 className="font-display text-lg font-semibold text-foreground">{offer.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground line-clamp-1">{offer.description ?? "More details available soon."}</p>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    {hasPriceComparison ? (
                      <>
                        <span className="text-sm text-muted-foreground line-through">{formatPrice(offer.original_price)}</span>
                        <span className="text-lg font-semibold text-foreground">{formatPrice(effectiveSalePrice)}</span>
                      </>
                    ) : effectiveSalePrice != null ? (
                      <span className="text-lg font-semibold text-foreground">{formatPrice(effectiveSalePrice)}</span>
                    ) : offer.original_price != null ? (
                      <span className="text-lg font-semibold text-foreground">{formatPrice(offer.original_price)}</span>
                    ) : null}
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {discountBadge ? <span className="inline-flex rounded-full bg-red-600/10 px-3 py-1 text-sm font-semibold text-red-600">{discountBadge}</span> : null}
                  </div>

                  <div className="mt-5">
                    <button
                      type="button"
                      onClick={() => add({
                        id: `offer-${offer.id}`,
                        name: offer.title,
                        price: Number(effectiveSalePrice ?? offer.original_price ?? 0),
                        category: "Offer",
                      }, 1)}
                      className="w-full rounded-full btn-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90"
                    >
                      Add to cart
                    </button>
                  </div>

                  {offer.expires_at ? (
                    <p className="mt-3 text-xs uppercase tracking-[0.25em] text-muted-foreground">
                      {(() => {
                        const target = new Date(offer.expires_at);
                        if (Number.isNaN(target.getTime())) return `Ends ${offer.expires_at}`;
                        const diffMs = target.getTime() - Date.now();
                        if (diffMs <= 0) return "Expired";
                        const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
                        const days = Math.floor(totalHours / 24);
                        const hours = totalHours % 24;
                        if (days > 0) return `${days} day${days > 1 ? "s" : ""} left`;
                        if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} left`;
                        return "Less than 1 hour left";
                      })()}
                    </p>
                  ) : null}
                </div>
              </article>
            </Reveal>
            );
          })}
        </div>
      </section>
    </>
  );
}
