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
  };
}

export const listServices = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("services")
    .select("id,name,description,type,location,price_kes,duration_minutes,test_results,status,created_at")
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
    };

    const { data: saved, error } = await supabaseAdmin
      .from("services")
      .upsert(payload, { onConflict: "id" })
      .select("id,name,description,type,location,price_kes,duration_minutes,test_results,status,created_at")
      .single();

      console.log("Upserted service:", saved, "Error:", error);

    if (error) throw new Error(error.message);
    return mapServiceRow(saved as any);
  });

export const removeService = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ id: z.string().min(1) }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("services").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });
