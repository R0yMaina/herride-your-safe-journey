import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import type * as Leaflet from "leaflet";
import { Check, Crosshair, MapPin, Search, X } from "lucide-react";
import type { Place } from "@/types/ride";
import type { GeoPoint } from "@/types/ride";
import { LIGHT_TILES } from "@/services/maps/tiles";
import { reverseGeocode, searchPlaces, type GeoResult } from "@/services/maps/geocoding";

interface MapLocationPickerProps {
  readonly title: string;
  readonly initial: GeoPoint | null;
  readonly onSelect: (place: Place) => void;
  readonly onClose: () => void;
}

const NAIROBI: GeoPoint = { lat: -1.2921, lng: 36.8219 };

interface PickerState {
  map: Leaflet.Map;
  L: typeof Leaflet;
  userM: Leaflet.Marker | null;
  watchId: number | null;
  skipNextReverse: boolean;
}

/**
 * Full-screen map picker: pan/tap the map to drop the centre pin on a spot,
 * search an address (free Photon geocoder), or jump to your live GPS location.
 * The chosen point is reverse-geocoded to an address and returned as a Place.
 * Client-only (Leaflet). No API key.
 */
export function MapLocationPicker({ title, initial, onSelect, onClose }: MapLocationPickerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef<PickerState | null>(null);
  const [center, setCenter] = useState<GeoPoint>(initial ?? NAIROBI);
  const [address, setAddress] = useState<string>("Move the map to choose a spot");
  const [label, setLabel] = useState<string>("Pinned location");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<readonly GeoResult[]>([]);
  const [busy, setBusy] = useState(false);

  // Init map once.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const L = await import("leaflet");
      if (cancelled || !containerRef.current || stateRef.current) return;
      const start = initial ?? NAIROBI;
      const map = L.map(containerRef.current, {
        zoomControl: true,
        attributionControl: true,
      }).setView([start.lat, start.lng], 15);
      L.tileLayer(LIGHT_TILES.url, { ...LIGHT_TILES.options }).addTo(map);
      stateRef.current = { map, L, userM: null, watchId: null, skipNextReverse: false };

      const onMoveEnd = () => {
        const s = stateRef.current;
        if (!s) return;
        const c = s.map.getCenter();
        const point = { lat: c.lat, lng: c.lng };
        setCenter(point);
        if (s.skipNextReverse) {
          s.skipNextReverse = false;
          return;
        }
        setBusy(true);
        void reverseGeocode(point).then((r) => {
          setBusy(false);
          if (r) {
            setAddress(r.address);
            setLabel(r.label);
          } else {
            setAddress(`${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`);
            setLabel("Pinned location");
          }
        });
      };
      map.on("moveend", onMoveEnd);
      // Tapping the map recenters to that point (which triggers moveend).
      map.on("click", (e: Leaflet.LeafletMouseEvent) => map.panTo(e.latlng));
      onMoveEnd();
    })();
    return () => {
      cancelled = true;
      const s = stateRef.current;
      if (s) {
        if (s.watchId !== null && typeof navigator !== "undefined")
          navigator.geolocation.clearWatch(s.watchId);
        s.map.remove();
        stateRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced address search.
  useEffect(() => {
    if (query.trim().length < 3) {
      setResults([]);
      return;
    }
    const t = setTimeout(() => {
      void searchPlaces(query, center).then(setResults);
    }, 350);
    return () => clearTimeout(t);
  }, [query, center]);

  const goToResult = (r: GeoResult) => {
    const s = stateRef.current;
    setResults([]);
    setQuery("");
    setAddress(r.address);
    setLabel(r.label);
    if (s) {
      s.skipNextReverse = true; // keep the search result's nice label
      s.map.setView([r.coords.lat, r.coords.lng], 16);
    }
    setCenter(r.coords);
  };

  const useMyLocation = () => {
    const s = stateRef.current;
    if (!s || typeof navigator === "undefined" || !navigator.geolocation) return;
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setBusy(false);
        const p: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        s.map.setView(p, 16);
        if (!s.userM) {
          s.userM = s.L.marker(p, {
            icon: s.L.divIcon({
              className: "heride-user",
              html: `<div style="width:18px;height:18px;border-radius:50%;background:#2f74ff;border:3px solid #fff;box-shadow:0 0 0 6px rgba(47,116,255,.2)"></div>`,
              iconSize: [18, 18],
              iconAnchor: [9, 9],
            }),
            zIndexOffset: 500,
          }).addTo(s.map);
        } else {
          s.userM.setLatLng(p);
        }
        if (s.watchId === null) {
          s.watchId = navigator.geolocation.watchPosition(
            (u) => s.userM?.setLatLng([u.coords.latitude, u.coords.longitude]),
            () => {},
            { enableHighAccuracy: true, maximumAge: 10000 },
          );
        }
      },
      () => setBusy(false),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const confirm = () => {
    onSelect({ id: crypto.randomUUID(), label, address, coords: center });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[2000] flex flex-col bg-background">
      {/* Header + search */}
      <div className="space-y-3 border-b border-border/60 bg-card/80 p-4 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-muted-foreground"
          >
            <X className="h-5 w-5" />
          </button>
          <p className="font-display text-lg text-foreground">{title}</p>
        </div>
        <div className="relative">
          <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-background/60 px-3 py-2.5">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for a place or address"
              className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </div>
          {results.length > 0 && (
            <div className="absolute inset-x-0 top-full z-10 mt-1 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-lg">
              {results.map((r, i) => (
                <button
                  key={`${r.coords.lat}-${r.coords.lng}-${i}`}
                  type="button"
                  onClick={() => goToResult(r)}
                  className="flex w-full items-start gap-3 px-3 py-2.5 text-left hover:bg-white/5"
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-foreground">{r.label}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {r.address}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Map with fixed centre pin */}
      <div className="relative flex-1">
        <div
          ref={containerRef}
          className="h-full w-full"
          role="application"
          aria-label="Location picker map"
        />
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-[500] -translate-x-1/2 -translate-y-full">
          <MapPin className="h-9 w-9 fill-primary text-primary drop-shadow-lg" strokeWidth={1.5} />
        </div>
        <button
          type="button"
          onClick={useMyLocation}
          aria-label="Use my location"
          className="absolute bottom-4 right-4 z-[600] grid h-12 w-12 place-items-center rounded-full bg-card text-primary shadow-lg"
        >
          <Crosshair className="h-5 w-5" />
        </button>
      </div>

      {/* Selection + confirm */}
      <div className="space-y-3 border-t border-border/60 bg-card/90 p-4 backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div className="min-w-0">
            <p className="truncate font-display text-sm text-foreground">{label}</p>
            <p className="truncate text-xs text-muted-foreground">
              {busy ? "Finding address…" : address}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={confirm}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-pink py-3 text-sm font-semibold text-noir"
        >
          <Check className="h-4 w-4" /> Confirm {title.replace(/^set /i, "")}
        </button>
      </div>
    </div>
  );
}
