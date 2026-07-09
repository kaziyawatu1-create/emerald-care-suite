import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState, type FormEvent } from "react";
import { PageHeader } from "../components/site/PageHeader";
import { Reveal } from "../components/site/Reveal";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import { listOffers, upsertOffer } from "../lib/offers.functions";
import { listProducts } from "../lib/shop.functions";

type OfferItem = {
  id: string;
  title: string;
  description: string | null;
  badge: string | null;
  discount: string | null;
  discount_percent?: number | null;
  original_price?: number | null;
  sale_price?: number | null;
  expires_at: string | null;
  image: string | null;
  created_at?: string;
};

type ProductOption = {
  id: string;
  name: string;
  image_urls?: string[] | null;
};

const fallbackOffers: OfferItem[] = [
  {
    id: "fallback-1",
    title: "Weekend Wellness Bundle",
    description: "Get 15% off essential vitamins and wellness packs when you order before Sunday.",
    badge: "Discounted",
    discount: "15% off",
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
    discount: "Reduced pricing",
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
    discount: "Buy 1 Get 1",
    discount_percent: 50,
    original_price: null,
    sale_price: null,
    expires_at: null,
    image: null,
  },
];

const BADGE_OPTIONS = ["New Arrival", "Discounted", "Flash Sale", "BOGO", "Limited Time", "Popular"] as const;

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
  const [offers, setOffers] = useState<OfferItem[]>(fallbackOffers);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  const [savingOffer, setSavingOffer] = useState(false);
  const [offerForm, setOfferForm] = useState({
    title: "",
    description: "",
    badge: "",
    discount: "",
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
        const nextOffers = Array.isArray(rows) ? (rows as OfferItem[]) : [];
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
    setOfferForm({ title: "", description: "", badge: "", discount: "", expires_at: "", image: "" });
    setOfferProductSearch("");
    setOfferSelectedProductId(null);
  }

  function handleOfferProductSelection(nextValue: string) {
    setOfferProductSearch(nextValue);

    const normalized = nextValue.trim().toLowerCase();
    const selectedProduct = products.find((product) => product.id === nextValue || product.name.toLowerCase() === normalized);

    if (!selectedProduct) {
      if (!normalized) {
        setOfferSelectedProductId(null);
        setOfferForm((prev) => ({ ...prev, image: "" }));
      }
      return;
    }

    setOfferSelectedProductId(selectedProduct.id);
    setOfferProductSearch(selectedProduct.name);
    const firstImage = Array.isArray(selectedProduct.image_urls) ? selectedProduct.image_urls.find((url): url is string => typeof url === "string" && Boolean(url)) ?? "" : "";
    setOfferForm((prev) => ({ ...prev, image: firstImage }));
  }

  async function handleSaveOffer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!offerForm.title.trim()) {
      toast.error("Offer title is required.");
      return;
    }

    setSavingOffer(true);
    try {
      const selectedProduct = offerSelectedProductId ? products.find((product) => product.id === offerSelectedProductId) ?? null : null;
      const resolvedImage = selectedProduct
        ? (Array.isArray(selectedProduct.image_urls) ? selectedProduct.image_urls.find((url): url is string => typeof url === "string" && Boolean(url)) ?? "" : "")
        : offerForm.image.trim();

      const savedOffer = (await saveOfferFn({
        data: {
          id: editingOfferId ?? undefined,
          title: offerForm.title.trim(),
          description: offerForm.description.trim(),
          badge: offerForm.badge.trim(),
          discount: offerForm.discount.trim(),
          expires_at: offerForm.expires_at.trim() || null,
          image: resolvedImage || null,
        },
      })) as OfferItem;

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

  return (
    <>
      <PageHeader
        eyebrow="Offers"
        title="Special deals made for your wellness routine"
        subtitle="Browse current promotions on consultations, lab services, and everyday essentials."
      />

      <div className="mx-auto mb-8 max-w-7xl px-4 md:px-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Create new offers from the admin popup form and they will appear in the offers list below.</p>
        </div>
        <Button onClick={openOfferDialog} className="rounded-full px-4 py-2 text-sm font-semibold">
          Add offer
        </Button>
      </div>

      <Dialog open={offerDialogOpen} onOpenChange={(open) => (open ? setOfferDialogOpen(true) : setOfferDialogOpen(false))}>
        <DialogContent className="max-w-2xl">
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
                <select
                  id="offer-badge"
                  value={offerForm.badge}
                  onChange={(event) => setOfferForm((prev) => ({ ...prev, badge: event.target.value }))}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors md:text-sm"
                >
                  <option value="">Select badge</option>
                  <option value="New Arrival">New Arrival</option>
                  <option value="Discounted">Discounted</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="offer-discount">Discount label</Label>
                <Input
                  id="offer-discount"
                  value={offerForm.discount}
                  onChange={(event) => setOfferForm((prev) => ({ ...prev, discount: event.target.value }))}
                  placeholder="e.g. 15% off"
                />
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="offer-expires">Expires at</Label>
                <Input
                  id="offer-expires"
                  type="date"
                  value={offerForm.expires_at}
                  onChange={(event) => setOfferForm((prev) => ({ ...prev, expires_at: event.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="offer-product">Product on offer</Label>
                <Input
                  id="offer-product"
                  list="offer-product-options"
                  value={offerProductSearch}
                  onChange={(event) => handleOfferProductSelection(event.target.value)}
                  placeholder="Search products"
                />
                <datalist id="offer-product-options">
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </datalist>
                <p className="text-xs text-muted-foreground">The offer card image will use the selected product image.</p>
              </div>
            </div>
            {offerForm.image ? (
              <div className="overflow-hidden rounded-2xl border border-border">
                <img src={offerForm.image} alt="Offer preview" className="h-40 w-full object-cover" />
              </div>
            ) : null}
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
          {offers.map((offer, index) => (
            <Reveal key={offer.id} delay={index * 60}>
              <article className="rounded-2xl border border-border bg-card p-6 shadow-soft card-lift">
                {offer.image ? (
                  <img src={offer.image} alt={offer.title} className="mb-4 h-48 w-full rounded-3xl object-cover" />
                ) : null}
                <span className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  {offer.badge ?? "Offer"}
                </span>
                <h2 className="mt-4 font-display text-2xl font-semibold">{offer.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{offer.description ?? "More details available soon."}</p>
                {offer.discount ? <p className="mt-3 text-sm font-medium text-foreground">{offer.discount}</p> : null}
                {offer.expires_at ? (
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
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
              </article>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
