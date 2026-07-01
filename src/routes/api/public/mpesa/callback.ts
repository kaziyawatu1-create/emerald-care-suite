import { createFileRoute } from "@tanstack/react-router";

type StkCallbackItem = { Name: string; Value?: string | number };
type StkBody = {
  Body?: {
    stkCallback?: {
      MerchantRequestID?: string;
      CheckoutRequestID?: string;
      ResultCode?: number;
      ResultDesc?: string;
      CallbackMetadata?: { Item?: StkCallbackItem[] };
    };
  };
};

export const Route = createFileRoute("/api/public/mpesa/callback")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let payload: StkBody = {};
        try {
          payload = (await request.json()) as StkBody;
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const cb = payload.Body?.stkCallback;
        if (!cb?.CheckoutRequestID) {
          return Response.json({ ResultCode: 0, ResultDesc: "Accepted" });
        }

        const items = cb.CallbackMetadata?.Item ?? [];
        const receipt = items.find((i) => i.Name === "MpesaReceiptNumber")?.Value as string | undefined;

        const status =
          cb.ResultCode === 0
            ? "success"
            : cb.ResultCode === 1032
              ? "cancelled"
              : cb.ResultCode === 1037
                ? "timeout"
                : "failed";

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: tx } = await supabaseAdmin
          .from("mpesa_transactions")
          .update({
            status,
            result_code: cb.ResultCode ?? null,
            result_desc: cb.ResultDesc ?? null,
            mpesa_receipt: receipt ?? null,
            raw_callback: JSON.parse(JSON.stringify(payload)),
            updated_at: new Date().toISOString(),
          })
          .eq("checkout_request_id", cb.CheckoutRequestID)
          .select("order_id")
          .maybeSingle();

        if (tx?.order_id) {
          await supabaseAdmin
            .from("orders")
            .update({
              payment_status: status === "success" ? "paid" : status === "cancelled" ? "cancelled" : "failed",
              order_status: status === "success" ? "confirmed" : "received",
            })
            .eq("id", tx.order_id);
        }

        return Response.json({ ResultCode: 0, ResultDesc: "Accepted" });
      },
    },
  },
});
