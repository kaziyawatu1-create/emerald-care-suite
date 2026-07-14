import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { type ServiceItem, type ServiceStatus, type ServiceType } from "./services";
import { console } from "inspector/promises";

function publicClient() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
  });
}

function mapServiceRow(row: {
  id: string;
  name: string;
  description: string;
  type: ServiceType;
  price_kes: number;
  duration_minutes: number;
  test_results: string;
  status: ServiceStatus;
  location?: string;
  created_at: string;
  image_urls?: string[] | null;
}): ServiceItem {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    type: row.type,
    price_kes: Number(row.price_kes),
    duration_minutes: row.duration_minutes,
    test_results: row.test_results,
    status: row.status,
    location: (row.location as ServiceItem["location"]) ?? "lab-only",
    createdAt: row.created_at,
    image_urls: Array.isArray(row.image_urls) ? row.image_urls.slice(0, 2) : [],
  };
}

export const listServices = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("services")
    .select("id,name,description,type,location,price_kes,duration_minutes,test_results,status,image_urls,created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load services", error);
    return [] as ServiceItem[];
  }

  return (data ?? []).map((row) => mapServiceRow(row as any));
});

const serviceInputSchema = z.object({
  id: z.string().min(1).optional(),
  name: z.string().min(1).max(160),
  description: z.string().max(1000).optional().default(""),
  type: z.enum(["inhouse", "at-home", "hybrid"]),
  location: z.enum(["lab-only", "office", "home"]).optional().default("lab-only"),
  price_kes: z.number().min(0),
  duration_minutes: z.number().int().min(1),
  test_results: z.string().max(1000).optional().default(""),
  status: z.enum(["active", "inactive", "pending"]).optional().default("active"),
  image_urls: z.array(z.string().min(1)).max(2).optional().default([]),
});

export const upsertService = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => serviceInputSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const payload = {
      id: data.id,
      name: data.name,
      description: data.description ?? "",
      type: data.type,
      location: data.location ?? "lab-only",
      price_kes: Number(data.price_kes),
      duration_minutes: Number(data.duration_minutes),
      test_results: data.test_results ?? "",
      status: data.status ?? "active",
      image_urls: Array.isArray(data.image_urls) ? data.image_urls.slice(0, 2) : [],
    } as Record<string, unknown>;

    const { data: saved, error } = await supabaseAdmin
      .from("services")
      .upsert(payload as any, { onConflict: "id" })
      .select("id,name,description,type,location,price_kes,duration_minutes,test_results,status,image_urls,created_at")
      .single();

      console.log("Upserted service:", saved, "Error:", error);

    if (error) throw new Error(error.message);
    return mapServiceRow(saved as any);
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
    const safeName = (data.filename ?? "image").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 60);
    const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${safeName}.${ext}`;

    const { error: upErr } = await supabaseAdmin.storage.from("product-images").upload(path, bytes, { contentType, upsert: false });
    if (upErr) throw new Error(upErr.message);

    const { data: signed, error: signErr } = await supabaseAdmin.storage.from("product-images").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
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
