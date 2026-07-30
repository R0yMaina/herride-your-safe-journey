import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import type * as Leaflet from "leaflet";
import { LocateFixed } from "lucide-react";
import type { GeoPoint } from "@/types/ride";
import type { NearbyDriver } from "@/services/driver";
import { basemapTiles } from "@/services/maps/tiles";
import { enableCooperativeGestures } from "@/services/maps/leaflet-gestures";
import { FALLBACK_CENTER } from "@/lib/geo";
import { useThemeStore } from "@/store/theme.store";
import { cn } from "@/lib/utils";

interface HomeMapProps {
  /** Where to centre. Null until the browser resolves a position. */
  readonly center: GeoPoint | null;
  readonly drivers: readonly NearbyDriver[];
  readonly className?: string;
}

/** The rider's own position — violet dot with a soft halo. */
function riderIcon(L: typeof Leaflet) {
  return L.divIcon({
    className: "heride-home-rider",
    html: `<div style="width:16px;height:16px;border-radius:50%;background:#7c3aed;border:3px solid #fff;
      box-shadow:0 0 0 7px rgba(124,58,237,.18),0 2px 6px rgba(0,0,0,.35)"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

/** An available driver — small car puck, same language as the trip map. */
function driverIcon(L: typeof Leaflet) {
  return L.divIcon({
    className: "heride-home-driver",
    html: `<div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(145deg,#a78bfa,#7c3aed);
      display:grid;place-items:center;box-shadow:0 0 0 3px rgba(167,139,250,.28),0 4px 12px rgba(0,0,0,.3)">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2"
        stroke-linecap="round" stroke-linejoin="round"><path d="M5 17H3v-5l2-5h11l3 5h1v5h-2"/>
        <circle cx="7.5" cy="17" r="1.6"/><circle cx="16.5" cy="17" r="1.6"/></svg></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

interface MapState {
  map: Leaflet.Map;
  L: typeof Leaflet;
  tiles: Leaflet.TileLayer;
  riderM: Leaflet.Marker | null;
  driverMs: Map<string, Leaflet.Marker>;
}

/**
 * The ambient map behind the home screen: the rider's position and the
 * verified drivers currently available around her.
 *
 * Pannable and zoomable. The home screen is a fixed-height surface with no
 * page scroll, so a one-finger drag is safe here — unlike the booking flow's
 * preview, which sits in a scrolling form and needs two.
 *
 * Once she moves the map herself we stop recentring on her GPS, or every tick
 * would drag the view back from wherever she was looking.
 *
 * Client-only: Leaflet touches `window`, so it is imported inside an effect
 * and never runs during SSR.
 */
export function HomeMap({ center, drivers, className }: HomeMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef<MapState | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);
  /**
   * Flipped once Leaflet has loaded and the map exists.
   *
   * The draw effects below bail when there is no map yet, and their own deps
   * won't change just because the import finished — so without this they'd
   * never run again and data that arrived first would never be drawn.
   */
  const [ready, setReady] = useState(false);
  /** True once she has panned or zoomed, so we stop recentring on her. */
  const [movedByUser, setMovedByUser] = useState(false);
  const detachGesturesRef = useRef<(() => void) | null>(null);
  const dark = useThemeStore((s) => s.mode) === "dark";
  // Read inside the mount effect without making the theme a dependency there.
  const darkRef = useRef(dark);
  darkRef.current = dark;

  // Mount once. Centre updates are handled by the effect below, so a late
  // geolocation fix pans the existing map instead of rebuilding it.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const L = await import("leaflet");
      if (cancelled || !containerRef.current || stateRef.current) return;
      const map = L.map(containerRef.current, {
        zoomControl: false,
        attributionControl: false,
        boxZoom: false,
      }).setView([center?.lat ?? FALLBACK_CENTER.lat, center?.lng ?? FALLBACK_CENTER.lng], 14);
      const cfg = basemapTiles(darkRef.current);
      const tiles = L.tileLayer(cfg.url, { ...cfg.options }).addTo(map);
      stateRef.current = { map, L, tiles, riderM: null, driverMs: new Map() };

      /**
       * Leaflet caches the container size at init. This map is created inside
       * a flex/absolute layout that often hasn't resolved yet, so without a
       * revalidation it stays at 0×0 — and every marker then projects to the
       * wrong pixel and paints outside the map, over the sheet.
       */
      const observer = new ResizeObserver(() => map.invalidateSize());
      observer.observe(containerRef.current);
      observerRef.current = observer;

      // One finger is enough here: the home screen is a fixed-height surface
      // with no page scroll to compete for.
      detachGesturesRef.current = enableCooperativeGestures(map, containerRef.current, {
        requireTwoFingerPan: false,
      });

      map.on("dragend zoomend", () => setMovedByUser(true));

      setReady(true);
    })();

    return () => {
      cancelled = true;
      observerRef.current?.disconnect();
      observerRef.current = null;
      detachGesturesRef.current?.();
      detachGesturesRef.current = null;
      stateRef.current?.map.remove();
      stateRef.current = null;
      setReady(false);
    };
    // Mount-only: `center` is read for the initial view, then owned by the
    // effect below. Re-running here would tear the map down on every fix.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Swap the basemap in place when the theme flips, keeping view and markers.
  useEffect(() => {
    const s = stateRef.current;
    if (!s) return;
    s.tiles.setUrl(basemapTiles(dark).url);
  }, [ready, dark]);

  // Centre + rider dot.
  useEffect(() => {
    const s = stateRef.current;
    if (!s || !center) return;
    // Only follow her while she hasn't taken the map over herself — otherwise
    // every GPS tick would drag the view back from wherever she panned to.
    if (!movedByUser) s.map.setView([center.lat, center.lng], 14, { animate: true });
    if (!s.riderM) {
      s.riderM = s.L.marker([center.lat, center.lng], {
        icon: riderIcon(s.L),
        zIndexOffset: 500,
        interactive: false,
      }).addTo(s.map);
    } else {
      s.riderM.setLatLng([center.lat, center.lng]);
    }
  }, [ready, center?.lat, center?.lng]);

  // Driver pucks, reconciled by id so unchanged drivers don't flicker.
  useEffect(() => {
    const s = stateRef.current;
    if (!s) return;
    const seen = new Set<string>();
    for (const d of drivers) {
      seen.add(d.driverUserId);
      const existing = s.driverMs.get(d.driverUserId);
      if (existing) existing.setLatLng([d.lat, d.lng]);
      else {
        s.driverMs.set(
          d.driverUserId,
          s.L.marker([d.lat, d.lng], { icon: driverIcon(s.L), interactive: false }).addTo(s.map),
        );
      }
    }
    for (const [id, marker] of s.driverMs) {
      if (!seen.has(id)) {
        marker.remove();
        s.driverMs.delete(id);
      }
    }
  }, [ready, drivers]);

  // overflow-hidden is a backstop: nothing Leaflet draws should ever escape
  // the map's box and land on the sheet.
  return (
    <div className={cn("relative h-full w-full overflow-hidden", className)}>
      <div
        ref={containerRef}
        className="absolute inset-0"
        role="application"
        aria-label="Map of your area and nearby drivers"
      />
      {/* Only offered once she has moved away — before that it would do
          nothing, and the home screen has little room to spare. */}
      {movedByUser && center && (
        <button
          type="button"
          onClick={() => {
            setMovedByUser(false);
            stateRef.current?.map.setView([center.lat, center.lng], 14, { animate: true });
          }}
          aria-label="Recentre on my location"
          title="Recentre on my location"
          className="absolute right-3 top-20 z-[500] grid h-9 w-9 place-items-center rounded-full border border-border/60 bg-card/90 text-foreground shadow-soft backdrop-blur transition-colors hover:border-primary/40 hover:text-primary"
        >
          <LocateFixed className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
