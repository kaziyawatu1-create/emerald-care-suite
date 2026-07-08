import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const listOffers = createServerFn({ method: "GET" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("offers")
      .select("id,title,description,discount,badge,image,expires_at,created_at")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("listOffers error", error.message);
      return [];
    }
    return data ?? [];
  });

const createOfferInput = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  discount: z.string().max(50).optional().nullable(),
  badge: z.string().max(50).optional().nullable(),
  image: z.string().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
});

const updateOfferInput = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  discount: z.string().max(50).optional().nullable(),
  badge: z.string().max(50).optional().nullable(),
  image: z.string().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
});

const deleteOfferInput = z.object({
  id: z.string().min(1),
});

export const createOffer = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => createOfferInput.parse(input))
  .handler(async ({ data }: any) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = {
      title: data.title,
      description: data.description ?? null,
      discount: data.discount ?? null,
      badge: data.badge ?? null,
      image: data.image ?? null,
      expires_at: data.expiresAt ? new Date(data.expiresAt).toISOString() : null,
      created_by: null,
    };
    const { data: saved, error } = await supabaseAdmin.from("offers").insert(payload).select("id,title,description,discount,badge,image,expires_at,created_at").single();
    if (error) throw new Error(error.message);
    return saved;
  });

export const updateOffer = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => updateOfferInput.parse(input))
  .handler(async ({ data }: any) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = {
      title: data.title,
      description: data.description ?? null,
      discount: data.discount ?? null,
      badge: data.badge ?? null,
      image: data.image ?? null,
      expires_at: data.expiresAt ? new Date(data.expiresAt).toISOString() : null,
    };
    const { data: updated, error } = await supabaseAdmin.from("offers").update(payload).eq("id", data.id).select("id,title,description,discount,badge,image,expires_at,created_at").single();
    if (error) throw new Error(error.message);
    return updated;
  });

export const deleteOffer = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => deleteOfferInput.parse(input))
  .handler(async ({ data }: any) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("offers").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { id: data.id };
  });
