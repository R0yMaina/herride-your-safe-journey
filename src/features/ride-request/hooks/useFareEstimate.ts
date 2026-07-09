import { useEffect } from "react";
import { useRideRequestStore } from "@/store/ride-request.store";
import { fareService } from "@/services/ride/fare.service";

/** Recomputes the fare whenever the selected option or route changes. */
export function useFareEstimate() {
  const route = useRideRequestStore((s) => s.route);
  const option = useRideRequestStore((s) => s.option);
  const setFare = useRideRequestStore((s) => s.setFare);

  useEffect(() => {
    if (!route || !option) {
      setFare(null);
      return;
    }
    let cancelled = false;
    void fareService.estimate(route, option).then((fare) => {
      if (!cancelled) setFare(fare);
    });
    return () => {
      cancelled = true;
    };
  }, [route, option, setFare]);
}