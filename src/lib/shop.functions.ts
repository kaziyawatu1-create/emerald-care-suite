import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { normalizeKenyanPhone } from "./mpesa";

function publicClient() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
  });
}

export const listProducts = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const { data, error } = await supabase
    .from("products")
    .select("id,name,category,description,price_kes,unit,requires_prescription,in_stock")
    .eq("in_stock", true)
    .order("category")
    .order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
});

const cartItemSchema = z.object({
  id: z.string().uuid(),
  quantity: z.number().int().min(1).max(50),
});

const placeOrderSchema = z.object({
  customer_name: z.string().min(2).max(120),
  customer_phone: z.string().min(7).max(20),
  customer_email: z.string().email().max(160).optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  delivery_address: z.string().min(5).max(500),
  notes: z.string().max(500).optional(),
  payment_method: z.enum(["mpesa", "cod"]),
  items: z.array(cartItemSchema).min(1).max(50),
});

export const placeOrder = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => placeOrderSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Load authoritative prices from DB
    const ids = data.items.map((i) => i.id);
    const { data: products, error: pErr } = await supabaseAdmin
      .from("products")
      .select("id,name,price_kes,in_stock")
      .in("id", ids);
    if (pErr) throw new Error(pErr.message);
    if (!products || products.length !== ids.length) throw new Error("One or more products not found");

    const byId = new Map(products.map((p) => [p.id, p]));
    const itemsWithPrice = data.items.map((i) => {
      const p = byId.get(i.id)!;
      if (!p.in_stock) throw new Error(`${p.name} is out of stock`);
      const unit = Number(p.price_kes);
      return {
        product_id: p.id,
        product_name: p.name,
        unit_price_kes: unit,
        quantity: i.quantity,
        subtotal_kes: unit * i.quantity,
      };
    });

    const subtotal = itemsWithPrice.reduce((s, i) => s + i.subtotal_kes, 0);
    const delivery_fee = 200;
    const total = subtotal + delivery_fee;

    const phone = normalizeKenyanPhone(data.customer_phone);
    if (!phone) throw new Error("Invalid Kenyan phone number. Use format 07XXXXXXXX.");

    const { data: order, error: oErr } = await supabaseAdmin
      .from("orders")
      .insert({
        customer_name: data.customer_name,
        customer_phone: phone,
        customer_email: data.customer_email ?? null,
        delivery_address: data.delivery_address,
        notes: data.notes ?? null,
        subtotal_kes: subtotal,
        delivery_fee_kes: delivery_fee,
        total_kes: total,
        payment_method: data.payment_method,
        payment_status: data.payment_method === "cod" ? "pending" : "pending",
      })
      .select("id,order_number,total_kes,payment_method")
      .single();
    if (oErr) throw new Error(oErr.message);

    const { error: iErr } = await supabaseAdmin
      .from("order_items")
      .insert(itemsWithPrice.map((i) => ({ ...i, order_id: order.id })));
    if (iErr) throw new Error(iErr.message);

    // Trigger STK push if M-Pesa
    let stk: { checkout_request_id: string | null; message: string } = { checkout_request_id: null, message: "" };
    if (data.payment_method === "mpesa") {
      stk = await initiateStkPush({
        orderId: order.id,
        phone,
        amount: Math.round(total),
        reference: order.order_number,
      });
    }

    return {
      order_id: order.id,
      order_number: order.order_number,
      total: Number(order.total_kes),
      payment_method: order.payment_method,
      checkout_request_id: stk.checkout_request_id,
      mpesa_message: stk.message,
    };
  });

async function initiateStkPush(args: { orderId: string; phone: string; amount: number; reference: string }) {
  const {
    MPESA_CONSUMER_KEY,
    MPESA_CONSUMER_SECRET,
    MPESA_SHORTCODE,
    MPESA_PASSKEY,
    MPESA_ENV,
    MPESA_CALLBACK_URL,
  } = process.env;

  if (!MPESA_CONSUMER_KEY || !MPESA_CONSUMER_SECRET || !MPESA_SHORTCODE || !MPESA_PASSKEY || !MPESA_CALLBACK_URL) {
    return { checkout_request_id: null, message: "M-Pesa is not fully configured yet. Ask the pharmacy team, or choose Pay on Delivery." };
  }

  const base = MPESA_ENV === "production" ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke";

  try {
    const tokenRes = await fetch(`${base}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: { Authorization: "Basic " + Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString("base64") },
    });
    if (!tokenRes.ok) throw new Error(`Auth failed: ${tokenRes.status}`);
    const { access_token } = (await tokenRes.json()) as { access_token: string };

    const timestamp = new Date()
      .toISOString()
      .replace(/[-T:.Z]/g, "")
      .slice(0, 14);
    const password = Buffer.from(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`).toString("base64");

    const stkRes = await fetch(`${base}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: { Authorization: `Bearer ${access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        BusinessShortCode: MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: args.amount,
        PartyA: args.phone,
        PartyB: MPESA_SHORTCODE,
        PhoneNumber: args.phone,
        CallBackURL: MPESA_CALLBACK_URL,
        AccountReference: args.reference.slice(0, 12),
        TransactionDesc: `Nuno Pharmacy ${args.reference}`.slice(0, 20),
      }),
    });
    const stkJson = (await stkRes.json()) as {
      MerchantRequestID?: string;
      CheckoutRequestID?: string;
      ResponseCode?: string;
      ResponseDescription?: string;
      errorMessage?: string;
    };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("mpesa_transactions").insert({
      order_id: args.orderId,
      merchant_request_id: stkJson.MerchantRequestID ?? null,
      checkout_request_id: stkJson.CheckoutRequestID ?? null,
      phone: args.phone,
      amount: args.amount,
      status: stkJson.ResponseCode === "0" ? "initiated" : "failed",
      result_desc: stkJson.ResponseDescription ?? stkJson.errorMessage ?? null,
    });

    if (stkJson.ResponseCode !== "0") {
      return { checkout_request_id: null, message: stkJson.errorMessage || stkJson.ResponseDescription || "STK push failed" };
    }
    return {
      checkout_request_id: stkJson.CheckoutRequestID ?? null,
      message: "Check your phone and enter your M-Pesa PIN to complete payment.",
    };
  } catch (e) {
    console.error("STK push error", e);
    return { checkout_request_id: null, message: "Could not reach M-Pesa. Please try again or choose Pay on Delivery." };
  }
}

export const getOrderStatus = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ order_id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("id,order_number,total_kes,payment_method,payment_status,order_status,customer_name,customer_phone,delivery_address")
      .eq("id", data.order_id)
      .single();
    if (error) throw new Error(error.message);
    const { data: tx } = await supabaseAdmin
      .from("mpesa_transactions")
      .select("status,mpesa_receipt,result_desc")
      .eq("order_id", data.order_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return { order, mpesa: tx ?? null };
  });
