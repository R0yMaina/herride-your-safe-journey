import { env } from "@/config/env";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/store/auth.store";
import { logger } from "@/lib/logger";
import { buildAuthSession } from "./supabase-auth.service";

let started = false;

/**
 * One-time client-side reconciliation between Supabase's persisted session
 * and the auth store, plus a listener that keeps them in sync afterwards
 * (token refresh, cross-tab sign-out, recovery links). No-op in mock mode.
 */
export function initAuthSync(): void {
  if (started || env.useMocks || typeof window === "undefined") return;
  started = true;

  void supabase.auth.getSession().then(async ({ data: { session } }) => {
    const store = useAuthStore.getState();
    if (session) {
      try {
        store.setSession(await buildAuthSession(session));
      } catch (err) {
        logger.error("auth.bootstrap.hydrate_failed", { err: String(err) });
        store.clear();
      }
    } else if (store.status === "loading" || store.session) {
      store.clear();
    }
  });

  supabase.auth.onAuthStateChange((event, session) => {
    // Defer store updates out of the callback per supabase-js guidance
    // (async work inside onAuthStateChange can deadlock the client).
    setTimeout(() => {
      const store = useAuthStore.getState();
      if (event === "SIGNED_OUT") {
        store.clear();
        return;
      }
      if ((event === "TOKEN_REFRESHED" || event === "USER_UPDATED") && session) {
        void buildAuthSession(session).then(
          (s) => useAuthStore.getState().setSession(s),
          (err) => logger.error("auth.bootstrap.refresh_failed", { err: String(err) }),
        );
      }
    }, 0);
  });
}
