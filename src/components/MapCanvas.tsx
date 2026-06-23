import { useEffect, useRef } from "react";

// Dark, feminine-friendly Google Maps style
const PINK_DARK_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#1a1416" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a1416" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#d9b8c2" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#2a1f24" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#332026" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#1a1416" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#5a2a3a" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#2a1f24" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0d0709" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#5a3a45" }] },
];

const CALLBACK_NAME = "__heriRideMapsInit";
const SCRIPT_ID = "heriride-google-maps";

let mapsReady: Promise<typeof google.maps> | null = null;

function loadGoogleMaps(): Promise<typeof google.maps> {
  if (typeof window === "undefined") return Promise.reject(new Error("ssr"));
  if ((window as any).google?.maps) return Promise.resolve((window as any).google.maps);
  if (mapsReady) return mapsReady;

  const key = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY;
  const channel = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID;
  if (!key) return Promise.reject(new Error("Missing Google Maps browser key"));

  mapsReady = new Promise((resolve, reject) => {
    (window as any)[CALLBACK_NAME] = () => resolve((window as any).google.maps);
    if (document.getElementById(SCRIPT_ID)) return;
    const s = document.createElement("script");
    s.id = SCRIPT_ID;
    s.async = true;
    s.defer = true;
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&loading=async&callback=${CALLBACK_NAME}${channel ? `&channel=${channel}` : ""}`;
    s.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(s);
  });
  return mapsReady;
}

export type MapPoint = { lat: number; lng: number };

export function MapCanvas({
  showRoute = false,
  pickup,
  drop,
  driver,
  className = "",
}: {
  showRoute?: boolean;
  pickup?: MapPoint;
  drop?: MapPoint;
  driver?: MapPoint | null;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const lineRef = useRef<google.maps.Polyline | null>(null);

  const center = pickup ?? drop ?? { lat: -1.2921, lng: 36.8219 }; // Nairobi default

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !ref.current) return;
        if (!mapRef.current) {
          mapRef.current = new maps.Map(ref.current, {
            center,
            zoom: 14,
            disableDefaultUI: true,
            gestureHandling: "greedy",
            styles: PINK_DARK_STYLE,
            backgroundColor: "#1a1416",
          });
        }
      })
      .catch((e) => console.warn("[MapCanvas]", e));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !(window as any).google?.maps) return;
    const maps = (window as any).google.maps as typeof google.maps;

    // Clear previous overlays
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    if (lineRef.current) {
      lineRef.current.setMap(null);
      lineRef.current = null;
    }

    const bounds = new maps.LatLngBounds();
    const addMarker = (pos: MapPoint, color: string, label?: string) => {
      const m = new maps.Marker({
        position: pos,
        map,
        label: label ? { text: label, color: "#fff", fontSize: "10px", fontWeight: "700" } : undefined,
        icon: {
          path: maps.SymbolPath.CIRCLE,
          scale: 9,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: "#1a1416",
          strokeWeight: 2,
        },
      });
      markersRef.current.push(m);
      bounds.extend(pos);
    };

    if (pickup) addMarker(pickup, "#FFC0CB", "P");
    if (drop) addMarker(drop, "#ffffff", "D");
    if (driver) addMarker(driver, "#ff4d8d");

    if (showRoute && pickup && drop) {
      lineRef.current = new maps.Polyline({
        path: [pickup, drop],
        geodesic: true,
        strokeColor: "#FFC0CB",
        strokeOpacity: 0.9,
        strokeWeight: 3,
        map,
      });
    }

    const pts = [pickup, drop, driver].filter(Boolean) as MapPoint[];
    if (pts.length > 1) {
      map.fitBounds(bounds, 60);
    } else if (pts.length === 1) {
      map.setCenter(pts[0]);
      map.setZoom(15);
    }
  }, [pickup?.lat, pickup?.lng, drop?.lat, drop?.lng, driver?.lat, driver?.lng, showRoute]);

  return (
    <div className={`relative w-full h-full overflow-hidden bg-noir ${className}`}>
      <div ref={ref} className="absolute inset-0 w-full h-full" />
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_60px_rgba(0,0,0,0.55)]" />
    </div>
  );
}