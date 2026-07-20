import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/common";
import { useRideRequestStore } from "@/store/ride-request.store";
import { useRouteEstimate } from "../../hooks/useRouteEstimate";
import { PlacePicker } from "../../components/PlacePicker";
import { RouteMapPreview } from "../../components/RouteMapPreview";
import { BottomActionBar } from "../../components/BottomActionBar";
import { ConfirmButton } from "../../components/ConfirmButton";
import { StepHeader } from "../../components/StepHeader";
import { SAVED_PICKUPS, POPULAR_DESTINATIONS } from "../../data/saved-places";
import { useSavedPlaces } from "../../hooks/useSavedPlaces";
import { formatDistance, formatDuration } from "../../lib/format";

const CURRENT_LOCATION = SAVED_PICKUPS.find((p) => p.id === "p_current") ?? SAVED_PICKUPS[0];

export function LocationStep() {
  const pickup = useRideRequestStore((s) => s.pickup);
  const destination = useRideRequestStore((s) => s.destination);
  const route = useRideRequestStore((s) => s.route);
  const setPickup = useRideRequestStore((s) => s.setPickup);
  const setDestination = useRideRequestStore((s) => s.setDestination);
  const next = useRideRequestStore((s) => s.next);
  const { data: savedPlaces } = useSavedPlaces();

  // Current location first, then the user's saved places (popular spots as
  // suggestions until they've saved any).
  const pickupOptions = [CURRENT_LOCATION, ...(savedPlaces ?? [])];
  const destinationOptions = [...(savedPlaces ?? []), ...POPULAR_DESTINATIONS];

  const [initialised, setInitialised] = useState(false);
  useEffect(() => {
    if (initialised) return;
    if (!pickup) setPickup(CURRENT_LOCATION);
    setInitialised(true);
  }, [initialised, pickup, setPickup]);

  useRouteEstimate();

  const canContinue = Boolean(pickup && destination);

  return (
    <motion.div className="space-y-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <StepHeader
        title="Where to?"
        subtitle="Confirm pickup and destination to preview the route."
      />
      <RouteMapPreview route={route} />
      {route && (
        <GlassCard className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Route preview</span>
          <span className="text-foreground">
            {formatDistance(route.distanceKm)} · {formatDuration(route.durationMin)}
          </span>
        </GlassCard>
      )}
      <PlacePicker
        label="Pickup"
        kind="pickup"
        value={pickup}
        options={pickupOptions}
        onSelect={setPickup}
      />
      <PlacePicker
        label="Destination"
        kind="destination"
        value={destination}
        options={destinationOptions}
        onSelect={setDestination}
      />
      <BottomActionBar>
        <ConfirmButton disabled={!canContinue} onClick={next}>
          {canContinue ? "Continue" : "Choose a destination"}
        </ConfirmButton>
      </BottomActionBar>
    </motion.div>
  );
}
