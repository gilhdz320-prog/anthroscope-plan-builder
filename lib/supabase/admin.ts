import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Admin client — uses the SERVICE_ROLE key.
// NEVER import this from a Client Component or page that renders to the browser.
// Only safe inside route handlers, server actions, and webhooks.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.",
    );
  }

  return createSupabaseClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
