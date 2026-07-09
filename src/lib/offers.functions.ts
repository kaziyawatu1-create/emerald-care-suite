import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

function publicClient() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
  });
}

export const listOffers = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const { data, error } = await supabase
    .from("offers")
    .select("id,title,description,badge,discount,discount_percent,original_price,sale_price,expires_at,image,created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load offers", error);
    return [];
  }

  return data ?? [];
});

const offerInputSchema = z.object({
  id: z.string().min(1).optional(),
  title: z.string().min(1).max(160),
  description: z.string().max(600).optional().default(""),
  badge: z.string().max(60).optional().default(""),
  discount: z.string().max(80).optional().default(""),
  discount_percent: z.number().int().min(0).max(100).nullable().optional(),
  original_price: z.number().nonnegative().nullable().optional(),
  sale_price: z.number().nonnegative().nullable().optional(),
  expires_at: z.string().nullable().optional().default(""),
  image: z.string().optional().default(""),
});

export const upsertOffer = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => offerInputSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = {
      id: data.id,
      title: data.title,
      description: data.description || null,
      badge: data.badge || null,
      discount: data.discount || null,
      discount_percent: data.discount_percent ?? null,
      original_price: data.original_price ?? null,
      sale_price: data.sale_price ?? null,
      expires_at: data.expires_at || null,
      image: data.image || null,
    };

    const { data: saved, error } = await supabaseAdmin
      .from("offers")
      .upsert(payload, { onConflict: "id" })
      .select("id,title,description,badge,discount,discount_percent,original_price,sale_price,expires_at,image,created_at")
      .single();

    if (error) throw new Error(error.message);
    return saved;
  });

export const removeOffer = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ id: z.string().min(1) }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("offers").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

