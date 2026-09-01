import { supabase } from "@/integrations/supabase/client";
import type {
  EmergencyContacts,
  ISafetyService,
  TripAnomaly,
  TripShareLink,
} from "./safety.service";

function shareUrl(token: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/share/${token}`;
}

export class SupabaseSafetyService implements ISafetyService {
  async listAnomalies(rideId: string): Promise<readonly TripAnomaly[]> {
    const { data, error } = await supabase.rpc("my_trip_anomalies", { _ride_id: rideId });
    // A monitoring read that fails must never break the trip screen.
    if (error) return [];
    return (data ?? []).map((r) => ({
      id: r.id,
      kind: r.kind as TripAnomaly["kind"],
      detail: (r.detail ?? {}) as Record<string, unknown>,
      createdAt: r.created_at,
    }));
  }

  async acknowledgeAnomaly(anomalyId: string): Promise<void> {
    const { error } = await supabase.rpc("acknowledge_trip_anomaly", { _id: anomalyId });
    if (error) throw new Error(error.message);
  }

  async getEmergencyContacts(): Promise<EmergencyContacts> {
    const { data, error } = await supabase.rpc("my_emergency_contacts");
    // Never let this failure block the panic screen — she still gets 999.
    if (error) return { contacts: [], emergencyNumber: "999" };
    const rows = data ?? [];
    return {
      contacts: rows.map((r) => ({
        name: r.name,
        phone: r.phone,
        isAppUser: Boolean(r.is_app_user),
      })),
      emergencyNumber: rows[0]?.emergency_number ?? "999",
    };
  }

  async raiseSos(rideId: string, coords?: { lat: number; lng: number }): Promise<string> {
    const { data, error } = await supabase.rpc("raise_sos", {
      _ride_id: rideId,
      _lat: coords?.lat,
      _lng: coords?.lng,
    });
    if (error) throw new Error(error.message);
    return (data as { id: string }).id;
  }

  async shareTrip(rideId: string): Promise<TripShareLink> {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) throw new Error(authError?.message ?? "Not signed in");

    // Reuse an existing unexpired link for this ride if present.
    const existing = await supabase
      .from("trip_shares")
      .select("share_token, expires_at")
      .eq("ride_id", rideId)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existing.data) {
      return {
        token: existing.data.share_token,
        url: shareUrl(existing.data.share_token),
        expiresAt: existing.data.expires_at,
      };
    }

    const { data, error } = await supabase
      .from("trip_shares")
      .insert({ ride_id: rideId, created_by: user.id })
      .select("share_token, expires_at")
      .single();
    if (error) throw new Error(error.message);
    return { token: data.share_token, url: shareUrl(data.share_token), expiresAt: data.expires_at };
  }
}
