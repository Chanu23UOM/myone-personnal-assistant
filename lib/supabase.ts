import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Server-only client. Uses the service_role key, which bypasses RLS —
// never import this from a Client Component or expose it to the browser.
//
// Lazily instantiated: Next.js evaluates route modules at build time to
// collect page data, which would otherwise crash on missing env vars before
// .env.local is ever filled in with real credentials.
let client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!client) {
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }
  return client;
}

export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getClient(), prop, receiver);
  },
});
