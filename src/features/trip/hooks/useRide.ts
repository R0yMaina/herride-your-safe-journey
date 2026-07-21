import { useEffect, useState } from "react";
import { ridesService } from "@/services/ride";
import type { RideRecord } from "@/types/ride";

interface UseRideResult {
  readonly ride: RideRecord | null;
  readonly loading: boolean;
  readonly error: string | null;
}

/** Fetches a ride once, then keeps it live via a realtime subscription. */
export function useRide(rideId: string | undefined): UseRideResult {
  const [ride, setRide] = useState<RideRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!rideId) return;
    let active = true;
    setLoading(true);
    ridesService
      .getById(rideId)
      .then((r) => {
        if (active) {
          setRide(r);
          setError(null);
        }
      })
      .catch((e) => active && setError(e instanceof Error ? e.message : "Failed to load ride"))
      .finally(() => active && setLoading(false));

    const sub = ridesService.subscribe(rideId, (updated) => {
      if (active) setRide(updated);
    });
    return () => {
      active = false;
      sub.unsubscribe();
    };
  }, [rideId]);

  return { ride, loading, error };
}
