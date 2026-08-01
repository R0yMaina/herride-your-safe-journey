import { env } from "@/config/env";
import { MockSurgeService } from "./surge.service";
import type { ISurgeService } from "./surge.service";
import { SupabaseSurgeService } from "./supabase-surge.service";

export const surgeService: ISurgeService = env.useMocks
  ? new MockSurgeService()
  : new SupabaseSurgeService();

export { NO_SURGE, SURGE_VISIBLE_AT, formatSurge, isSurging } from "./surge.service";
export type { ISurgeService } from "./surge.service";
