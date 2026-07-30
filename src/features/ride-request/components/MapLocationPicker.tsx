import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import type * as Leaflet from "leaflet";
import {
  ArrowLeft,
  Check,
  Clock,
  Crosshair,
  Loader2,
  Map as MapIcon,
  MapPin,
  Search,
} from "lucide-react";
import type { GeoPoint, Place } from "@/types/ride";
import { basemapTiles } from "@/services/maps/tiles";
import { useThemeStore } from "@/store/theme.store";
import { reverseGeocode, searchPlaces, type GeoResult } from "@/services/maps/geocoding";
import { hasGoogleAuthFailed, isGoogleMapsEnabled } from "@/services/maps/google-loader";
import { GooglePickMap } from "./GooglePickMap";

interface MapLocationPickerProps {
  readonly title: string;
  readonly initial: GeoPoint | null;
  /** Saved / popular places shown before the user types (Uber-style shortcuts). */
  readonly recents?: readonly Place[];
  readonly onSelect: (place: Place) => void;
  readonly onClose: () => void;
}

const NAIROBI: GeoPoint = { lat: -1.2921, lng: 36.8219 };

interface MapState {
  map: Leaflet.Map;
  L: typeof Leaflet;
  userM: Leaflet.Marker | null;
  watchId: number | null;
  skipNextReverse: boolean;
}

/**
 * Uber/Bolt-style location entry. Opens on a SEARCH LIST (recent/saved places,
 * then live autocomplete as you type) — the map never dominates while you
 * search. "Choose on map" switches to a framed map with a centre pin for fine
 * placement. Free Photon geocoder + Leaflet; no API key.
 */
export function MapLocationPicker({
  title,
  initial,
  recents = [],
  onSelect,
  onClose,
}: MapLocationPickerProps) {
  const [mode, setMode] = useState<"search" | "map">("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<readonly GeoResult[]>([]);
  const [searching, setSearching] = useState(false);
  /** Set when no geocoder could be reached at all, as opposed to no matches. */
  const [unavailable, setUnavailable] = useState(false);
  const [locating, setLocating] = useState(false);

  // ---- search-mode autocomplete (debounced) ----
  useEffect(() => {
    if (query.trim().length < 3) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const t = setTimeout(() => {
      void searchPlaces(query, initial)
        .then((outcome) => {
          setResults(outcome.results);
          setUnavailable(outcome.unavailable);
        })
        .catch(() => {
          setResults([]);
          setUnavailable(true);
        })
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(t);
  }, [query, initial]);

  const pick = (place: Place) => {
    onSelect(place);
    onClose();
  };

  const useCurrentLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const r = await reverseGeocode(coords);
        setLocating(false);
        pick({
          id: crypto.randomUUID(),
          label: r?.label ?? "Current location",
          address: r?.address ?? "Your current position",
          coords,
        });
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  return (
    <div className="fixed inset-0 z-[2000] flex flex-col bg-background">
      {/* Header + search field */}
      <div className="space-y-3 border-b border-border/60 bg-card/80 p-4 pt-5 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={mode === "map" ? () => setMode("search") : onClose}
            aria-label="Back"
            className="grid h-9 w-9 place-items-center rounded-full text-foreground hover:bg-white/5"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <p className="font-display text-lg text-foreground">{title}</p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-background/60 px-3 py-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (mode !== "search") setMode("search");
            }}
            placeholder="Search for a place or address"
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            autoFocus
          />
          {searching && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />}
        </div>
      </div>

      {mode === "search" ? (
        <SearchList
          query={query}
          results={results}
          recents={recents}
          locating={locating}
          searching={searching}
          unavailable={unavailable}
          onPickResult={(r) =>
            pick({ id: crypto.randomUUID(), label: r.label, address: r.address, coords: r.coords })
          }
          onPickRecent={pick}
          onUseCurrent={useCurrentLocation}
          onChooseOnMap={() => setMode("map")}
        />
      ) : (
        <MapPickMode initial={initial} title={title} onConfirm={pick} />
      )}
    </div>
  );
}

/* -------------------- search list (default) -------------------- */

function Shortcut({
  icon,
  label,
  sub,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/5"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm text-foreground">{label}</span>
        <span className="block truncate text-xs text-muted-foreground">{sub}</span>
      </span>
    </button>
  );
}

function SearchList({
  query,
  results,
  recents,
  locating,
  searching,
  unavailable,
  onPickResult,
  onPickRecent,
  onUseCurrent,
  onChooseOnMap,
}: {
  query: string;
  results: readonly GeoResult[];
  recents: readonly Place[];
  locating: boolean;
  searching: boolean;
  unavailable: boolean;
  onPickResult: (r: GeoResult) => void;
  onPickRecent: (p: Place) => void;
  onUseCurrent: () => void;
  onChooseOnMap: () => void;
}) {
  const typing = query.trim().length >= 3;
  return (
    <div className="flex-1 overflow-y-auto">
      {/* quick actions always available */}
      <div className="border-b border-border/50">
        <Shortcut
          icon={
            locating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Crosshair className="h-4 w-4" />
            )
          }
          label="Use my current location"
          sub="Detect where you are now"
          onClick={onUseCurrent}
        />
        <Shortcut
          icon={<MapIcon className="h-4 w-4" />}
          label="Choose on the map"
          sub="Drop a pin exactly where you want"
          onClick={onChooseOnMap}
        />
      </div>

      {typing ? (
        results.length > 0 ? (
          <div>
            {results.map((r, i) => (
              <button
                key={`${r.coords.lat}-${r.coords.lng}-${i}`}
                type="button"
                onClick={() => onPickResult(r)}
                className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-white/5"
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="min-w-0">
                  <span className="block truncate text-sm text-foreground">{r.label}</span>
                  <span className="block truncate text-xs text-muted-foreground">{r.address}</span>
                </span>
              </button>
            ))}
          </div>
        ) : searching ? null : unavailable ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">
            Can&apos;t reach place search right now. Check your connection, or drop a pin with
            &ldquo;Choose on the map&rdquo;.
          </p>
        ) : (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">
            No matches — try a different search, or choose on the map.
          </p>
        )
      ) : recents.length > 0 ? (
        <div>
          <p className="px-4 pt-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Saved &amp; popular
          </p>
          {recents.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onPickRecent(p)}
              className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-white/5"
            >
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0">
                <span className="block truncate text-sm text-foreground">{p.label}</span>
                <span className="block truncate text-xs text-muted-foreground">{p.address}</span>
              </span>
            </button>
          ))}
        </div>
      ) : (
        <p className="px-4 py-6 text-center text-sm text-muted-foreground">
          Start typing to search for a destination.
        </p>
      )}
    </div>
  );
}

