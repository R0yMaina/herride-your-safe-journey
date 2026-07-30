import { useEffect, useState } from "react";
import { useSearch } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Circle, MapPin, Plus, Square, X } from "lucide-react";
import { GlassCard } from "@/components/common";
import { MAX_STOPS, useRideRequestStore } from "@/store/ride-request.store";
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
  const { focus } = useSearch({ from: "/_app/book" });
  const pickup = useRideRequestStore((s) => s.pickup);
  const destination = useRideRequestStore((s) => s.destination);
  const stops = useRideRequestStore((s) => s.stops);
  const route = useRideRequestStore((s) => s.route);
  const setPickup = useRideRequestStore((s) => s.setPickup);
  const setDestination = useRideRequestStore((s) => s.setDestination);
  const addStop = useRideRequestStore((s) => s.addStop);
  const setStop = useRideRequestStore((s) => s.setStop);
  const removeStop = useRideRequestStore((s) => s.removeStop);
  const next = useRideRequestStore((s) => s.next);
  const { data: savedPlaces } = useSavedPlaces();

  const pickupRecents = [CURRENT_LOCATION, ...(savedPlaces ?? [])];
  const destinationRecents = [...(savedPlaces ?? []), ...POPULAR_DESTINATIONS];
  /** Which field the picker is editing: pickup, destination, or stop index. */
  const [mapPicker, setMapPicker] = useState<"pickup" | "destination" | number | null>(null);

  // Prefill pickup with current location so riders only pick a destination.
  const [initialised, setInitialised] = useState(false);
  useEffect(() => {
    if (initialised) return;
    if (!pickup) setPickup(CURRENT_LOCATION);
    // Arriving from the home screen's search field means she has already said
    // she wants to type a destination — opening the picker here saves the
    // second tap that made that field feel like it did nothing.
    if (focus === "destination" && !destination) setMapPicker("destination");
    setInitialised(true);
  }, [initialised, pickup, setPickup, focus, destination]);

  useRouteEstimate();

  const canContinue = Boolean(pickup && destination);

  return (
    <motion.div className="space-y-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <StepHeader title="Where to?" subtitle="Tap a field to search or set it on the map." />

      {/* Uber/Bolt-style connected pickup → stops → destination fields */}
      <GlassCard className="p-2">
        <div className="flex items-stretch gap-3">
          <div className="flex flex-col items-center pt-4">
            <Circle className="h-3 w-3 fill-primary text-primary" />
            <div className="my-1 w-px flex-1 bg-border" />
            {stops.map((s) => (
              <span key={s.id} className="contents">
                <Square className="h-2.5 w-2.5 fill-muted-foreground/60 text-muted-foreground/60" />
                <div className="my-1 w-px flex-1 bg-border" />
              </span>
            ))}
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
            {stops.map((stop, i) => (
              <span key={stop.id} className="contents">
                <div className="mx-2 h-px bg-border/60" />
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setMapPicker(i)}
                    className="min-w-0 flex-1 rounded-xl px-2 py-3 text-left hover:bg-white/5"
                  >
                    <span className="block text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                      Stop {i + 1}
                    </span>
                    <span className="block truncate text-sm text-foreground">{stop.label}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => removeStop(i)}
                    aria-label={`Remove stop ${i + 1}`}
                    className="p-2 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </span>
            ))}
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

      {destination && stops.length < MAX_STOPS && (
        <button
          type="button"
          onClick={() => setMapPicker(stops.length)}
          className="flex items-center gap-2 px-1 text-sm text-primary"
        >
          <Plus className="h-4 w-4" /> Add stop
        </button>
      )}

      <RouteMapPreview
        route={route}
        pickup={pickup?.coords ?? null}
        destination={destination?.coords ?? null}
        stops={stops.map((s) => s.coords)}
      />
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

      {mapPicker !== null && (
        <MapLocationPicker
          title={
            mapPicker === "pickup"
              ? "Set pickup"
              : mapPicker === "destination"
                ? "Set destination"
                : `Set stop ${mapPicker + 1}`
          }
          initial={
            (mapPicker === "pickup"
              ? pickup
              : mapPicker === "destination"
                ? destination
                : stops[mapPicker]
            )?.coords ??
            pickup?.coords ??
            null
          }
          recents={mapPicker === "pickup" ? pickupRecents : destinationRecents}
          onSelect={
            mapPicker === "pickup"
              ? setPickup
              : mapPicker === "destination"
                ? setDestination
                : (place) => (mapPicker < stops.length ? setStop(mapPicker, place) : addStop(place))
          }
          onClose={() => setMapPicker(null)}
        />
      )}
    </motion.div>
  );
}
