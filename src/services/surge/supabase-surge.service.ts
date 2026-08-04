import { supabase } from "@/integrations/supabase/client";
import type { GeoPoint } from "@/types/ride";
import { NO_SURGE, type ISurgeService } from "./surge.service";

export class SupabaseSurgeService implements ISurgeService {
  async surgeAt(point: GeoPoint): Promise<number> {
    const { data, error } = await supabase.rpc("surge_at", {
      _lat: point.lat,
      _lng: point.lng,
    });
    // A pricing read that fails must not stop her booking, and must never
    // guess upwards: no answer means no surge.
    if (error) return NO_SURGE;
    const value = Number(data);
    return Number.isFinite(value) && value >= NO_SURGE ? value : NO_SURGE;
  }
}
