import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import type * as Leaflet from "leaflet";
import { LocateFixed } from "lucide-react";
import type { GeoPoint, RouteEstimate } from "@/types/ride";
import { basemapTiles } from "@/services/maps/tiles";
import { FALLBACK_CENTER } from "@/lib/geo";
import { useThemeStore } from "@/store/theme.store";
import { cn } from "@/lib/utils";

interface RouteMapPreviewProps {
  readonly route: RouteEstimate | null;
  /** Pickup, shown even before a route exists. */
  readonly pickup?: GeoPoint | null;
  /** Destination, shown even before a route exists. */
  readonly destination?: GeoPoint | null;
  /** Intermediate stops, in order. */
  readonly stops?: readonly GeoPoint[];
  readonly className?: string;
}

/** Pickup dot, destination ring, stop tick — same language as the trip map. */
function endpointIcon(L: typeof Leaflet, kind: "pickup" | "dest" | "stop") {
  const color = kind === "pickup" ? "#8b5cf6" : "#6d28d9";
  const inner =
    kind === "pickup"
      ? `<div style="width:12px;height:12px;border-radius:50%;background:${color};box-shadow:0 0 0 4px rgba(139,92,246,.28),0 1px 4px rgba(0,0,0,.45)"></div>`
      : kind === "stop"
        ? `<div style="width:9px;height:9px;border-radius:2px;background:#a78bfa;box-shadow:0 0 0 3px rgba(167,139,250,.25)"></div>`
        : `<div style="width:14px;height:14px;border-radius:50%;border:3px solid ${color};background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.45)"></div>`;
  return L.divIcon({
    className: "heride-route-endpoint",
    html: `<div style="display:grid;place-items:center;width:22px;height:22px">${inner}</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

/** The rider's own live GPS position — blue, to read as "me", not "a place". */
function liveIcon(L: typeof Leaflet) {
  return L.divIcon({
    className: "heride-route-live",
    html: `<div style="width:16px;height:16px;border-radius:50%;background:#2f74ff;border:3px solid #fff;
      box-shadow:0 0 0 7px rgba(47,116,255,.18),0 1px 5px rgba(0,0,0,.4)"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

interface MapState {
  map: Leaflet.Map;
  L: typeof Leaflet;
  tiles: Leaflet.TileLayer;
  line: Leaflet.Polyline;
  markers: Leaflet.Marker[];
  liveM: Leaflet.Marker | null;
  watchId: number | null;
}

/**
 * Real map preview of the trip being built: the road-following route, its
 * endpoints, and the rider's live position.
 *
 * Replaces a stylised SVG sketch that drew the polyline on an empty panel with
 * `preserveAspectRatio="none"` — so the route was both mapless and geometrically
 * wrong, stretched to whatever shape the card happened to be.
 *
 * Non-interactive: this sits inside a vertically scrolling form, and a
 * draggable map there swallows the scroll gesture. "Choose on the map" in the
 * location picker is the interactive surface.
 *
 * Client-only — Leaflet touches `window`, so it loads inside an effect.
 */
export function RouteMapPreview({
  route,
  pickup,
  destination,
  stops = [],
  className,
}: RouteMapPreviewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef<MapState | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);
  const [ready, setReady] = useState(false);
  const [locating, setLocating] = useState(true);
  const dark = useThemeStore((s) => s.mode) === "dark";
  // Read inside the mount effect without making the theme a dependency there.
  const darkRef = useRef(dark);
  darkRef.current = dark;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const L = await import("leaflet");
      if (cancelled || !containerRef.current || stateRef.current) return;
      const map = L.map(containerRef.current, {
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        touchZoom: false,
        boxZoom: false,
        keyboard: false,
      }).setView([FALLBACK_CENTER.lat, FALLBACK_CENTER.lng], 12);
      const cfg = basemapTiles(darkRef.current);
      const tiles = L.tileLayer(cfg.url, { ...cfg.options }).addTo(map);
      const line = L.polyline([], {
        color: "#7c3aed",
        weight: 5,
        opacity: 0.95,
        lineJoin: "round",
      }).addTo(map);

      stateRef.current = { map, L, tiles, line, markers: [], liveM: null, watchId: null };

      // Same reason as the home map: Leaflet caches container size at init, and
      // this card is often laid out after the map is created.
      const observer = new ResizeObserver(() => map.invalidateSize());
      observer.observe(containerRef.current);
      observerRef.current = observer;

      // Live position, tracked for as long as the preview is on screen.
      if (typeof navigator !== "undefined" && navigator.geolocation) {
        stateRef.current.watchId = navigator.geolocation.watchPosition(
          (pos) => {
            const s = stateRef.current;
            if (!s) return;
            setLocating(false);
            const p: [number, number] = [pos.coords.latitude, pos.coords.longitude];
            if (!s.liveM) {
              s.liveM = L.marker(p, { icon: liveIcon(L), zIndexOffset: 600 }).addTo(s.map);
              // Nothing else to look at yet? Then centre on her.
              if (!route && !pickup && !destination) s.map.setView(p, 15);
            } else {
              s.liveM.setLatLng(p);
            }
          },
          () => setLocating(false),
          { enableHighAccuracy: true, maximumAge: 10_000, timeout: 8_000 },
        );
      } else {
        setLocating(false);
      }

      setReady(true);
    })();

    return () => {
      cancelled = true;
      observerRef.current?.disconnect();
      observerRef.current = null;
      const s = stateRef.current;
      if (s) {
        if (s.watchId !== null && typeof navigator !== "undefined") {
          navigator.geolocation.clearWatch(s.watchId);
        }
        s.map.remove();
      }
      stateRef.current = null;
      setReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Swap the basemap in place when the theme flips — cheaper than rebuilding
  // the map, and it keeps the current view and markers.
  useEffect(() => {
    const s = stateRef.current;
    if (!s) return;
    const cfg = basemapTiles(dark);
    s.tiles.setUrl(cfg.url);
  }, [ready, dark]);

  /**
   * Stable change signal for the draw effect.
   *
   * Callers build `stops` with `.map(...)`, so it is a fresh array on every
   * render — depending on it directly would re-run the draw and re-fit the
   * bounds continuously, which reads as the map twitching.
   */
  const shapeKey = [
    route?.polyline.length ?? 0,
    route?.distanceKm ?? 0,
    pickup?.lat,
    pickup?.lng,
    destination?.lat,
    destination?.lng,
    stops.map((p) => `${p.lat},${p.lng}`).join("|"),
  ].join(";");

  // Draw the route + endpoints and frame them.
  useEffect(() => {
    const s = stateRef.current;
    if (!s) return;
    const { L, map } = s;

    s.markers.forEach((m) => m.remove());
    s.markers = [];

    // Prefer the real road geometry; fall back to a straight pickup→stops→dest
    // line so the card still shows the shape of the trip while routing is in
    // flight or unavailable.
    const shape: GeoPoint[] =
      route && route.polyline.length >= 2
        ? [...route.polyline]
        : [pickup, ...stops, destination].filter((p): p is GeoPoint => Boolean(p));

    s.line.setLatLngs(shape.map((p) => [p.lat, p.lng] as [number, number]));
    s.line.setStyle({ dashArray: route && route.polyline.length >= 2 ? undefined : "6 8" });

    if (pickup) {
      s.markers.push(
        L.marker([pickup.lat, pickup.lng], {
          icon: endpointIcon(L, "pickup"),
          interactive: false,
        }).addTo(map),
      );
    }
    for (const stop of stops) {
      s.markers.push(
        L.marker([stop.lat, stop.lng], {
          icon: endpointIcon(L, "stop"),
          interactive: false,
        }).addTo(map),
      );
    }
    if (destination) {
      s.markers.push(
        L.marker([destination.lat, destination.lng], {
          icon: endpointIcon(L, "dest"),
          interactive: false,
        }).addTo(map),
      );
    }

    if (shape.length >= 2) {
      map.fitBounds(L.latLngBounds(shape.map((p) => [p.lat, p.lng] as [number, number])), {
        padding: [28, 28],
      });
    } else if (shape.length === 1) {
      map.setView([shape[0].lat, shape[0].lng], 15);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, shapeKey]);

  const hasSomething = Boolean(route || pickup || destination);

  return (
    <div
      className={cn(
        "relative isolate overflow-hidden rounded-3xl border border-border/60 bg-card shadow-soft",
        "aspect-[16/10]",
        className,
      )}
    >
      <div ref={containerRef} className="absolute inset-0" aria-hidden />

      {/* Tells her the blue dot is her, and that it's still resolving. */}
      <div className="pointer-events-none absolute left-3 top-3 z-[500] flex items-center gap-1.5 rounded-full bg-card/90 px-2.5 py-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground shadow-soft backdrop-blur">
        <LocateFixed
          className={cn("h-3 w-3", locating ? "text-muted-foreground" : "text-primary")}
        />
        {locating ? "Locating you" : "Your live location"}
      </div>

      {!hasSomething && (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 z-[500] text-center text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          Pick a pickup and destination
        </div>
      )}
    </div>
  );
}
