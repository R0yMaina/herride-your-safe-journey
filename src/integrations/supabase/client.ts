import { createClient } from "@supabase/supabase-js";
import { env } from "@/config/env";
import type { Database } from "./types";

/**
 * Created lazily. The site is server-rendered, and building a client at module
 * load would make every page fail to render when the keys are absent — even
 * the eight pages that never touch Supabase. Only the contact form does.
 */
function createSupabaseClient() {
  const url = env.supabaseUrl || process.env.SUPABASE_URL;
  const key = env.supabasePublishableKey || process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY. Set them in .env, " +
        "or set VITE_USE_MOCKS=true to run the contact form against the mock.",
    );
  }

  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

let client: ReturnType<typeof createSupabaseClient> | undefined;

export const supabase = new Proxy({} as ReturnType<typeof createSupabaseClient>, {
  get(_, prop, receiver) {
    if (!client) client = createSupabaseClient();
    return Reflect.get(client, prop, receiver);
  },
});
