import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock, XCircle, Smartphone } from "lucide-react";
import { z } from "zod";
import { PageHeader } from "../components/site/PageHeader";
import { getOrderStatus } from "../lib/shop.functions";
import { formatKES } from "../lib/cart";

export const Route = createFileRoute("/order/$orderId")({
  validateSearch: z.object({ msg: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Order Confirmation | Nuno Pharmacy" },
      { name: "description", content: "Track your order and payment status." },
    ],
  }),
  component: OrderPage,
});

function OrderPage() {
  const { orderId } = Route.useParams();
  const { msg } = Route.useSearch();
  const { data, isLoading } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => getOrderStatus({ data: { order_id: orderId } }),
    refetchInterval: (q) => {
      const d = q.state.data;
      if (!d) return 3000;
      if (d.order?.payment_status === "paid" || d.order?.payment_status === "failed" || d.order?.payment_status === "cancelled") return false;
      if (d.order?.payment_method === "cod") return false;
      return 3000;
    },
  });

  if (isLoading || !data) {
    return (
      <>
        <PageHeader eyebrow="Order" title="Loading your order…" />
      </>
    );
  }

  const { order, mpesa } = data;
  const paid = order.payment_status === "paid";
  const failed = order.payment_status === "failed" || order.payment_status === "cancelled";
  const isCOD = order.payment_method === "cod";

  return (
    <>
      <PageHeader eyebrow={`Order ${order.order_number}`} title={paid ? "Payment received" : isCOD ? "Order confirmed" : "Waiting for payment"} />

      <section className="section-pad">
        <div className="mx-auto max-w-3xl px-4 md:px-8">
          <div className="rounded-[var(--radius-2xl)] border border-border bg-card p-8 shadow-soft">
            <div className="flex items-center gap-3">
              {paid || isCOD ? (
                <CheckCircle2 className="h-10 w-10 text-primary" />
              ) : failed ? (
                <XCircle className="h-10 w-10 text-destructive" />
              ) : (
                <Clock className="h-10 w-10 text-[color:var(--gold)] animate-pulse" />
              )}
              <div>
                <h2 className="font-display text-2xl font-bold">
                  {paid && "Payment received — thank you!"}
                  {!paid && isCOD && "We received your order"}
                  {!paid && !isCOD && !failed && "Complete payment on your phone"}
                  {failed && "Payment did not complete"}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {isCOD
                    ? "You'll pay on delivery. Our team will call to confirm shortly."
                    : paid
                      ? `M-Pesa receipt: ${mpesa?.mpesa_receipt ?? "—"}`
                      : failed
                        ? mpesa?.result_desc ?? "The payment was cancelled or timed out."
                        : msg || "Check your phone for the M-Pesa prompt and enter your PIN."}
                </p>
              </div>
            </div>

            {!paid && !failed && !isCOD && (
              <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3">
                <Smartphone className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  This page updates automatically once the payment completes. Do not close it.
                </p>
              </div>
            )}

            <dl className="mt-8 grid gap-3 sm:grid-cols-2 text-sm">
              <Row label="Customer" value={order.customer_name} />
              <Row label="Phone" value={order.customer_phone} />
              <Row label="Delivery" value={order.delivery_address} />
              <Row label="Payment method" value={order.payment_method === "mpesa" ? "M-Pesa STK Push" : "Pay on Delivery"} />
              <Row label="Total" value={formatKES(Number(order.total_kes))} strong />
              <Row label="Status" value={order.order_status} />
            </dl>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/shop" className="rounded-full btn-gradient px-6 py-3 text-sm font-semibold font-display">
                Continue shopping
              </Link>
              <Link to="/" className="rounded-full border border-border px-6 py-3 text-sm font-semibold">
                Back to home
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-3 rounded-xl bg-background border border-border px-4 py-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={strong ? "font-display font-bold text-primary" : "font-semibold"}>{value}</dd>
    </div>
  );
}
