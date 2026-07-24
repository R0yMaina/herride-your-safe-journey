import { useEffect, useState } from "react";
import { driverService, type DriverLiveLocation } from "@/services/driver";

/**
 * Streams the assigned driver's GPS position to the passenger: one initial
 * fetch, then live updates from the driver's heartbeat pings. Pass null to
 * disable (no driver assigned yet, or trip over) — the subscription is torn
 * down so no idle sockets linger.
 */
export function useDriverLocation(driverUserId: string | null): DriverLiveLocation | null {
  const [location, setLocation] = useState<DriverLiveLocation | null>(null);

  useEffect(() => {
    if (!driverUserId) {
      setLocation(null);
      return;
    }
    let active = true;
    driverService
      .getDriverLocation(driverUserId)
      .then((loc) => active && loc && setLocation(loc))
      .catch(() => {
        /* location is progressive enhancement; the trip screen works without it */
      });
    const sub = driverService.subscribeDriverLocation(driverUserId, (loc) => {
      if (active) setLocation(loc);
    });
    return () => {
      active = false;
      sub.unsubscribe();
    };
  }, [driverUserId]);

  return location;
}
