import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { PageHeader } from "../components/site/PageHeader";
import { useCart, formatKES } from "../lib/cart";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Cart | Nuno Pharmacy" },
      { name: "description", content: "Review your medicines and proceed to checkout." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { items, setQty, remove, subtotal, count, clear } = useCart();
  const deliveryFee = items.length > 0 ? 200 : 0;
  const total = subtotal + deliveryFee;

  return (
    <>
      <PageHeader eyebrow="Cart" title="Review your order" subtitle={count === 0 ? "Your cart is empty." : `${count} item${count === 1 ? "" : "s"} in your cart.`} />
      <section className="section-pad">
        <div className="mx-auto max-w-5xl px-4 md:px-8">
          {items.length === 0 ? (
            <div className="rounded-[var(--radius-2xl)] border border-border bg-card p-10 text-center shadow-soft">
              <ShoppingBag className="h-10 w-10 mx-auto text-primary" />
              <p className="mt-4 text-muted-foreground">Add some medicines to get started.</p>
              <Link to="/shop" className="mt-6 inline-flex rounded-full btn-gradient px-6 py-3 text-sm font-semibold font-display">
                Browse medicines
              </Link>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
              <div className="space-y-4">
                {items.map((i) => (
                  <div key={i.id} className="rounded-2xl border border-border bg-card p-5 shadow-soft flex flex-wrap items-center gap-4">
                    <div className="flex-1 min-w-[180px]">
                      <div className="text-xs uppercase tracking-wider text-primary font-semibold">{i.category}</div>
                      <div className="font-display text-lg font-bold">{i.name}</div>
                      <div className="text-sm text-muted-foreground">{formatKES(i.price)} each</div>
                    </div>
                    <div className="inline-flex items-center rounded-full border border-border">
                      <button onClick={() => setQty(i.id, i.quantity - 1)} aria-label="Decrease" className="grid h-9 w-9 place-items-center hover:text-primary">
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold">{i.quantity}</span>
                      <button onClick={() => setQty(i.id, i.quantity + 1)} aria-label="Increase" className="grid h-9 w-9 place-items-center hover:text-primary">
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="w-28 text-right font-display font-bold">{formatKES(i.price * i.quantity)}</div>
                    <button onClick={() => remove(i.id)} aria-label="Remove" className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground hover:text-destructive hover:border-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button onClick={clear} className="text-sm text-muted-foreground hover:text-destructive">
                  Clear cart
                </button>
              </div>

              <aside className="rounded-[var(--radius-2xl)] border border-border bg-card p-6 shadow-soft h-fit sticky top-24">
                <h2 className="font-display text-xl font-bold">Order summary</h2>
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd className="font-semibold">{formatKES(subtotal)}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted-foreground">Delivery fee</dt><dd className="font-semibold">{formatKES(deliveryFee)}</dd></div>
                  <div className="border-t border-border pt-3 flex justify-between text-base"><dt className="font-display font-bold">Total</dt><dd className="font-display font-bold text-primary">{formatKES(total)}</dd></div>
                </dl>
                <Link to="/checkout" className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-full btn-gradient px-6 py-3 text-sm font-semibold font-display">
                  Checkout <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/shop" className="mt-3 w-full inline-flex items-center justify-center rounded-full border border-border px-6 py-3 text-sm font-semibold">
                  Continue shopping
                </Link>
              </aside>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
