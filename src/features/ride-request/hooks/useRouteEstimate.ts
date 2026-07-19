import { useEffect } from "react";
import { useRideRequestStore } from "@/store/ride-request.store";
import { tripService } from "@/services/ride/trip.service";

/** Fetches a route estimate any time both endpoints are set. */
export function useRouteEstimate() {
  const pickup = useRideRequestStore((s) => s.pickup);
  const destination = useRideRequestStore((s) => s.destination);
  const setRoute = useRideRequestStore((s) => s.setRoute);

  useEffect(() => {
    if (!pickup || !destination) {
      setRoute(null);
      return;
    }
    let cancelled = false;
    void tripService.estimateRoute(pickup, destination).then((r) => {
      if (!cancelled) setRoute(r);
    });
    return () => {
      cancelled = true;
    };
  }, [pickup, destination, setRoute]);
}
