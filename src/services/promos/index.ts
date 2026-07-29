import { env } from "@/config/env";
import { MockPromoService, type IPromoService } from "./promo.service";
import { SupabasePromoService } from "./supabase-promo.service";

export const promoService: IPromoService = env.useMocks
  ? new MockPromoService()
  : new SupabasePromoService();

export type { ActivePromo, IPromoService, PromoPreview, ReferralInfo } from "./promo.service";
