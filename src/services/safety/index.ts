import { env } from "@/config/env";
import { MockSafetyService, type ISafetyService } from "./safety.service";
import { SupabaseSafetyService } from "./supabase-safety.service";

export const safetyService: ISafetyService = env.useMocks
  ? new MockSafetyService()
  : new SupabaseSafetyService();

export type { ISafetyService, TripShareLink } from "./safety.service";
