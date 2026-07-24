import { env } from "@/config/env";
import { MockSavedPlacesService, type ISavedPlacesService } from "./places.service";
import { SupabaseSavedPlacesService } from "./supabase-places.service";

export const savedPlacesService: ISavedPlacesService = env.useMocks
  ? new MockSavedPlacesService()
  : new SupabaseSavedPlacesService();

export type { ISavedPlacesService, NewSavedPlace } from "./places.service";
