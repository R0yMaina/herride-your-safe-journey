import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Circle, MapPin } from "lucide-react";
import { GlassCard } from "@/components/common";
import { useRideRequestStore } from "@/store/ride-request.store";
import { useRouteEstimate } from "../../hooks/useRouteEstimate";
import { MapLocationPicker } from "../../components/MapLocationPicker";
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

  const pickupRecents = [CURRENT_LOCATION, ...(savedPlaces ?? [])];
  const destinationRecents = [...(savedPlaces ?? []), ...POPULAR_DESTINATIONS];
  const [mapPicker, setMapPicker] = useState<"pickup" | "destination" | null>(null);

  // Prefill pickup with current location so riders only pick a destination.
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
      <StepHeader title="Where to?" subtitle="Tap a field to search or set it on the map." />

      {/* Uber/Bolt-style connected pickup → destination fields */}
      <GlassCard className="p-2">
        <div className="flex items-stretch gap-3">
          <div className="flex flex-col items-center pt-4">
            <Circle className="h-3 w-3 fill-primary text-primary" />
            <div className="my-1 w-px flex-1 bg-border" />
            <MapPin className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <button
              type="button"
              onClick={() => setMapPicker("pickup")}
              className="w-full rounded-xl px-2 py-3 text-left hover:bg-white/5"
            >
              <span className="block text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                Pickup
              </span>
              <span className="block truncate text-sm text-foreground">
                {pickup ? pickup.label : "Add pickup point"}
              </span>
            </button>
            <div className="mx-2 h-px bg-border/60" />
            <button
              type="button"
              onClick={() => setMapPicker("destination")}
              className="w-full rounded-xl px-2 py-3 text-left hover:bg-white/5"
            >
              <span className="block text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                Destination
              </span>
              <span
                className={`block truncate text-sm ${destination ? "text-foreground" : "text-primary"}`}
              >
                {destination ? destination.label : "Where to?"}
              </span>
            </button>
          </div>
        </div>
      </GlassCard>

      <RouteMapPreview route={route} />
      {route && (
        <GlassCard className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Trip estimate</span>
          <span className="text-foreground">
            {formatDistance(route.distanceKm)} · {formatDuration(route.durationMin)}
          </span>
        </GlassCard>
      )}

      <BottomActionBar>
        <ConfirmButton disabled={!canContinue} onClick={next}>
          {canContinue ? "Choose a ride" : "Set your destination"}
        </ConfirmButton>
      </BottomActionBar>

      {mapPicker && (
        <MapLocationPicker
          title={mapPicker === "pickup" ? "Set pickup" : "Set destination"}
          initial={
            (mapPicker === "pickup" ? pickup : destination)?.coords ?? pickup?.coords ?? null
          }
          recents={mapPicker === "pickup" ? pickupRecents : destinationRecents}
          onSelect={mapPicker === "pickup" ? setPickup : setDestination}
          onClose={() => setMapPicker(null)}
        />
      )}
    </motion.div>
  );
}
