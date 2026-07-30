import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { HomeMapView } from "./components/HomeMapView";
import { HomeSheet } from "./components/HomeSheet";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";
import { walletService } from "@/services/wallet";
import { savedPlacesService } from "@/services/places";
import { promoService } from "@/services/promos";
import { driverService } from "@/services/driver";
import { ridesService } from "@/services/ride";
import { reverseGeocode } from "@/services/maps/geocoding";
import { getCurrentPosition } from "@/lib/geo";
import { ACTIVE_RIDE_STATUSES, type GeoPoint } from "@/types/ride";
import { useAuthStore } from "@/store/auth.store";
import { appConfig } from "@/config/app.config";

/** How often to re-ask who's available nearby. */
const DRIVERS_REFRESH_MS = 30_000;

function greetingFor(date: Date): string {
  const h = date.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/**
 * Map-first home: the rider's surroundings with the verified drivers actually
 * available around her, under a sheet that gets her into booking in one tap.
 *
 * Every number on this screen is real — wallet balance, saved places, live
 * offers and nearby drivers all come from the domain services. Nothing here
 * is seeded or faked, so an empty account looks empty rather than staged.
 */
export function HomeScreen() {
  const user = useAuthStore((s) => s.session?.user ?? null);
  const [center, setCenter] = useState<GeoPoint | null>(null);

  // Resolve the rider's position once on mount. `getCurrentPosition` never
  // rejects — a denied prompt still yields a usable centre.
  useEffect(() => {
    let cancelled = false;
    void getCurrentPosition().then(({ lat, lng }) => {
      if (!cancelled) setCenter({ lat, lng });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const { data: balance } = useQuery({
    queryKey: ["wallet", "balance"],
    queryFn: () => walletService.getBalance(),
  });

  const { data: savedPlaces } = useQuery({
    queryKey: ["saved-places"],
    queryFn: () => savedPlacesService.list(),
  });

  const { data: promos } = useQuery({
    queryKey: ["promos", "active"],
    queryFn: () => promoService.listActive(),
  });

  const { data: rides } = useQuery({
    queryKey: ["rides", "mine"],
    queryFn: () => ridesService.listMine(),
  });

  const { data: drivers } = useQuery({
    queryKey: ["drivers", "nearby", center?.lat, center?.lng],
    queryFn: () => driverService.nearbyDrivers(center!, 5, 10),
    enabled: center !== null,
    refetchInterval: DRIVERS_REFRESH_MS,
  });

  const { data: area, isPending: areaPending } = useQuery({
    queryKey: ["reverse-geocode", center?.lat, center?.lng],
    queryFn: () => reverseGeocode(center!),
    enabled: center !== null,
    staleTime: Infinity,
    retry: false,
  });

  // Three distinct states, so the chip never sits on "Locating…" forever when
  // the geocoder is unreachable or has no name for this spot.
  const areaLabel = center === null || areaPending ? "Locating…" : (area?.label ?? "Your area");

  const activeRide = rides?.find((r) => ACTIVE_RIDE_STATUSES.includes(r.status)) ?? null;

  return (
    <div className="relative flex h-[100dvh] w-full flex-col overflow-hidden">
      {/* Map fills the screen; the sheet floats over its lower half.
          `isolate` is load-bearing: Leaflet gives its marker pane z-index 600,
          which without a stacking context here outranks the sheet's z-10 and
          paints driver pucks on top of it. */}
      <div className="absolute inset-0 isolate z-0">
        <HomeMapView center={center} drivers={drivers ?? []} />
      </div>

      {/* Top chrome. Pointer events are re-enabled per control so the map
          isn't blanketed by an invisible overlay. */}
      <div className="pointer-events-none relative z-10 flex items-start justify-between gap-3 p-4">
        <div className="pointer-events-auto min-w-0 rounded-2xl border border-border/60 bg-card/90 px-3.5 py-2.5 shadow-soft backdrop-blur-xl">
          <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
            You are here
          </p>
          <p className="mt-0.5 truncate text-sm font-medium text-foreground">{areaLabel}</p>
        </div>
        <div className="pointer-events-auto flex shrink-0 items-center gap-2">
          <span
            className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-card/90 px-3 py-2 text-[11px] font-medium text-primary shadow-soft backdrop-blur-xl"
            title="Every driver on HeRide is a verified female driver"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Female-only
          </span>
          <NotificationBell />
        </div>
      </div>

      <div className="relative z-10 mt-auto">
        <HomeSheet
          greeting={greetingFor(new Date())}
          firstName={user?.profile.firstName ?? null}
          balance={balance?.balance ?? null}
          currency={balance?.currency ?? appConfig.defaultCurrency}
          savedPlaces={savedPlaces ?? []}
          promo={promos?.[0] ?? null}
          activeRideId={activeRide?.id ?? null}
        />
      </div>
    </div>
  );
}
