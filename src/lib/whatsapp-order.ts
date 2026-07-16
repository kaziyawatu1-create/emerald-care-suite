export const WHATSAPP_ORDER_NUMBER = "254703244711";
export const WHATSAPP_ORDER_URL = `https://wa.me/${WHATSAPP_ORDER_NUMBER}`;

export type WhatsAppOrderItem = {
  name: string;
  quantity: number;
  price: number;
};

export function formatKESForWhatsApp(value: number) {
  return `KES ${value.toLocaleString("en-KE", { maximumFractionDigits: 0 })}`;
}

export function buildWhatsAppOrderText(args: {
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  items: WhatsAppOrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
}) {
  const orderLines = args.items
    .map((item) => `• ${item.name} x ${item.quantity} — ${formatKESForWhatsApp(item.quantity * item.price)}`)
    .join("\n");

  return [
    "Hello Nuno Pharmacy, I would like to place an order.",
    "",
    `Customer: ${args.customerName}`,
    `Phone: ${args.customerPhone}`,
    `Delivery address: ${args.deliveryAddress}`,
    "",
    "Order list:",
    orderLines,
    "",
    `Subtotal: ${formatKESForWhatsApp(args.subtotal)}`,
    `Delivery: ${formatKESForWhatsApp(args.deliveryFee)}`,
    `Total: ${formatKESForWhatsApp(args.total)}`,
  ].join("\n");
}

export function buildWhatsAppOrderUrl(args: {
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  items: WhatsAppOrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
}) {
  return `${WHATSAPP_ORDER_URL}?text=${encodeURIComponent(buildWhatsAppOrderText(args))}`;
}
