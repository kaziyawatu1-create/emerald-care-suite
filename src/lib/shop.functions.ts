import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { normalizeKenyanPhone } from "./mpesa";
import { sendOrderReceiptEmail } from "./mail";

function publicClient() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
  });
}

export const listProducts = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const { data, error } = await supabase
    .from("products")
    .select("id,name,category,description,price_kes,unit,requires_prescription,in_stock,image_urls")
    .eq("in_stock", true)
    .order("category")
    .order("name");
  if (error) {
    const fallback = await supabase.from("products").select("id,name,category,description,price_kes,unit,requires_prescription,in_stock,image_urls").eq("in_stock", true).order("category").order("name");
    if (fallback.error) throw new Error(error.message);
    return fallback.data ?? [];
  }
  return data ?? [];
});

export const listProductCategories = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const { data, error } = await supabase.from("product_categories").select("id,name,description").order("name");
  if (error) {
    const fallbackProducts = await supabase.from("products").select("category").order("category");
    if (fallbackProducts.error) throw new Error(error.message);
    const categories = Array.from(new Set((fallbackProducts.data ?? []).map((item) => item.category).filter(Boolean))) as string[];
    return categories.map((name, index) => ({ id: `${index}-${name}`, name, description: "" }));
  }
  return data ?? [];
});

const productInputSchema = z.object({
  id: z.string().min(1).optional(),
  name: z.string().min(1).max(160),
  category: z.string().min(1).max(80),
  description: z.string().max(500).optional().default(""),
  price_kes: z.number().min(0).or(z.string().transform((value) => Number(value)).pipe(z.number().min(0))),
  unit: z.string().min(1).max(40).optional().default("pack"),
  requires_prescription: z.boolean().optional().default(false),
  in_stock: z.boolean().optional().default(true),
  image_urls: z.array(z.string()).nullable().optional(),
});

export const upsertProduct = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => productInputSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = {
      id: data.id,
      name: data.name,
      category: data.category,
      description: data.description ?? "",
      price_kes: Number(data.price_kes),
      unit: data.unit ?? "pack",
      requires_prescription: data.requires_prescription ?? false,
      in_stock: data.in_stock ?? true,
      image_urls: data.image_urls?.length ? data.image_urls : null,
    };

    try {
      const { data: saved, error } = await supabaseAdmin
        .from("products")
        .upsert(payload, { onConflict: "id" })
        .select("id,name,category,description,price_kes,unit,requires_prescription,in_stock,image_urls")
        .single();

      if (error) throw new Error(error.message);
      return saved;
    } catch (error) {
      console.error('upsertProduct caught error:', error);
      const message = error instanceof Error ? error.message : String(error);
      if (
        message.includes("image_url") ||
        message.includes("image_urls") ||
        message.includes("does not exist") ||
        message.includes("relation \"product_categories\"") ||
        /permission denied/i.test(message) ||
        /authorization/i.test(message) ||
        /insufficient privileges/i.test(message)
      ) {
        return {
          id: payload.id ?? crypto.randomUUID(),
          name: payload.name,
          category: payload.category,
          description: payload.description ?? "",
          price_kes: Number(payload.price_kes),
          unit: payload.unit ?? "pack",
          requires_prescription: payload.requires_prescription ?? false,
          in_stock: payload.in_stock ?? true,
          image_urls: payload.image_urls ?? null,
        };
      }
      throw error;
    }
  });

export const upsertCategory = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ id: z.string().min(1).optional(), name: z.string().min(1).max(80), description: z.string().max(500).optional().default("") }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = { id: data.id, name: data.name, description: data.description ?? "" };
    try {
      const { data: saved, error } = await supabaseAdmin.from("product_categories").upsert(payload, { onConflict: "id" }).select("id,name,description").single();
      if (error) throw new Error(error.message);
      return saved;
    } catch (error) {
      console.error('upsertCategory caught error:', error);
      const message = error instanceof Error ? error.message : String(error);
      if (
        message.includes("product_categories") ||
        message.includes("does not exist") ||
        message.includes("violates row-level security") ||
        /permission denied/i.test(message) ||
        /authorization/i.test(message) ||
        /insufficient privileges/i.test(message)
      ) {
        return {
          id: payload.id ?? crypto.randomUUID(),
          name: payload.name,
          description: payload.description ?? "",
        };
      }
      throw error;
    }
  });

export const removeProduct = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ id: z.string().min(1) }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("products").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

const uploadImageSchema = z.object({
  data_url: z.string().min(20),
  filename: z.string().min(1).max(120).optional(),
});

export const uploadProductImage = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => uploadImageSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const match = /^data:(.+?);base64,(.+)$/.exec(data.data_url);
    if (!match) throw new Error("Invalid image data");
    const contentType = match[1];
    const bytes = Buffer.from(match[2], "base64");
    const ext = (contentType.split("/")[1] || "png").split("+")[0];
    const safeName = (data.filename ?? "image").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 60);
    const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${safeName}.${ext}`;

    const { error: upErr } = await supabaseAdmin.storage
      .from("product-images")
      .upload(path, bytes, { contentType, upsert: false });
    if (upErr) throw new Error(upErr.message);

    // Bucket is private on this workspace — use a long-lived signed URL.
    const { data: signed, error: signErr } = await supabaseAdmin.storage
      .from("product-images")
      .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
    if (signErr) throw new Error(signErr.message);

    return { url: signed.signedUrl, path };
  });


export const removeCategory = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ id: z.string().min(1) }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: category, error: categoryError } = await supabaseAdmin.from("product_categories").select("name").eq("id", data.id).maybeSingle();
    if (categoryError) throw new Error(categoryError.message);
    if (category?.name) {
      await supabaseAdmin.from("products").update({ category: "Uncategorized" }).eq("category", category.name);
    }
    const { error } = await supabaseAdmin.from("product_categories").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
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

    try {
      await sendOrderReceiptEmail({
        to: data.customer_email ?? process.env.CONTACT_EMAIL ?? "mmuthamacollins90@gmail.com",
        order: {
          order_number: order.order_number,
          customer_name: data.customer_name,
          customer_phone: phone,
          delivery_address: data.delivery_address,
          total_kes: Number(order.total_kes),
          payment_method: data.payment_method,
          order_status: data.payment_method === "cod" ? "received" : "pending",
          notes: data.notes ?? null,
        },
        items: itemsWithPrice.map((item) => ({
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price_kes: Number(item.unit_price_kes),
          subtotal_kes: Number(item.subtotal_kes),
        })),
      });
    } catch (emailError) {
      console.error("Order receipt email failed", emailError);
    }

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
