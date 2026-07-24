import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import type * as Leaflet from "leaflet";
import type { GeoPoint } from "@/types/ride";
import { haversineKm } from "@/lib/geo";
import { fetchRoadRoute } from "@/services/maps/osrm";
import { cn } from "@/lib/utils";

export type TripMapPhase = "to_pickup" | "on_trip";

interface LiveTripMapProps {
  readonly pickup: GeoPoint;
  readonly destination: GeoPoint;
  /** The driver's live position, or null before one is assigned/streaming. */
  readonly driver: (GeoPoint & { readonly heading?: number | null }) | null;
  readonly phase: TripMapPhase;
  readonly className?: string;
}

/** Pink pin for pickup, rose ring for destination, car puck for the driver. */
function markerIcon(
  L: typeof Leaflet,
  kind: "pickup" | "dest" | "driver",
  heading?: number | null,
) {
  if (kind === "driver") {
    const rot = typeof heading === "number" ? `transform:rotate(${heading}deg);` : "";
    return L.divIcon({
      className: "heride-marker",
      html: `<div style="width:34px;height:34px;border-radius:50%;background:linear-gradient(145deg,#ff8fbf,#ff5c9d);
        display:grid;place-items:center;box-shadow:0 0 0 4px rgba(255,111,165,.25),0 6px 16px rgba(0,0,0,.5);${rot}">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a0f14" stroke-width="2.2"
          stroke-linecap="round" stroke-linejoin="round"><path d="M5 17H3v-5l2-5h11l3 5h1v5h-2"/>
          <circle cx="7.5" cy="17" r="1.6"/><circle cx="16.5" cy="17" r="1.6"/></svg></div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    });
  }
  const color = kind === "pickup" ? "#ff6fa5" : "#f7a8c4";
  const inner =
    kind === "pickup"
      ? `<div style="width:12px;height:12px;border-radius:50%;background:${color};box-shadow:0 0 0 4px rgba(255,111,165,.25)"></div>`
      : `<div style="width:14px;height:14px;border-radius:50%;border:3px solid ${color};background:#1a0f14"></div>`;
  return L.divIcon({
    className: "heride-marker",
    html: `<div style="display:grid;place-items:center;width:22px;height:22px">${inner}</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

interface MapState {
  map: Leaflet.Map;
  L: typeof Leaflet;
  pickupM: Leaflet.Marker;
  destM: Leaflet.Marker;
  driverM: Leaflet.Marker | null;
  line: Leaflet.Polyline;
  lastRouteAt: number;
  lastOrigin: GeoPoint | null;
  lastPhase: TripMapPhase | null;
  routeSeq: number;
}

const fmtEta = (min: number) => (min < 1 ? "1 min" : `${Math.round(min)} min`);
const fmtKm = (km: number) => (km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`);

/**
 * Real interactive map showing the trip live: pickup, destination, and the
 * driver's streaming position. The route line FOLLOWS THE ROADS (fetched from
 * the free OSRM service) and shows live distance + ETA; if routing is briefly
 * unavailable it falls back to a straight line so the map always works. While
 * the driver is en route the line runs driver → pickup; once the trip starts
 * it runs driver → destination. Auto-fits as the driver moves.
 *
 * Client-only (Leaflet touches window): the library is imported inside an
 * effect so it never runs during SSR. Free dark CARTO/OSM tiles — no API key.
 */
export function LiveTripMap({ pickup, destination, driver, phase, className }: LiveTripMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef<MapState | null>(null);
  const propsRef = useRef({ pickup, destination, driver, phase });
  propsRef.current = { pickup, destination, driver, phase };
  const [eta, setEta] = useState<{ text: string; distance: string } | null>(null);

  function draw() {
    const s = stateRef.current;
    if (!s) return;
    const { L, map } = s;
    const { pickup: pk, destination: dest, driver: drv, phase: ph } = propsRef.current;

    if (drv) {
      if (!s.driverM) {
        s.driverM = L.marker([drv.lat, drv.lng], {
          icon: markerIcon(L, "driver", drv.heading),
        }).addTo(map);
      } else {
        s.driverM.setLatLng([drv.lat, drv.lng]);
        s.driverM.setIcon(markerIcon(L, "driver", drv.heading));
      }
    }

    const origin = drv ?? pk;
    const target = ph === "on_trip" ? dest : pk;

    // Straight line immediately (instant feedback / fallback), dashed.
    s.line.setLatLngs([
      [origin.lat, origin.lng],
      [target.lat, target.lng],
    ]);
    s.line.setStyle({ dashArray: "6 8" });

    // Fetch the road-following route, throttled: only when the origin moves
    // >120m, the target (phase) changes, or >20s elapsed — keeps requests low.
    const now = Date.now();
    const moved = !s.lastOrigin || haversineKm(s.lastOrigin, origin) > 0.12;
    if (moved || s.lastPhase !== ph || now - s.lastRouteAt > 20_000) {
      s.lastRouteAt = now;
      s.lastOrigin = origin;
      s.lastPhase = ph;
      const seq = ++s.routeSeq;
      void fetchRoadRoute(origin, target).then((route) => {
        const cur = stateRef.current;
        if (!cur || seq !== cur.routeSeq || !route) return;
        cur.line.setLatLngs(route.coordinates.map((c) => [c.lat, c.lng]));
        cur.line.setStyle({ dashArray: undefined });
        setEta({ text: fmtEta(route.durationMin), distance: fmtKm(route.distanceKm) });
      });
    }

    const pts: Leaflet.LatLngExpression[] = [
      [pk.lat, pk.lng],
      [dest.lat, dest.lng],
    ];
    if (drv) pts.push([drv.lat, drv.lng]);
    map.fitBounds(L.latLngBounds(pts), { padding: [42, 42], maxZoom: 15, animate: true });
  }

  // Initialize the map once, on the client.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const L = await import("leaflet");
      if (cancelled || !containerRef.current || stateRef.current) return;
      const { pickup: pk, destination: dest } = propsRef.current;
      const map = L.map(containerRef.current, {
        zoomControl: false,
        attributionControl: true,
        dragging: true,
      }).setView([pk.lat, pk.lng], 13);
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        subdomains: "abcd",
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap &copy; CARTO",
      }).addTo(map);
      const pickupM = L.marker([pk.lat, pk.lng], { icon: markerIcon(L, "pickup") }).addTo(map);
      const destM = L.marker([dest.lat, dest.lng], { icon: markerIcon(L, "dest") }).addTo(map);
      const line = L.polyline([], {
        color: "#ff6fa5",
        weight: 4,
        opacity: 0.9,
        lineJoin: "round",
      }).addTo(map);
      stateRef.current = {
        map,
        L,
        pickupM,
        destM,
        driverM: null,
        line,
        lastRouteAt: 0,
        lastOrigin: null,
        lastPhase: null,
        routeSeq: 0,
      };
      draw();
    })();
    return () => {
      cancelled = true;
      if (stateRef.current) {
        stateRef.current.map.remove();
        stateRef.current = null;
      }
    };
  }, []);

  // Redraw when the driver moves, the phase flips, or endpoints change.
  useEffect(() => {
    draw();
  }, [
    driver?.lat,
    driver?.lng,
    driver?.heading,
    phase,
    pickup.lat,
    pickup.lng,
    destination.lat,
    destination.lng,
  ]);

  return (
    <div
      className={cn(
        "relative z-0 h-64 w-full overflow-hidden rounded-3xl border border-border/60 bg-noir shadow-soft",
        "[&_.leaflet-container]:h-full [&_.leaflet-container]:w-full [&_.leaflet-container]:bg-noir",
        className,
      )}
    >
      <div ref={containerRef} className="h-full w-full" role="img" aria-label="Live trip map" />
      {eta && (
        <div className="pointer-events-none absolute left-3 top-3 rounded-full bg-noir/85 px-3 py-1.5 text-xs font-semibold text-foreground shadow-soft backdrop-blur">
          <span className="text-primary">{eta.text}</span> · {eta.distance}
        </div>
      )}
    </div>
  );
}
