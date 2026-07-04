import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth],
  requestMiddleware: [errorMiddleware],
}));

// Global process-level handlers to capture unexpected exceptions during dev
if (typeof process !== 'undefined' && process && typeof process.on === 'function') {
  process.on('uncaughtException', (err) => {
    console.error('uncaughtException', err instanceof Error ? err.stack ?? err.message : err);
  });
  process.on('unhandledRejection', (reason) => {
    console.error('unhandledRejection', reason instanceof Error ? reason.stack ?? reason.message : reason);
  });
}
