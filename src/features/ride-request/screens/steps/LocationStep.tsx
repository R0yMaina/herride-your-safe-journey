import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Map as MapIcon } from "lucide-react";
import { GlassCard } from "@/components/common";
import { useRideRequestStore } from "@/store/ride-request.store";
import { useRouteEstimate } from "../../hooks/useRouteEstimate";
import { PlacePicker } from "../../components/PlacePicker";
import { AddressAutocomplete } from "../../components/AddressAutocomplete";
import { MapLocationPicker } from "../../components/MapLocationPicker";
import { RouteMapPreview } from "../../components/RouteMapPreview";
import { isGoogleMapsEnabled } from "@/services/maps/google-loader";
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
  const googleMaps = isGoogleMapsEnabled();
  const [mapPicker, setMapPicker] = useState<"pickup" | "destination" | null>(null);

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
      {googleMaps && (
        <AddressAutocomplete label="Pickup" kind="pickup" value={pickup} onSelect={setPickup} />
      )}
      <button
        type="button"
        onClick={() => setMapPicker("pickup")}
        className="flex w-full items-center gap-3 rounded-2xl border border-border/60 bg-card/60 px-4 py-3 text-left text-sm text-foreground backdrop-blur-xl hover:border-primary/60"
      >
        <MapIcon className="h-4 w-4 text-primary" />
        <span className="min-w-0 flex-1 truncate">
          {pickup ? `Pickup: ${pickup.label}` : "Set pickup on the map"}
        </span>
      </button>
      <PlacePicker
        label="Saved pickups"
        kind="pickup"
        value={pickup}
        options={pickupOptions}
        onSelect={setPickup}
      />
      {googleMaps && (
        <AddressAutocomplete
          label="Destination"
          kind="destination"
          value={destination}
          onSelect={setDestination}
        />
      )}
      <button
        type="button"
        onClick={() => setMapPicker("destination")}
        className="flex w-full items-center gap-3 rounded-2xl border border-border/60 bg-card/60 px-4 py-3 text-left text-sm text-foreground backdrop-blur-xl hover:border-primary/60"
      >
        <MapIcon className="h-4 w-4 text-primary" />
        <span className="min-w-0 flex-1 truncate">
          {destination ? `Destination: ${destination.label}` : "Set destination on the map"}
        </span>
      </button>
      <PlacePicker
        label="Saved destinations"
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

      {mapPicker && (
        <MapLocationPicker
          title={mapPicker === "pickup" ? "Set pickup" : "Set destination"}
          initial={
            (mapPicker === "pickup" ? pickup : destination)?.coords ?? pickup?.coords ?? null
          }
          onSelect={mapPicker === "pickup" ? setPickup : setDestination}
          onClose={() => setMapPicker(null)}
        />
      )}
    </motion.div>
  );
}
