import { useEffect } from "react";
import { useRideRequestStore } from "@/store/ride-request.store";
import { tripService } from "@/services/ride/trip.service";

/** Fetches a route estimate any time the endpoints (or stops) change. */
export function useRouteEstimate() {
  const pickup = useRideRequestStore((s) => s.pickup);
  const destination = useRideRequestStore((s) => s.destination);
  const stops = useRideRequestStore((s) => s.stops);
  const setRoute = useRideRequestStore((s) => s.setRoute);

  useEffect(() => {
    if (!pickup || !destination) {
      setRoute(null);
      return;
    }
    let cancelled = false;
    void tripService.estimateRoute(pickup, destination, stops).then((r) => {
      if (!cancelled) setRoute(r);
    });
    return () => {
      cancelled = true;
    };
  }, [pickup, destination, stops, setRoute]);
}
