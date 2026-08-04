import { useEffect } from "react";
import { useRideRequestStore } from "@/store/ride-request.store";
import { fareService } from "@/services/ride/fare.service";
import { surgeService } from "@/services/surge";

/**
 * Keeps the live demand multiplier for the pickup point in the store.
 *
 * Refreshed when the pickup moves, not on every keystroke of the flow: the
 * multiplier is a property of where she is standing, and re-asking on each
 * step change would make the quoted price flicker while she chooses a car.
 */
export function useSurge() {
  const pickup = useRideRequestStore((s) => s.pickup);
  const setSurge = useRideRequestStore((s) => s.setSurge);
  const lat = pickup?.coords.lat;
  const lng = pickup?.coords.lng;

  useEffect(() => {
    if (lat === undefined || lng === undefined) {
      setSurge(1);
      return;
    }
    let cancelled = false;
    void surgeService.surgeAt({ lat, lng }).then((multiplier) => {
      if (!cancelled) setSurge(multiplier);
    });
    return () => {
      cancelled = true;
    };
  }, [lat, lng, setSurge]);
}

/** Recomputes the fare whenever the selected option, route or surge changes. */
export function useFareEstimate() {
  const route = useRideRequestStore((s) => s.route);
  const option = useRideRequestStore((s) => s.option);
  const surge = useRideRequestStore((s) => s.surge);
  const setFare = useRideRequestStore((s) => s.setFare);

  useSurge();

  useEffect(() => {
    if (!route || !option) {
      setFare(null);
      return;
    }
    let cancelled = false;
    void fareService.estimate(route, option, surge).then((fare) => {
      if (!cancelled) setFare(fare);
    });
    return () => {
      cancelled = true;
    };
  }, [route, option, surge, setFare]);
}
