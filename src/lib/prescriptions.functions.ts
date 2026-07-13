import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const createPrescriptionSchema = z.object({
  customer_name: z.string().min(2).max(120),
  customer_phone: z.string().min(7).max(20),
  prescription_data_url: z.string().min(20),
  prescription_filename: z.string().min(1).max(120),
});

const getPrescriptionSchema = z.object({
  id: z.string().min(1),
});

export const createPrescription = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => createPrescriptionSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const match = /^data:(.+?);base64,(.+)$/.exec(data.prescription_data_url);
    if (!match) throw new Error("Invalid prescription file data");

    const contentType = match[1];
    const bytes = Buffer.from(match[2], "base64");
    const ext = (contentType.split("/")[1] || "png").split("+")[0];
    const safeName = data.prescription_filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 60);
    const path = `prescriptions/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${safeName}.${ext}`;
    const bucketName = "product-images";

    const { error: uploadError } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(path, bytes, { contentType, upsert: false });
    if (uploadError) throw new Error(uploadError.message);

    const { data: signed, error: signedError } = await supabaseAdmin.storage
      .from(bucketName)
      .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
    if (signedError) throw new Error(signedError.message);

    const payload = {
      customer_name: data.customer_name,
      customer_phone: data.customer_phone,
      prescription_url: signed.signedUrl,
      prescription_path: path,
      uploaded_at: new Date().toISOString(),
    };

    const { data: saved, error: insertError } = await supabaseAdmin
      .from("prescriptions")
      .insert(payload)
      .select("id,customer_name,customer_phone,prescription_url,prescription_path,uploaded_at,created_at")
      .single();

    if (insertError) throw new Error(insertError.message);
    return saved;
  });

export const getPrescription = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => getPrescriptionSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: prescription, error } = await supabaseAdmin
      .from("prescriptions")
      .select("id,customer_name,customer_phone,prescription_url,prescription_path,uploaded_at,created_at")
      .eq("id", data.id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return prescription;
  });

export const listPrescriptions = createServerFn({ method: "GET" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: prescriptions, error } = await supabaseAdmin
      .from("prescriptions")
      .select("id,customer_name,customer_phone,prescription_url,prescription_path,uploaded_at,created_at")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return prescriptions ?? [];
  });
