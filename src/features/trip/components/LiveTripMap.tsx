import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type * as Leaflet from "leaflet";
import type { GeoPoint } from "@/types/ride";
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
}

/**
 * Real interactive map showing the trip live: pickup, destination, and the
 * driver's streaming position. While the driver is en route the line runs
 * driver → pickup; once the trip starts it runs driver → destination. The map
 * auto-fits to keep every relevant point in view as the driver moves.
 *
 * Client-only (Leaflet touches window): the library is imported inside an
 * effect so it never runs during SSR. Free dark CARTO/OSM tiles — no API key.
 */
export function LiveTripMap({ pickup, destination, driver, phase, className }: LiveTripMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef<MapState | null>(null);
  // Latest props for the stable draw() to read, avoiding stale closures.
  const propsRef = useRef({ pickup, destination, driver, phase });
  propsRef.current = { pickup, destination, driver, phase };

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

    const target = ph === "on_trip" ? dest : pk;
    s.line.setLatLngs(
      drv
        ? [
            [drv.lat, drv.lng],
            [target.lat, target.lng],
          ]
        : [
            [pk.lat, pk.lng],
            [dest.lat, dest.lng],
          ],
    );

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
        weight: 3,
        opacity: 0.85,
        dashArray: "6 8",
      }).addTo(map);
      stateRef.current = { map, L, pickupM, destM, driverM: null, line };
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
      ref={containerRef}
      className={cn(
        "relative z-0 h-64 w-full overflow-hidden rounded-3xl border border-border/60 bg-noir shadow-soft",
        "[&_.leaflet-container]:h-full [&_.leaflet-container]:w-full [&_.leaflet-container]:bg-noir",
        className,
      )}
      role="img"
      aria-label="Live trip map"
    />
  );
}