/* -------------------- map pick mode -------------------- */

function MapPickMode({
  initial,
  title,
  onConfirm,
}: {
  initial: GeoPoint | null;
  title: string;
  onConfirm: (p: Place) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef<MapState | null>(null);
  const [center, setCenter] = useState<GeoPoint>(initial ?? NAIROBI);
  const [address, setAddress] = useState("Move the map to choose a spot");
  const [label, setLabel] = useState("Pinned location");
  const [busy, setBusy] = useState(false);
  const useGoogle = isGoogleMapsEnabled() && !hasGoogleAuthFailed();
  const recenterRef = useRef<((p: GeoPoint) => void) | null>(null);

  /** Shared by both engines: turn the new centre into a label + address. */
  const resolveCenter = (point: GeoPoint) => {
    setCenter(point);
    setBusy(true);
    void reverseGeocode(point).then((r) => {
      setBusy(false);
      setAddress(r?.address ?? `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`);
      setLabel(r?.label ?? "Pinned location");
    });
  };

  useEffect(() => {
    if (useGoogle) return; // the Google map manages its own lifecycle
    let cancelled = false;
    void (async () => {
      const L = await import("leaflet");
      if (cancelled || !containerRef.current || stateRef.current) return;
      const start = initial ?? NAIROBI;
      const map = L.map(containerRef.current, {
        zoomControl: true,
        attributionControl: true,
      }).setView([start.lat, start.lng], 15);
      // Theme read at mount — the picker is a short-lived modal, so there is
      // no toggle to follow while it is open.
      const tiles = basemapTiles(useThemeStore.getState().mode === "dark");
      L.tileLayer(tiles.url, { ...tiles.options }).addTo(map);
      stateRef.current = { map, L, userM: null, watchId: null, skipNextReverse: false };
      const onMoveEnd = () => {
        const s = stateRef.current;
        if (!s) return;
        const c = s.map.getCenter();
        const point = { lat: c.lat, lng: c.lng };
        setCenter(point);
        setBusy(true);
        void reverseGeocode(point).then((r) => {
          setBusy(false);
          setAddress(r?.address ?? `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`);
          setLabel(r?.label ?? "Pinned location");
        });
      };
      map.on("moveend", onMoveEnd);
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

  const useMyLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setBusy(false);
        const point = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        if (useGoogle) recenterRef.current?.(point);
        else stateRef.current?.map.setView([point.lat, point.lng], 16);
      },
      () => setBusy(false),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  return (
    <>
      <div className="relative flex-1">
        {useGoogle ? (
          <GooglePickMap
            initial={initial ?? NAIROBI}
            onCenterChange={resolveCenter}
            onReady={(recenter) => {
              recenterRef.current = recenter;
            }}
          />
        ) : (
          <div
            ref={containerRef}
            className="h-full w-full"
            role="application"
            aria-label="Location picker map"
          />
        )}
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
          onClick={() => onConfirm({ id: crypto.randomUUID(), label, address, coords: center })}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-pink py-3 text-sm font-semibold text-noir"
        >
          <Check className="h-4 w-4" /> Confirm {title.replace(/^set /i, "")}
        </button>
      </div>
    </>
  );
}
