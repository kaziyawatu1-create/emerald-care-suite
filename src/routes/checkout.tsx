import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import { PageHeader } from "../components/site/PageHeader";
import { useCart, formatKES } from "../lib/cart";
import { buildWhatsAppOrderUrl } from "../lib/whatsapp-order";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout | Nuno Pharmacy" },
      { name: "description", content: "Order via WhatsApp only." },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
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

  const whatsappUrl = buildWhatsAppOrderUrl({
    customerName: "Customer",
    customerPhone: "0703244711",
    deliveryAddress: "To be confirmed on WhatsApp",
    items: items.map((i) => ({ name: i.name, quantity: i.quantity, price: i.price })),
    subtotal,
    deliveryFee,
    total,
  });

  function orderViaWhatsApp() {
    clear();
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <>
      <PageHeader eyebrow="Checkout" title="Order via WhatsApp" subtitle="Add your items, then send your order directly to our WhatsApp number and we'll confirm the total." />

      <section className="section-pad">
        <div className="mx-auto max-w-6xl px-4 md:px-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <div className="rounded-[var(--radius-2xl)] border border-border bg-card p-6 shadow-soft">
              <h2 className="font-display text-xl font-bold mb-4">How it works</h2>
              <p className="text-sm text-muted-foreground">
                Review your basket, then tap the WhatsApp button below. We’ll send your order list and total straight to the pharmacy for confirmation.
              </p>
              <button
                type="button"
                onClick={orderViaWhatsApp}
                className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-full btn-gradient px-6 py-4 text-base font-semibold font-display"
              >
                <MessageCircle className="h-5 w-5" />
                Order via WhatsApp • {formatKES(total)}
              </button>
            </div>
          </div>

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
              <div className="flex justify-between"><dt className="text-muted-foreground">Delivery</dt><dd className="font-semibold">{formatKES(deliveryFee)}</dd></div>
              <div className="flex justify-between text-base border-t border-border pt-3"><dt className="font-display font-bold">Total</dt><dd className="font-display font-bold text-primary">{formatKES(total)}</dd></div>
            </dl>
          </aside>
        </div>
      </section>
    </>
  );
}

