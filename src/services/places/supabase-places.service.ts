import { supabase } from "@/integrations/supabase/client";
import type { Place } from "@/types/ride";
import type { ISavedPlacesService, NewSavedPlace } from "./places.service";

async function currentUserId(): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error(error?.message ?? "Not signed in");
  return user.id;
}

export class SupabaseSavedPlacesService implements ISavedPlacesService {
  async list(): Promise<readonly Place[]> {
    const { data, error } = await supabase
      .from("saved_places")
      .select("id, label, address, lat, lng")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => ({
      id: row.id,
      label: row.label,
      address: row.address ?? "",
      coords: { lat: row.lat, lng: row.lng },
    }));
  }

  async add(place: NewSavedPlace): Promise<Place> {
    const userId = await currentUserId();
    const { data, error } = await supabase
      .from("saved_places")
      .insert({
        user_id: userId,
        label: place.label,
        address: place.address,
        lat: place.coords.lat,
        lng: place.coords.lng,
      })
      .select("id, label, address, lat, lng")
      .single();
    if (error) throw new Error(error.message);
    return {
      id: data.id,
      label: data.label,
      address: data.address ?? "",
      coords: { lat: data.lat, lng: data.lng },
    };
  }

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("saved_places").delete().eq("id", id);
    if (error) throw new Error(error.message);
  }
}
