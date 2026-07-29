import { supabase } from "@/integrations/supabase/client";
import type { ActivePromo, IPromoService, PromoPreview, ReferralInfo } from "./promo.service";

function referralUrl(code: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/welcome?ref=${encodeURIComponent(code)}`;
}

export class SupabasePromoService implements IPromoService {
  async listActive(): Promise<readonly ActivePromo[]> {
    const now = new Date().toISOString();
    // RLS already restricts this table to `active = true`; the date window is
    // the part it can't express, so filter it here.
    const { data, error } = await supabase
      .from("promo_codes")
      .select("code, description, discount_type, value")
      .lte("starts_at", now)
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .order("created_at", { ascending: false })
      .limit(5);
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => ({
      code: row.code,
      headline:
        row.discount_type === "fixed"
          ? `KES ${Number(row.value)} off your ride`
          : `${Number(row.value)}% off your ride`,
      description: row.description,
    }));
  }

  async validate(code: string, subtotal: number): Promise<PromoPreview> {
    const { data, error } = await supabase.rpc("validate_promo", {
      _code: code.trim().toUpperCase(),
      _subtotal: subtotal,
    });
    if (error) throw new Error(error.message);
    const row = (Array.isArray(data) ? data[0] : data) as
      | { code: string; label: string; discount: number }
      | undefined;
    if (!row) throw new Error("Invalid promo code");
    return { code: row.code, label: row.label, discount: Number(row.discount) };
  }

  async applyToRide(rideId: string, code: string): Promise<number> {
    const { data, error } = await supabase.rpc("apply_promo", {
      _ride_id: rideId,
      _code: code.trim().toUpperCase(),
    });
    if (error) throw new Error(error.message);
    return Number(data ?? 0);
  }

  async getReferralInfo(): Promise<ReferralInfo> {
    const { data, error } = await supabase.rpc("get_referral_code");
    if (error) throw new Error(error.message);
    const code = String(data);
    return { code, url: referralUrl(code) };
  }

  async redeemReferral(code: string): Promise<void> {
    const { error } = await supabase.rpc("redeem_referral", {
      _code: code.trim().toUpperCase(),
    });
    if (error) throw new Error(error.message);
  }
}
