import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Smartphone, Truck, AlertCircle } from "lucide-react";
import { PageHeader } from "../components/site/PageHeader";
import { useCart, formatKES } from "../lib/cart";
import { placeOrder } from "../lib/shop.functions";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout | Nuno Pharmacy" },
      { name: "description", content: "Complete your order with M-Pesa STK Push or pay on delivery." },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const navigate = useNavigate();
  const { items, subtotal, clear } = useCart();
  const submit = useServerFn(placeOrder);
  const [method, setMethod] = useState<"mpesa" | "cod">("mpesa");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const isFreeDelivery = subtotal >= 3000;
  const deliveryFee = 0;
  const total = subtotal + deliveryFee;

  if (items.length === 0) {
    return (
      <>
        <PageHeader eyebrow="Checkout" title="Nothing to checkout" subtitle="Your cart is empty." />
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <Link to="/shop" className="inline-flex rounded-full btn-gradient px-6 py-3 text-sm font-semibold font-display">
            Browse medicines
          </Link>
        </div>
      </>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await submit({
        data: {
          customer_name: String(fd.get("customer_name") || ""),
          customer_phone: String(fd.get("customer_phone") || ""),
          customer_email: String(fd.get("customer_email") || ""),
          delivery_address: String(fd.get("delivery_address") || ""),
          notes: String(fd.get("notes") || ""),
          delivery_fee_kes: deliveryFee,
          payment_method: method,
          items: items.map((i) => ({ id: i.id, quantity: i.quantity })),
        },
      });
      clear();
      navigate({ to: "/order/$orderId", params: { orderId: res.order_id }, search: { msg: res.mpesa_message ?? "" } });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader eyebrow="Checkout" title="Delivery & payment" subtitle="Fast, secure ordering. M-Pesa STK Push or pay on delivery." />

      <section className="section-pad">
        <div className="mx-auto max-w-6xl px-4 md:px-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="rounded-[var(--radius-2xl)] border border-border bg-card p-6 shadow-soft">
              <h2 className="font-display text-xl font-bold mb-4">Delivery details</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name" name="customer_name" required placeholder="Jane Wanjiru" />
                <Field label="Phone (M-Pesa)" name="customer_phone" required placeholder="07XX XXX XXX" inputMode="tel" />
                <Field label="Email (optional)" name="customer_email" type="email" placeholder="you@example.com" className="sm:col-span-2" />
                <Field label="Delivery address" name="delivery_address" required placeholder="Estate, street, house / office" className="sm:col-span-2" />
                <Field label="Order notes (optional)" name="notes" placeholder="Landmark, delivery instructions…" className="sm:col-span-2" />
                <div className={`sm:col-span-2 rounded-2xl border p-4 text-sm ${isFreeDelivery ? "border-primary/20 bg-primary/5 text-primary" : "border-border/80 bg-muted/30 text-muted-foreground"}`}>
                  <p className="font-semibold">Delivery charges depend on distance.</p>
                  <p className="mt-1">
                    {isFreeDelivery
                      ? "This order qualifies for free delivery because the subtotal is KES 3,000 or more."
                      : "Delivery charges will be confirmed based on your location and distance."}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[var(--radius-2xl)] border border-border bg-card p-6 shadow-soft">
              <h2 className="font-display text-xl font-bold mb-4">Payment method</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <PayOption
                  active={method === "mpesa"}
                  onClick={() => setMethod("mpesa")}
                  icon={<Smartphone className="h-5 w-5" />}
                  title="M-Pesa STK Push"
                  desc="Pay now. We send a prompt to your phone."
                />
                <PayOption
                  active={method === "cod"}
                  onClick={() => setMethod("cod")}
                  icon={<Truck className="h-5 w-5" />}
                  title="Pay on Delivery"
                  desc="Cash or M-Pesa when your order arrives."
                />
              </div>
            </div>

            {err && (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5" /> {err}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full inline-flex items-center justify-center rounded-full btn-gradient px-6 py-4 text-base font-semibold font-display disabled:opacity-60"
            >
              {busy ? "Placing order…" : method === "mpesa" ? `Pay ${formatKES(total)} with M-Pesa` : `Place order (Pay ${formatKES(total)} on delivery)`}
            </button>
          </form>

          <aside className="rounded-[var(--radius-2xl)] border border-border bg-card p-6 shadow-soft h-fit sticky top-24">
            <h2 className="font-display text-xl font-bold">Your order</h2>
            <ul className="mt-4 space-y-3 text-sm">
              {items.map((i) => (
                <li key={i.id} className="flex justify-between gap-3">
                  <span className="text-muted-foreground">{i.name} × {i.quantity}</span>
                  <span className="font-semibold">{formatKES(i.price * i.quantity)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-2 text-sm border-t border-border pt-4">
              <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd className="font-semibold">{formatKES(subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Delivery</dt><dd className="font-semibold">{isFreeDelivery ? formatKES(deliveryFee) : "Distance-based"}</dd></div>
              <div className="flex justify-between text-base border-t border-border pt-3"><dt className="font-display font-bold">Total</dt><dd className="font-display font-bold text-primary">{formatKES(total)}</dd></div>
            </dl>
          </aside>
        </div>
      </section>
    </>
  );
}

function Field({ label, className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-sm font-semibold mb-1.5">{label}</span>
      <input
        {...props}
        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
}

function PayOption({
  active, onClick, icon, title, desc,
}: { active: boolean; onClick: () => void; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-2xl border p-4 transition ${active ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border bg-background hover:border-primary/50"}`}
    >
      <div className="flex items-center gap-2.5 text-primary">
        {icon}
        <span className="font-display font-bold text-foreground">{title}</span>
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">{desc}</p>
    </button>
  );
}
