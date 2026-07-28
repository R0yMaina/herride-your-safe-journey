import { supabase } from "@/integrations/supabase/client";
import type { RideRecord } from "@/types/ride";
import type { IRidesService, RideSubscription } from "./rides.service";
import { mapRideRow } from "./ride-mapper";

export class SupabaseRidesService implements IRidesService {
  async listMine(): Promise<readonly RideRecord[]> {
    // RLS scopes this to rides where the user is passenger or driver.
    const { data, error } = await supabase
      .from("rides")
      .select("*")
      .order("requested_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapRideRow);
  }

  async getById(id: string): Promise<RideRecord | null> {
    const { data, error } = await supabase.from("rides").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapRideRow(data) : null;
  }

  async getPickupPin(rideId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from("ride_pins")
      .select("pin")
      .eq("ride_id", rideId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data?.pin ?? null;
  }

  subscribe(id: string, onChange: (ride: RideRecord) => void): RideSubscription {
    const channel = supabase
      .channel(`ride:${id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rides", filter: `id=eq.${id}` },
        (payload) => onChange(mapRideRow(payload.new as never)),
      )
      .subscribe();
    return {
      unsubscribe: () => {
        void supabase.removeChannel(channel);
      },
    };
  }
}
