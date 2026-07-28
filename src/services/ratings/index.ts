import { env } from "@/config/env";
import { MockRatingService, type IRatingService } from "./rating.service";
import { SupabaseRatingService } from "./supabase-rating.service";

export const ratingService: IRatingService = env.useMocks
  ? new MockRatingService()
  : new SupabaseRatingService();

export {
  COMPLIMENT_OPTIONS,
  TIP_PRESETS,
  type IRatingService,
  type RideRating,
  type SubmitRatingInput,
} from "./rating.service";
