import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, MapPin, Navigation, Power } from "lucide-react";
import { Container, GlassCard, PageHeader, ScreenWrapper, Section } from "@/components/common";
import { driverService } from "@/services/driver";
import { canTransition, type RideRecord, type RideStatus } from "@/types/ride";
import { formatCurrency } from "@/features/ride-request/lib/format";
import { getCurrentPing } from "./lib/geo";

const NEXT_LABEL: Partial<Record<RideStatus, { to: RideStatus; label: string }>> = {
  accepted: { to: "arrived", label: "I've arrived" },
  arrived: { to: "in_progress", label: "Start trip" },
  in_progress: { to: "completed", label: "Complete trip" },
};

const PING_MS = 15000;

export function DriverHomeScreen() {
  const [online, setOnline] = useState(false);
  const [busy, setBusy] = useState(false);
  const [openRides, setOpenRides] = useState<readonly RideRecord[]>([]);
  const [activeRide, setActiveRide] = useState<RideRecord | null>(null);
  const pingTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshOpen = useCallback(async () => {
    try {
      setOpenRides(await driverService.listOpenRides());
    } catch {
      /* transient; realtime will re-trigger */
    }
  }, []);

  // Initial state: are we already online, and do we have an active ride?
  useEffect(() => {
    void driverService.isOnline().then(setOnline);
  }, []);

  // Subscribe to the open-ride pool while online.
  useEffect(() => {
    if (!online || activeRide) return;
    void refreshOpen();
    const sub = driverService.subscribeOpenRides(() => void refreshOpen());
    return () => sub.unsubscribe();
  }, [online, activeRide, refreshOpen]);

  // Heartbeat location pings while online.
  useEffect(() => {
    if (!online) return;
    const tick = async () => {
      try {
        await driverService.pingLocation(await getCurrentPing());
      } catch {
        /* ignore */
      }
    };
    pingTimer.current = setInterval(tick, PING_MS);
    return () => {
      if (pingTimer.current) clearInterval(pingTimer.current);
    };
  }, [online]);

  const toggleOnline = async () => {
    setBusy(true);
    try {
      if (online) {
        await driverService.goOffline();
        setOnline(false);
        setOpenRides([]);
      } else {
        await driverService.goOnline(await getCurrentPing());
        setOnline(true);
        toast.success("You're online");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update status");
    } finally {
      setBusy(false);
    }
  };

  const claim = async (rideId: string) => {
    setBusy(true);
    try {
      const ride = await driverService.claim(rideId);
      setActiveRide(ride);
      setOpenRides([]);
      toast.success("Ride accepted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ride no longer available");
      void refreshOpen();
    } finally {
      setBusy(false);
    }
  };

  const advance = async () => {
    if (!activeRide) return;
    const step = NEXT_LABEL[activeRide.status];
    if (!step || !canTransition(activeRide.status, step.to)) return;
    setBusy(true);
    try {
      const updated = await driverService.transition(activeRide.id, step.to);
      if (updated.status === "completed") {
        toast.success("Trip complete");
        setActiveRide(null);
        setOnline(false); // freed; driver goes offline until they toggle back
        await driverService.goOffline().catch(() => {});
      } else {
        setActiveRide(updated);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update trip");
    } finally {
      setBusy(false);
    }
  };

  const step = activeRide ? NEXT_LABEL[activeRide.status] : undefined;

  return (
    <ScreenWrapper>
      <Container className="space-y-6">
        <PageHeader eyebrow="Driver" title="Drive with HeRide" />

        <GlassCard className="flex items-center justify-between">
          <div>
            <p className="font-display text-lg text-foreground">
              {online ? "You're online" : "You're offline"}
            </p>
            <p className="text-xs text-muted-foreground">
              {online ? "Receiving ride requests nearby" : "Go online to receive requests"}
            </p>
          </div>
          <button
            type="button"
            onClick={toggleOnline}
            disabled={busy || Boolean(activeRide)}
            className={`grid h-14 w-14 place-items-center rounded-full transition-colors disabled:opacity-50 ${
              online ? "bg-gradient-pink text-noir" : "bg-card/60 text-muted-foreground"
            }`}
          >
            {busy ? <Loader2 className="h-6 w-6 animate-spin" /> : <Power className="h-6 w-6" />}
          </button>
        </GlassCard>

        {activeRide ? (
          <Section title="Active trip">
            <GlassCard className="space-y-3">
              <div>
                <p className="text-sm text-foreground">{activeRide.pickup.address ?? "Pickup"}</p>
                <p className="text-sm text-foreground">
                  → {activeRide.destination.address ?? "Destination"}
                </p>
              </div>
              <p className="text-sm font-semibold text-primary">
                {formatCurrency(activeRide.fareEstimate ?? 0)}
              </p>
              {step && (
                <button
                  type="button"
                  onClick={advance}
                  disabled={busy}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-pink py-3 text-sm font-semibold text-noir disabled:opacity-60"
                >
                  <Navigation className="h-4 w-4" /> {step.label}
                </button>
              )}
            </GlassCard>
          </Section>
        ) : online ? (
          <Section title={`Open requests (${openRides.length})`}>
            {openRides.length === 0 ? (
              <GlassCard className="py-6 text-center text-sm text-muted-foreground">
                <MapPin className="mx-auto mb-2 h-6 w-6 opacity-60" />
                Waiting for ride requests…
              </GlassCard>
            ) : (
              <div className="space-y-3">
                {openRides.map((ride) => (
                  <GlassCard key={ride.id} className="space-y-2">
                    <p className="text-sm text-foreground">{ride.pickup.address ?? "Pickup"}</p>
                    <p className="text-sm text-foreground">
                      → {ride.destination.address ?? "Destination"}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-primary">
                        {formatCurrency(ride.fareEstimate ?? 0)}
                      </span>
                      <button
                        type="button"
                        onClick={() => claim(ride.id)}
                        disabled={busy}
                        className="rounded-full bg-gradient-pink px-5 py-2 text-sm font-semibold text-noir disabled:opacity-60"
                      >
                        Accept
                      </button>
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}
          </Section>
        ) : null}
      </Container>
    </ScreenWrapper>
  );
}
