import { useEffect, useRef } from "react";
import type { GeoPoint } from "@/types/ride";
import type { NearbyDriver } from "@/services/driver";
import { loadGoogleMaps } from "@/services/maps/google-loader";
import { FALLBACK_CENTER } from "@/lib/geo";
import { cn } from "@/lib/utils";

interface GoogleHomeMapProps {
  readonly center: GeoPoint | null;
  readonly drivers: readonly NearbyDriver[];
  readonly className?: string;
}

/** Violet dot for the rider, matching the Leaflet version's language. */
const RIDER_ICON = {
  path: 0 /* google.maps.SymbolPath.CIRCLE — inlined so the SDK isn't needed
             to build this object before it loads. */,
  scale: 7,
  fillColor: "#7c3aed",
  fillOpacity: 1,
  strokeColor: "#ffffff",
  strokeWeight: 3,
};

const DRIVER_ICON = {
  path: 0,
  scale: 6,
  fillColor: "#a78bfa",
  fillOpacity: 1,
  strokeColor: "#ffffff",
  strokeWeight: 2,
};

/**
 * The home screen's ambient map on Google.
 *
 * Same contract as {@link HomeMap}: shows the rider and the drivers available
 * around her, and is non-interactive because a pannable map under the home
 * sheet fights it for every touch.
 */
export function GoogleHomeMap({ center, drivers, className }: GoogleHomeMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const riderRef = useRef<google.maps.Marker | null>(null);
  const driverRefs = useRef(new Map<string, google.maps.Marker>());
  // Latest values, so the mount effect can read them without re-running.
  const dataRef = useRef({ center, drivers });
  dataRef.current = { center, drivers };

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const g = await loadGoogleMaps();
      if (cancelled || !containerRef.current || mapRef.current) return;
      const start = dataRef.current.center ?? FALLBACK_CENTER;
      mapRef.current = new g.maps.Map(containerRef.current, {
        center: start,
        zoom: 14,
        disableDefaultUI: true,
        gestureHandling: "none",
        keyboardShortcuts: false,
        clickableIcons: false,
      });
      draw(g);
    })();
    // Captured now: by cleanup time the ref could point at a different Map,
    // and clearing the wrong one would leak the markers we meant to drop.
    const markers = driverRefs.current;
    return () => {
      cancelled = true;
      riderRef.current = null;
      markers.clear();
      mapRef.current = null;
    };
  }, []);

  /** Reconciles markers against the latest props. Safe to call repeatedly. */
  function draw(g: typeof google) {
    const map = mapRef.current;
    if (!map) return;
    const { center: c, drivers: ds } = dataRef.current;

    if (c) {
      map.setCenter(c);
      if (!riderRef.current) {
        riderRef.current = new g.maps.Marker({
          map,
          position: c,
          icon: { ...RIDER_ICON, path: g.maps.SymbolPath.CIRCLE },
          clickable: false,
          zIndex: 500,
        });
      } else {
        riderRef.current.setPosition(c);
      }
    }

    const seen = new Set<string>();
    for (const d of ds) {
      seen.add(d.driverUserId);
      const existing = driverRefs.current.get(d.driverUserId);
      if (existing) existing.setPosition({ lat: d.lat, lng: d.lng });
      else {
        driverRefs.current.set(
          d.driverUserId,
          new g.maps.Marker({
            map,
            position: { lat: d.lat, lng: d.lng },
            icon: { ...DRIVER_ICON, path: g.maps.SymbolPath.CIRCLE },
            clickable: false,
          }),
        );
      }
    }
    for (const [id, marker] of driverRefs.current) {
      if (!seen.has(id)) {
        marker.setMap(null);
        driverRefs.current.delete(id);
      }
    }
  }

  // Redraw when the data changes, but only once the SDK and map exist.
  useEffect(() => {
    if (!mapRef.current || typeof google === "undefined") return;
    // `draw` reads the latest props from dataRef, so the coordinate deps here
    // are just the change signal.
    draw(google);
  }, [center?.lat, center?.lng, drivers]);

  return <div ref={containerRef} className={cn("h-full w-full", className)} aria-hidden />;
}
