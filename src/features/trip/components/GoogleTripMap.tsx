import { useEffect, useRef } from "react";
import type { GeoPoint } from "@/types/ride";
import { haversineKm } from "@/lib/geo";
import { loadGoogleMaps } from "@/services/maps/google-loader";
import { cn } from "@/lib/utils";
import type { TripMapPhase } from "./LiveTripMap";

interface GoogleTripMapProps {
  readonly pickup: GeoPoint;
  readonly destination: GeoPoint;
  readonly driver: (GeoPoint & { readonly heading?: number | null }) | null;
  readonly phase: TripMapPhase;
  /** Fired with the human ETA text ("7 mins") whenever the route recomputes. */
  readonly onEta?: (eta: { text: string; distanceText: string } | null) => void;
  readonly className?: string;
}

/** Dark map styling to match the HeRide aesthetic. */
const DARK_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#171114" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#b79aa4" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0e0809" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#2a1e23" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#8a6f79" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0b1620" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
];

function svgIcon(g: typeof google, kind: "pickup" | "dest" | "driver"): google.maps.Icon {
  const svg =
    kind === "driver"
      ? `<svg xmlns='http://www.w3.org/2000/svg' width='36' height='36'><circle cx='18' cy='18' r='11' fill='%23ff5c9d' stroke='%23ffffff' stroke-opacity='0.5' stroke-width='2'/></svg>`
      : kind === "pickup"
        ? `<svg xmlns='http://www.w3.org/2000/svg' width='22' height='22'><circle cx='11' cy='11' r='6' fill='%23ff6fa5'/></svg>`
        : `<svg xmlns='http://www.w3.org/2000/svg' width='22' height='22'><circle cx='11' cy='11' r='6' fill='none' stroke='%23f7a8c4' stroke-width='3'/></svg>`;
  const size = kind === "driver" ? 36 : 22;
  return {
    url: `data:image/svg+xml;utf8,${svg}`,
    scaledSize: new g.maps.Size(size, size),
    anchor: new g.maps.Point(size / 2, size / 2),
  };
}

interface State {
  g: typeof google;
  map: google.maps.Map;
  pickupM: google.maps.Marker;
  destM: google.maps.Marker;
  driverM: google.maps.Marker | null;
  directions: google.maps.DirectionsService;
  renderer: google.maps.DirectionsRenderer;
  lastRouteAt: number;
  lastOrigin: GeoPoint | null;
}

/**
 * Google Maps trip view: real road-following route (Directions API), live
 * driver marker, and ETA. Same prop shape as LiveTripMap so the two are
 * interchangeable behind the map-provider flag. Directions are throttled
 * (recompute only on a meaningful driver move / phase change / time) to keep
 * API usage low. Client-only — Google SDK loads inside the effect.
 */
export function GoogleTripMap({
  pickup,
  destination,
  driver,
  phase,
  onEta,
  className,
}: GoogleTripMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef<State | null>(null);
  const propsRef = useRef({ pickup, destination, driver, phase, onEta });
  propsRef.current = { pickup, destination, driver, phase, onEta };

  function draw() {
    const s = stateRef.current;
    if (!s) return;
    const { g, map } = s;
    const { pickup: pk, destination: dest, driver: drv, phase: ph, onEta: eta } = propsRef.current;

    if (drv) {
      const pos = { lat: drv.lat, lng: drv.lng };
      if (!s.driverM) {
        s.driverM = new g.maps.Marker({
          map,
          position: pos,
          icon: svgIcon(g, "driver"),
          zIndex: 3,
        });
      } else {
        s.driverM.setPosition(pos);
      }
    }

    const origin = drv ?? pk;
    const target = ph === "on_trip" ? dest : pk;

    // Throttle Directions: recompute only if origin moved >120m, phase's
    // target changed, or >20s elapsed.
    const now = Date.now();
    const moved = !s.lastOrigin || haversineKm(s.lastOrigin, origin) > 0.12;
    if (moved || now - s.lastRouteAt > 20_000) {
      s.lastRouteAt = now;
      s.lastOrigin = origin;
      s.directions.route(
        {
          origin,
          destination: target,
          travelMode: g.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === "OK" && result) {
            s.renderer.setDirections(result);
            const leg = result.routes[0]?.legs[0];
            eta?.(
              leg?.duration
                ? { text: leg.duration.text, distanceText: leg.distance?.text ?? "" }
                : null,
            );
          } else {
            // Directions unavailable (e.g. API not enabled) — fall back to a
            // straight line so the map still shows the connection.
            s.renderer.setDirections({ routes: [] } as unknown as google.maps.DirectionsResult);
            eta?.(null);
          }
        },
      );
    }

    const bounds = new g.maps.LatLngBounds();
    bounds.extend(pk);
    bounds.extend(dest);
    if (drv) bounds.extend({ lat: drv.lat, lng: drv.lng });
    map.fitBounds(bounds, 48);
  }

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const g = await loadGoogleMaps();
        if (cancelled || !containerRef.current || stateRef.current) return;
        const { pickup: pk, destination: dest } = propsRef.current;
        const map = new g.maps.Map(containerRef.current, {
          center: pk,
          zoom: 13,
          disableDefaultUI: true,
          gestureHandling: "greedy",
          styles: DARK_STYLE,
          backgroundColor: "#0e0809",
        });
        const renderer = new g.maps.DirectionsRenderer({
          map,
          suppressMarkers: true,
          preserveViewport: true,
          polylineOptions: { strokeColor: "#ff6fa5", strokeWeight: 4, strokeOpacity: 0.9 },
        });
        stateRef.current = {
          g,
          map,
          pickupM: new g.maps.Marker({ map, position: pk, icon: svgIcon(g, "pickup"), zIndex: 2 }),
          destM: new g.maps.Marker({ map, position: dest, icon: svgIcon(g, "dest"), zIndex: 2 }),
          driverM: null,
          directions: new g.maps.DirectionsService(),
          renderer,
          lastRouteAt: 0,
          lastOrigin: null,
        };
        draw();
      } catch {
        /* No key / not enabled — the TripMap selector falls back to Leaflet. */
      }
    })();
    return () => {
      cancelled = true;
      stateRef.current = null;
    };
  }, []);

  useEffect(() => {
    draw();
  }, [driver?.lat, driver?.lng, phase, pickup.lat, pickup.lng, destination.lat, destination.lng]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative z-0 h-64 w-full overflow-hidden rounded-3xl border border-border/60 bg-noir shadow-soft",
        className,
      )}
      role="img"
      aria-label="Live trip map"
    />
  );
}
