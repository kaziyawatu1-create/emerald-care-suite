import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { type ServiceItem } from "./services";

export type ServiceCategoryItem = {
  id: string;
  name: string;
  createdAt: string;
};

function mapServiceRow(row: {
  id: string;
  name: string;
  price_kes: number;
  duration_minutes: number;
  icon_url?: string | null;
  service_category_id?: string | null;
  created_at: string;
}): ServiceItem {
  return {
    id: row.id,
    name: row.name,
    price_kes: Number(row.price_kes),
    duration_minutes: row.duration_minutes,
    icon_url: typeof row.icon_url === "string" && row.icon_url.trim() ? row.icon_url : null,
    service_category_id: typeof row.service_category_id === "string" ? row.service_category_id : null,
    createdAt: row.created_at,
  };
}

function mapServiceCategoryRow(row: { id: string; name: string; created_at: string }): ServiceCategoryItem {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
  };
}

export const listServices = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("services")
    .select("id,name,price_kes,duration_minutes,icon_url,service_category_id,created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load services", error);
    return [] as ServiceItem[];
  }

  return (data ?? []).map((row) => mapServiceRow(row as any));
});

export const listServiceCategories = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("service_categories")
    .select("id,name,created_at")
    .order("name", { ascending: true });

  if (error) {
    console.error("Failed to load service categories", error);
    return [] as ServiceCategoryItem[];
  }

  return (data ?? []).map((row) => mapServiceCategoryRow(row as any));
});

const serviceInputSchema = z.object({
  id: z.string().min(1).optional(),
  name: z.string().min(1).max(160),
  price_kes: z.number().min(0),
  duration_minutes: z.number().int().min(1),
  service_category_id: z.string().uuid().nullable().optional().default(null),
  icon_url: z.string().min(1).nullable().optional().default(null),
});

const serviceCategoryInputSchema = z.object({
  id: z.string().min(1).optional(),
  name: z.string().min(1).max(120),
});

export const upsertService = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => serviceInputSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const payload = {
      id: data.id,
      name: data.name,
      price_kes: Number(data.price_kes),
      duration_minutes: Number(data.duration_minutes),
      service_category_id: data.service_category_id ?? null,
      icon_url: data.icon_url ?? null,
    } as Record<string, unknown>;

    const { data: saved, error } = await supabaseAdmin
      .from("services")
      .upsert(payload as any, { onConflict: "id" })
      .select("id,name,price_kes,duration_minutes,icon_url,service_category_id,created_at")
      .single();

    if (error) throw new Error(error.message);
    return mapServiceRow(saved as any);
  });

export const upsertServiceCategory = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => serviceCategoryInputSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const payload = {
      id: data.id,
      name: data.name.trim(),
    } as Record<string, unknown>;

    const { data: saved, error } = await supabaseAdmin
      .from("service_categories")
      .upsert(payload as any, { onConflict: "id" })
      .select("id,name,created_at")
      .single();

    if (error) throw new Error(error.message);
    return mapServiceCategoryRow(saved as any);
  });

const uploadServiceImageSchema = z.object({
  data_url: z.string().min(20),
  filename: z.string().min(1).max(120).optional(),
});

export const uploadServiceImage = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => uploadServiceImageSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const match = /^data:(.+?);base64,(.+)$/.exec(data.data_url);
    if (!match) throw new Error("Invalid image data");
    const contentType = match[1];
    const bytes = Buffer.from(match[2], "base64");
    const ext = (contentType.split("/")[1] || "png").split("+")[0];
    const safeName = (data.filename ?? "icon").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 60);
    const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${safeName}.${ext}`;

    const { error: upErr } = await supabaseAdmin.storage.from("product-images").upload(path, bytes, { contentType, upsert: false });
    if (upErr) throw new Error(upErr.message);

    const { data: signed, error: signErr } = await supabaseAdmin.storage
      .from("product-images")
      .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
    if (signErr) throw new Error(signErr.message);

    return { url: signed.signedUrl, path };
  });

export const removeService = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ id: z.string().min(1) }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("services").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });
