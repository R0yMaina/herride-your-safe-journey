import { useEffect, useRef, useState, type ReactNode } from "react";
import "leaflet/dist/leaflet.css";
import type * as Leaflet from "leaflet";
import { LocateFixed, Maximize2, Minus, Plus } from "lucide-react";
import type { GeoPoint, RouteEstimate } from "@/types/ride";
import { basemapTiles } from "@/services/maps/tiles";
import { enableCooperativeGestures } from "@/services/maps/leaflet-gestures";
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
  const [wheelHint, setWheelHint] = useState(false);
  /** True once she has panned or zoomed, so auto-framing backs off. */
  const [movedByUser, setMovedByUser] = useState(false);
  const detachGesturesRef = useRef<(() => void) | null>(null);
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
        // Our own buttons sit in the corner instead — Leaflet's default control
        // doesn't inherit the design tokens.
        zoomControl: false,
        attributionControl: false,
        boxZoom: false,
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

      // Pan/zoom without stealing the page's scroll — two fingers here, since
      // this card lives inside a scrolling form.
      detachGesturesRef.current = enableCooperativeGestures(map, containerRef.current, {
        requireTwoFingerPan: true,
        onWheelHint: setWheelHint,
      });

      // Once she has moved the map herself, stop re-framing it under her; the
      // Recentre button is how she asks for the route framing back.
      const markMoved = () => setMovedByUser(true);
      map.on("dragend", markMoved);
      map.on("zoomend", markMoved);

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
      detachGesturesRef.current?.();
      detachGesturesRef.current = null;
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

    // Don't yank the view back while she is looking around. A changed route is
    // still worth re-framing, so this only holds until the shape changes.
    if (!movedByUser) frame(shape);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, shapeKey]);

  // A new route means new framing is wanted again, even after panning.
  useEffect(() => setMovedByUser(false), [shapeKey]);

  /** Fits the given shape, or the current one, into the frame. */
  function frame(shape?: readonly GeoPoint[]) {
    const s = stateRef.current;
    if (!s) return;
    const pts =
      shape ??
      (route && route.polyline.length >= 2
        ? route.polyline
        : [pickup, ...stops, destination].filter((p): p is GeoPoint => Boolean(p)));
    if (pts.length >= 2) {
      s.map.fitBounds(s.L.latLngBounds(pts.map((p) => [p.lat, p.lng] as [number, number])), {
        padding: [28, 28],
      });
    } else if (pts.length === 1) {
      s.map.setView([pts[0].lat, pts[0].lng], 15);
    }
  }

  const hasSomething = Boolean(route || pickup || destination);

  return (
    <div
      className={cn(
        "relative isolate overflow-hidden rounded-3xl border border-border/60 bg-card shadow-soft",
        "aspect-[16/10]",
        className,
      )}
    >
      {/* Interactive, so it is exposed to assistive tech rather than hidden.
          Leaflet's keyboard handler pans with the arrow keys once focused. */}
      <div
        ref={containerRef}
        className="absolute inset-0"
        role="application"
        aria-label="Trip route map — pan with two fingers, zoom with the buttons or ctrl and scroll"
      />

      {/* Tells her the blue dot is her, and that it's still resolving. */}
      <div className="pointer-events-none absolute left-3 top-3 z-[500] flex items-center gap-1.5 rounded-full bg-card/90 px-2.5 py-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground shadow-soft backdrop-blur">
        <LocateFixed
          className={cn("h-3 w-3", locating ? "text-muted-foreground" : "text-primary")}
        />
        {locating ? "Locating you" : "Your live location"}
      </div>

      {/* Zoom + recentre. Buttons matter beyond convenience: they are the only
          way to zoom without a trackpad modifier or two free fingers. */}
      <div className="absolute bottom-3 right-3 z-[500] flex flex-col gap-1.5">
        <MapButton label="Zoom in" onClick={() => stateRef.current?.map.zoomIn()}>
          <Plus className="h-4 w-4" />
        </MapButton>
        <MapButton label="Zoom out" onClick={() => stateRef.current?.map.zoomOut()}>
          <Minus className="h-4 w-4" />
        </MapButton>
        {hasSomething && (
          <MapButton
            label="Recentre on route"
            onClick={() => {
              setMovedByUser(false);
              frame();
            }}
          >
            <Maximize2 className="h-4 w-4" />
          </MapButton>
        )}
      </div>

      {/* The cooperative-gesture nudge, same idea as Google Maps' overlay. */}
      {wheelHint && (
        <div className="pointer-events-none absolute inset-0 z-[600] grid place-items-center bg-noir/45 backdrop-blur-[1px]">
          <p className="rounded-full bg-card/95 px-3.5 py-2 text-xs font-medium text-foreground shadow-soft">
            Hold ctrl (or ⌘) and scroll to zoom
          </p>
        </div>
      )}

      {!hasSomething && (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 z-[500] text-center text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          Pick a pickup and destination
        </div>
      )}
    </div>
  );
}

/** Small round control that floats over a map. */
function MapButton({
  label,
  onClick,
  children,
}: {
  readonly label: string;
  readonly onClick: () => void;
  readonly children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="grid h-9 w-9 place-items-center rounded-full border border-border/60 bg-card/90 text-foreground shadow-soft backdrop-blur transition-colors hover:border-primary/40 hover:text-primary"
    >
      {children}
    </button>
  );
}
