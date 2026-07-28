import { useEffect, useRef } from "react";
import type { GeoPoint } from "@/types/ride";
import { loadGoogleMaps } from "@/services/maps/google-loader";

interface GooglePickMapProps {
  readonly initial: GeoPoint;
  /** Fired when the map settles on a new centre (the pin position). */
  readonly onCenterChange: (point: GeoPoint) => void;
  /** Exposes a recentre fn so the parent's "my location" button can drive it. */
  readonly onReady?: (recenter: (point: GeoPoint) => void) => void;
}

/**
 * Drop-a-pin map on Google. Same contract as the Leaflet version: the pin is
 * fixed at the centre of the frame and the map moves under it, so the centre
 * IS the selection. Client-only — the SDK loads inside the effect.
 */
export function GooglePickMap({ initial, onCenterChange, onReady }: GooglePickMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  // Keep callbacks fresh without re-creating the map.
  const cbRef = useRef({ onCenterChange, onReady });
  cbRef.current = { onCenterChange, onReady };

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const g = await loadGoogleMaps();
      if (cancelled || !containerRef.current || mapRef.current) return;
      const map = new g.maps.Map(containerRef.current, {
        center: initial,
        zoom: 16,
        disableDefaultUI: true,
        zoomControl: true,
        gestureHandling: "greedy",
        clickableIcons: false,
      });
      mapRef.current = map;
      map.addListener("idle", () => {
        const c = map.getCenter();
        if (c) cbRef.current.onCenterChange({ lat: c.lat(), lng: c.lng() });
      });
      cbRef.current.onReady?.((point) => {
        map.setCenter(point);
        map.setZoom(16);
      });
    })();
    return () => {
      cancelled = true;
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      className="h-full w-full"
      role="application"
      aria-label="Location picker map"
    />
  );
}
