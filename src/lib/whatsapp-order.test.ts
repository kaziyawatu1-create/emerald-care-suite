import test from "node:test";
import assert from "node:assert/strict";

import { buildWhatsAppOrderText } from "./whatsapp-order.ts";

test("builds a WhatsApp order message with the customer's list and total", () => {
  const result = buildWhatsAppOrderText({
    customerName: "Jane Wanjiru",
    customerPhone: "0703244711",
    deliveryAddress: "Kikuyu, House 12",
    items: [
      { name: "Panadol", quantity: 2, price: 100 },
      { name: "Amoxil", quantity: 1, price: 250 },
    ],
    subtotal: 450,
    deliveryFee: 0,
    total: 450,
  });

  assert.match(result, /Jane Wanjiru/);
  assert.match(result, /Panadol x 2/);
  assert.match(result, /Total: KES 450/);
  assert.match(result, /0703244711/);
});
